import { useState, useEffect } from 'react';
import { useAdminAuth } from '../lib/adminAuth';
import { API_BASE } from '../lib/api';

interface CoEditorAccount {
  id: string;
  username: string;
}

interface CoEditorForm {
  username: string;
  password: string;
}

const emptyForm: CoEditorForm = { username: '', password: '' };

export default function AdminAccessControl() {
  const { canEdit } = useAdminAuth();
  const [accounts, setAccounts] = useState<CoEditorAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CoEditorForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!canEdit) {
    return (
      <div className="max-w-xl mx-auto mt-8">
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
          <span className="material-symbols-outlined">lock</span>
          Access denied. Editor credentials required.
        </div>
      </div>
    );
  }

  // ── helpers ─────────────────────────────────────────────────────────────────
  function authHeaders(): Record<string, string> {
    const token = sessionStorage.getItem('jf_token') || '';
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }

  function flash(msg: string, isError = false) {
    if (isError) { setError(msg); setTimeout(() => setError(''), 4000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
  }

  async function loadAccounts() {
    try {
      const res = await fetch(`${API_BASE}/auth/co-editor-accounts`, { headers: authHeaders() });
      if (!res.ok) throw new Error(await res.text());
      setAccounts(await res.json());
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'Failed to load accounts', true);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { loadAccounts(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username.trim() || form.username.trim().length < 3) {
      return flash('Username must be at least 3 characters.', true);
    }
    if (!editingId && (!form.password || form.password.length < 6)) {
      return flash('Password must be at least 6 characters.', true);
    }
    setSaving(true);
    try {
      const body: Partial<CoEditorForm> = { username: form.username };
      if (form.password) body.password = form.password;

      const url = editingId
        ? `${API_BASE}/auth/co-editor-accounts/${editingId}`
        : `${API_BASE}/auth/co-editor-accounts`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));
      flash(editingId ? 'Account updated!' : 'Co-editor account created!');
      setForm(emptyForm);
      setEditingId(null);
      await loadAccounts();
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'Save failed', true);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(acc: CoEditorAccount) {
    setEditingId(acc.id);
    setForm({ username: acc.username, password: '' });
  }

  async function handleDelete(id: string) {
    setDeleteId(null);
    try {
      const res = await fetch(`${API_BASE}/auth/co-editor-accounts/${id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if (!res.ok) throw new Error(await res.text());
      flash('Account removed.');
      await loadAccounts();
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'Delete failed', true);
    }
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">

      {/* Header */}
      <div className="bg-black text-white rounded-2xl p-5 md:p-7 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg">edit_note</span>
              </div>
              <span className="text-[10px] font-black tracking-[0.5em] uppercase text-white/40">Editor Tool</span>
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight mb-1">Co-Editor Access Control</h1>
            <p className="text-white/40 text-xs font-light leading-relaxed max-w-sm">
              Create up to <span className="text-white/70 font-bold">5</span> co-editor accounts.
              Each can create, edit and delete <strong className="text-white/60">Tours, Destinations &amp; Visas</strong>.
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    i < accounts.length ? 'bg-violet-400 border-violet-400' : 'border-white/20 bg-white/5'
                  }`}>
                  {i < accounts.length && <span className="material-symbols-outlined text-black text-[10px]">person</span>}
                </div>
              ))}
            </div>
            <span className="text-white/40 text-[10px] font-bold">{accounts.length}/5 slots used</span>
          </div>
        </div>
      </div>

      {/* Feedback banners */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
          <span className="material-symbols-outlined text-sm">error</span> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs font-medium">
          <span className="material-symbols-outlined text-sm">check_circle</span> {success}
        </div>
      )}

      {/* Form */}
      {(accounts.length < 5 || editingId) && (
        <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant/20 bg-surface-container-low flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-base">
              {editingId ? 'edit' : 'person_add'}
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">
              {editingId ? 'Edit Co-Editor' : 'Add Co-Editor'}
            </span>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm font-mono focus:outline-none focus:border-black transition-colors"
                  placeholder="e.g., swift.falcon"
                  spellCheck={false}
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1.5">
                  Password {editingId && <span className="text-on-surface-variant/50 normal-case font-normal">(leave blank to keep)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-outline-variant rounded-xl text-sm font-mono focus:outline-none focus:border-black transition-colors"
                    placeholder={editingId ? 'New password (optional)' : 'Min. 6 characters'}
                    spellCheck={false}
                    minLength={editingId && !form.password ? undefined : 6}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-sm">{showPass ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors disabled:opacity-40">
                <span className="material-symbols-outlined text-sm">{saving ? 'hourglass_top' : editingId ? 'save' : 'person_add'}</span>
                {saving ? 'Saving…' : editingId ? 'Update Account' : 'Create Account'}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors">
                  <span className="material-symbols-outlined text-sm">close</span> Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Accounts list */}
      <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant/20 bg-surface-container-low flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Co-Editor Accounts</span>
          <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded-full">{accounts.length}</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-on-surface-variant">Loading…</div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 block mb-2">group</span>
            <p className="text-sm text-on-surface-variant">No co-editor accounts yet. Add one above.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/20">
            {accounts.map((acc, idx) => (
              <div key={acc.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-black flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface font-mono">{acc.username}</p>
                  <p className="text-[10px] text-on-surface-variant">Co-Editor · CRUD access to Tours, Destinations, Visas</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(acc)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Edit account">
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  {deleteId === acc.id ? (
                    <>
                      <button onClick={() => handleDelete(acc.id)}
                        className="px-2 py-1 text-[10px] font-black bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                        Confirm
                      </button>
                      <button onClick={() => setDeleteId(null)}
                        className="px-2 py-1 text-[10px] font-black bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setDeleteId(acc.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete account">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor credentials (read-only info) */}
      <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant/20 bg-surface-container-low flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-base">shield</span>
          <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Editor Credentials (Fixed)</span>
        </div>
        <div className="p-4">
          <p className="text-[10px] text-on-surface-variant mb-3">
            The main editor account has unrestricted access to all admin sections including contacts, backups, hero settings, SEO, and this access control panel.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
              <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Username</p>
              <p className="text-sm font-mono text-on-surface">Fliker</p>
            </div>
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
              <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Password</p>
              <p className="text-sm font-mono text-on-surface">••••••••</p>
            </div>
          </div>
        </div>
        <p className="px-4 pb-3 text-[10px] text-on-surface-variant italic">
          Editor credentials are hardcoded and cannot be changed from this panel.
        </p>
      </div>

      {/* Permissions Overview Section */}
      <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant/20 bg-violet-50/30 flex items-center gap-2">
          <span className="material-symbols-outlined text-violet-600 text-base">rule</span>
          <span className="text-xs font-black uppercase tracking-widest text-violet-600">Permissions Matrix</span>
        </div>
        <div className="p-4">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 text-left text-on-surface-variant uppercase tracking-tighter">
                <th className="py-2 font-black">Capability</th>
                <th className="py-2 font-black">Editor</th>
                <th className="py-2 font-black">Co-Editor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
              {[
                { cap: 'Manage Tours & Destinations', ed: 'Full CRUD', co: 'Full CRUD' },
                { cap: 'Visa Portal Intelligence', ed: 'Full CRUD', co: 'Full CRUD' },
                { cap: 'Media Library Access', ed: 'Full CRUD', co: 'Full CRUD' },
                { cap: 'Hero Engine & Homepage', ed: 'Full CRUD', co: 'Read Only' },
                { cap: 'SEO & Metadata Strategy', ed: 'Full CRUD', co: 'Read Only' },
                { cap: 'Database & System Backups', ed: 'Full Access', co: 'No Access' },
                { cap: 'Co-Editor Account Management', ed: 'Full Access', co: 'No Access' },
                { cap: 'Contact Inquiries & Privacy', ed: 'Full Access', co: 'No Access' },
                { cap: 'API Keys & Secrets', ed: 'Full Access', co: 'No Access' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-2 font-medium">{row.cap}</td>
                  <td className="py-2 text-emerald-600 font-bold">{row.ed}</td>
                  <td className={`py-2 ${row.co === 'No Access' ? 'text-red-400' : row.co === 'Read Only' ? 'text-amber-500' : 'text-emerald-600'} font-bold`}>{row.co}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
            <span className="material-symbols-outlined text-blue-500 text-lg">info</span>
            <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
              Roles are enforced at the <strong className="text-blue-900">API Layer</strong>. Even if UI buttons are visible, co-editor requests to restricted endpoints (like Backups or Account Deletion) will be rejected by the server for maximum security.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
