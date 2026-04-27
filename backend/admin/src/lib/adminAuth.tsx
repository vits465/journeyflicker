import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from './api';

// ─── Role types ──────────────────────────────────────────────────────────────
export type AdminRole = 'editor' | 'co-editor';

interface AuthState {
  role: AdminRole | null;
  username: string | null;
}

interface AdminAuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  /** true only for the main editor account */
  canEdit: boolean;
  /** true for both editor AND co-editor (CRUD on tours/destinations/visas) */
  canCRUD: boolean;
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

  // Persist session
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(auth));
  }, [auth]);

  // Re-verify token on mount (handles page refresh / token expiry)
  useEffect(() => {
    const token = sessionStorage.getItem('jf_token');
    if (!token || !auth.role) return;
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error('expired'); return r.json(); })
      .catch(() => {
        // Token expired or invalid — log out
        setAuth({ role: null, username: null });
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem('jf_token');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (
    usernameInput: string,
    password: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    const username = usernameInput.trim();

    // ── Try editor login first ──────────────────────────────────────────────
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.error || 'Too many attempts. Try again later.' };
      }

      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('jf_token', data.token);
        setAuth({ role: 'editor', username });
        return { ok: true };
      }
    } catch { /* network error, fall through */ }

    // ── Try co-editor login ─────────────────────────────────────────────────
    try {
      const res = await fetch(`${API_BASE}/auth/co-editor-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.error || 'Too many attempts. Try again later.' };
      }

      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('jf_token', data.token);
        setAuth({ role: 'co-editor', username });
        return { ok: true };
      }
    } catch { /* network error */ }

    return { ok: false, error: 'Invalid username or password.' };
  };

  const logout = async () => {
    try {
      const token = sessionStorage.getItem('jf_token');
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch { /* ignore */ }
    setAuth({ role: null, username: null });
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('jf_token');
  };

  return (
    <AdminAuthContext.Provider value={{
      ...auth,
      login,
      logout,
      canEdit: auth.role === 'editor',
      canCRUD: auth.role === 'editor' || auth.role === 'co-editor',
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
