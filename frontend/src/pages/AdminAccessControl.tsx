import { useState } from 'react';
import { useAdminAuth, MAX_VIEWERS } from '../lib/adminAuth';
import type { ViewerAccount } from '../lib/adminAuth';

// ─── Credential generators ────────────────────────────────────────────────────
const ADJECTIVES = ['swift', 'quiet', 'bright', 'polar', 'lunar', 'amber', 'crisp', 'noble', 'vivid', 'azure', 'stone', 'flint', 'cedar', 'onyx', 'slate'];
const NOUNS      = ['falcon', 'dune', 'tidal', 'prism', 'ridge', 'crest', 'ember', 'grove', 'flare', 'drift', 'coast', 'vault', 'haven', 'blaze', 'orbit'];

function rnd<T>(list: T[]): T     { return list[Math.floor(Math.random() * list.length)]; }
function rndNum(len = 4): string  { return String(Math.floor(Math.random() * 10 ** len)).padStart(len, '0'); }
function uid(): string            { return Math.random().toString(36).slice(2, 9); }

function generateAccount(existingUsernames: string[] = []): ViewerAccount {
  let username: string;
  let attempts = 0;
  do {
    username = `${rnd(ADJECTIVES)}.${rnd(NOUNS)}`;
    attempts++;
  } while (existingUsernames.includes(username) && attempts < 20);
  return { id: uid(), username, password: `${rnd(ADJECTIVES)}${rndNum(4)}!` };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminAccessControl() {
  const { canEdit, viewerAccounts, setViewerAccounts } = useAdminAuth();

  // Local draft state so user can edit freely before saving each row
  const [drafts, setDrafts]         = useState<ViewerAccount[]>(() =>
    viewerAccounts.map(a => ({ ...a }))
  );
  const [savedId,  setSavedId]      = useState<string | null>(null);
  const [copied,   setCopied]       = useState<string | null>(null);
  const [revealId, setRevealId]     = useState<string | null>(null);

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

  // ── Helpers ────────────────────────────────────────────────────────────────
  const copy = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* noop */ }
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const updateDraft = (id: string, field: 'username' | 'password', value: string) => {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const regenerateDraft = (id: string) => {
    const existingUsernames = drafts.filter(d => d.id !== id).map(d => d.username);
    const fresh = generateAccount(existingUsernames);
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, username: fresh.username, password: fresh.password } : d));
  };

  const saveAccount = (id: string) => {
    const draft = drafts.find(d => d.id === id);
    if (!draft || draft.username.trim().length < 3 || draft.password.trim().length < 6) return;
    const updated = viewerAccounts.map(a => a.id === id ? { ...a, ...draft } : a);
    setViewerAccounts(updated);
    setSavedId(id);
    setTimeout(() => setSavedId(null), 2500);
  };

  const addAccount = () => {
    if (viewerAccounts.length >= MAX_VIEWERS) return;
    const existingUsernames = drafts.map(d => d.username);
    const newAcc = generateAccount(existingUsernames);
    setDrafts(prev => [...prev, { ...newAcc }]);
    setViewerAccounts([...viewerAccounts, newAcc]);
  };

  const removeAccount = (id: string) => {
    if (viewerAccounts.length <= 1) return; // keep at least 1
    setDrafts(prev => prev.filter(d => d.id !== id));
    setViewerAccounts(viewerAccounts.filter(a => a.id !== id));
  };

  const copyAccountBlock = (acc: ViewerAccount) => {
    copy(`Username: ${acc.username}\nPassword: ${acc.password}\nLogin URL: ${window.location.origin}/admin/login`, `block-${acc.id}`);
  };

  // ── Validation helpers ─────────────────────────────────────────────────────
  const isValidDraft = (draft: ViewerAccount) =>
    draft.username.trim().length >= 3 && draft.password.trim().length >= 6;

  const isDirty = (draft: ViewerAccount) => {
    const saved = viewerAccounts.find(a => a.id === draft.id);
    return !saved || saved.username !== draft.username || saved.password !== draft.password;
  };

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
                <span className="material-symbols-outlined text-white text-lg">key</span>
              </div>
              <span className="text-[10px] font-black tracking-[0.5em] uppercase text-white/40">Editor Tool</span>
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight mb-1">Viewer Access Control</h1>
            <p className="text-white/40 text-xs font-light leading-relaxed max-w-sm">
              Create up to <span className="text-white/70 font-bold">{MAX_VIEWERS}</span> viewer accounts.
              Each can log in with read-only dashboard access.
            </p>
          </div>
          {/* Slot counter */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <div className="flex gap-1">
              {Array.from({ length: MAX_VIEWERS }).map((_, i) => (
                <div key={i}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    i < viewerAccounts.length
                      ? 'bg-green-400 border-green-400'
                      : 'border-white/20 bg-white/5'
                  }`}>
                  {i < viewerAccounts.length && <span className="material-symbols-outlined text-black text-[10px]">person</span>}
                </div>
              ))}
            </div>
            <span className="text-white/40 text-[10px] font-bold">{viewerAccounts.length}/{MAX_VIEWERS} slots used</span>
          </div>
        </div>
      </div>

      {/* Viewer Account Cards */}
      <div className="space-y-3">
        {drafts.map((draft, idx) => {
          const saved     = viewerAccounts.find(a => a.id === draft.id);
          const isRevealed = revealId === draft.id;
          const isSaved   = savedId === draft.id;
          const dirty     = isDirty(draft);
          const valid     = isValidDraft(draft);

          return (
            <div key={draft.id}
              className={`bg-white rounded-xl border shadow-sm transition-all duration-200 overflow-hidden ${
                isSaved ? 'border-green-300 shadow-green-100' : 'border-outline-variant/30'
              }`}>
              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20 bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center text-xs font-black">
                    {idx + 1}
                  </div>
                  <span className="text-xs font-bold text-on-surface">Viewer Account #{idx + 1}</span>
                  {dirty && <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-wide">Unsaved</span>}
                  {isSaved && <span className="text-[9px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase tracking-wide">✓ Saved</span>}
                </div>
                <div className="flex items-center gap-1">
                  {/* Copy block */}
                  <button onClick={() => saved && copyAccountBlock(saved)}
                    title="Copy credentials"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-outline-variant/20 transition-colors">
                    <span className="material-symbols-outlined text-base">
                      {copied === `block-${draft.id}` ? 'check' : 'share'}
                    </span>
                  </button>
                  {/* Regenerate */}
                  <button onClick={() => regenerateDraft(draft.id)}
                    title="Auto-generate new credentials"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-purple-600 hover:bg-purple-50 transition-colors">
                    <span className="material-symbols-outlined text-base">casino</span>
                  </button>
                  {/* Remove (disabled if only 1 left) */}
                  <button onClick={() => removeAccount(draft.id)}
                    disabled={viewerAccounts.length <= 1}
                    title="Remove this account"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>

              {/* Fields */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Username */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1.5">Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={draft.username}
                      onChange={(e) => updateDraft(draft.id, 'username', e.target.value)}
                      className="w-full px-3 py-2 pr-9 border border-outline-variant rounded-xl text-sm font-mono focus:outline-none focus:border-black transition-colors"
                      placeholder="e.g., swift.falcon"
                      spellCheck={false}
                    />
                    <button onClick={() => copy(draft.username, `u-${draft.id}`)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors">
                      <span className="material-symbols-outlined text-sm">{copied === `u-${draft.id}` ? 'check' : 'content_copy'}</span>
                    </button>
                  </div>
                  {draft.username.trim().length > 0 && draft.username.trim().length < 3 && (
                    <p className="text-[10px] text-red-500 mt-1">Min. 3 characters</p>
                  )}
                </div>
                {/* Password */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={isRevealed ? 'text' : 'password'}
                      value={draft.password}
                      onChange={(e) => updateDraft(draft.id, 'password', e.target.value)}
                      className="w-full px-3 py-2 pr-16 border border-outline-variant rounded-xl text-sm font-mono focus:outline-none focus:border-black transition-colors"
                      placeholder="Min. 6 characters"
                      spellCheck={false}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      <button onClick={() => setRevealId(isRevealed ? null : draft.id)}
                        className="text-on-surface-variant hover:text-on-surface transition-colors">
                        <span className="material-symbols-outlined text-sm">{isRevealed ? 'visibility_off' : 'visibility'}</span>
                      </button>
                      <button onClick={() => copy(draft.password, `p-${draft.id}`)}
                        className="text-on-surface-variant hover:text-on-surface transition-colors">
                        <span className="material-symbols-outlined text-sm">{copied === `p-${draft.id}` ? 'check' : 'content_copy'}</span>
                      </button>
                    </div>
                  </div>
                  {draft.password.trim().length > 0 && draft.password.trim().length < 6 && (
                    <p className="text-[10px] text-red-500 mt-1">Min. 6 characters</p>
                  )}
                </div>
              </div>

              {/* Save row */}
              <div className="px-4 pb-4 flex items-center justify-between gap-3">
                <p className="text-[10px] text-on-surface-variant">
                  Login URL: <span className="font-mono text-on-surface">{window.location.origin}/admin/login</span>
                </p>
                <button
                  onClick={() => saveAccount(draft.id)}
                  disabled={!dirty || !valid}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">
                  <span className="material-symbols-outlined text-sm">{isSaved ? 'check_circle' : 'save'}</span>
                  {isSaved ? 'Saved!' : 'Save'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Viewer button */}
      {viewerAccounts.length < MAX_VIEWERS ? (
        <button
          onClick={addAccount}
          className="w-full py-3 border-2 border-dashed border-outline-variant rounded-xl text-sm font-semibold text-on-surface-variant hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">person_add</span>
          Add Viewer Account ({viewerAccounts.length}/{MAX_VIEWERS})
        </button>
      ) : (
        <div className="w-full py-3 border-2 border-dashed border-outline-variant/30 rounded-xl text-sm text-on-surface-variant/50 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-base">block</span>
          Maximum {MAX_VIEWERS} viewer accounts reached
        </div>
      )}

      {/* Editor credentials (read-only) */}
      <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant/20 bg-surface-container-low flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-base">shield</span>
          <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Editor Credentials (Fixed)</span>
        </div>
        <div className="p-4 flex items-center gap-4">
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
              <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Username</p>
              <p className="text-sm font-mono text-on-surface">admin</p>
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

    </div>
  );
}
