import { createContext, useContext, useState, useEffect } from 'react';

// ─── Editor credentials are fixed ──────────────────────────────────────────
export const EDITOR = { username: 'Fliker', password: 'JourneyFliker0465' } as const;

// ─── Viewer credentials – up to 5 accounts, stored in localStorage ─────────
const VIEWER_CREDS_KEY = 'jf_viewer_accounts';
export const MAX_VIEWERS = 5;

export interface ViewerAccount {
  id: string;           // stable random id
  username: string;
  password: string;
}

const DEFAULT_VIEWERS: ViewerAccount[] = [
  { id: 'default-1', username: 'viewer', password: 'view123' },
];

export function getViewerAccounts(): ViewerAccount[] {
  try {
    const raw = localStorage.getItem(VIEWER_CREDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return DEFAULT_VIEWERS;
}

export function saveViewerAccounts(accounts: ViewerAccount[]): void {
  localStorage.setItem(VIEWER_CREDS_KEY, JSON.stringify(accounts));
}

// ─── Session state ──────────────────────────────────────────────────────────
export type AdminRole = 'viewer' | 'editor';

interface AuthState {
  role: AdminRole | null;
  username: string | null;
}

interface AdminAuthContextType extends AuthState {
  login: (username: string, password: string) => boolean;
  logout: () => void;
  canEdit: boolean;
  viewerAccounts: ViewerAccount[];
  setViewerAccounts: (accounts: ViewerAccount[]) => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);
const SESSION_KEY = 'jf_admin_auth';

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : { role: null, username: null };
    } catch { return { role: null, username: null }; }
  });

  const [viewerAccounts, setViewerAccountsState] = useState<ViewerAccount[]>(getViewerAccounts);

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(auth));
  }, [auth]);

  const login = (username: string, password: string): boolean => {
    if (username === EDITOR.username && password === EDITOR.password) {
      setAuth({ role: 'editor', username });
      return true;
    }
    // Check against ALL stored viewer accounts
    const accounts = getViewerAccounts();
    const matched = accounts.find(a => a.username === username && a.password === password);
    if (matched) {
      setAuth({ role: 'viewer', username });
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuth({ role: null, username: null });
    sessionStorage.removeItem(SESSION_KEY);
  };

  const setViewerAccounts = (accounts: ViewerAccount[]) => {
    const clamped = accounts.slice(0, MAX_VIEWERS);
    saveViewerAccounts(clamped);
    setViewerAccountsState(clamped);
  };

  return (
    <AdminAuthContext.Provider value={{
      ...auth, login, logout,
      canEdit: auth.role === 'editor',
      viewerAccounts, setViewerAccounts,
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}
