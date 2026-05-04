import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  listSnapshots,
  saveSnapshot,
  restoreSnapshot,
  deleteSnapshot,
  clearAllSnapshots,
  readCache,
  type FrontendSnapshot,
} from '../lib/frontendBackup';
import { api } from '../lib/api';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function AdminFrontendBackups() {
  const { canEdit } = useOutletContext<{ canEdit: boolean }>();
  const [snapshots, setSnapshots] = useState<FrontendSnapshot[]>([]);
  const [saving, setSaving] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const cache = readCache();

  const refresh = () => setSnapshots(listSnapshots());

  useEffect(() => {
    refresh();
    // refresh list every 30 s in case auto-backup ran
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, []);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCreate = async () => {
    if (!confirm('Snapshot current site data to your browser right now?')) return;
    setSaving(true);
    try {
      const [destinations, toursRes, visas] = await Promise.all([
        api.listDestinations(),
        api.listTours(),
        api.listVisas(),
      ]);
      const tours = Array.isArray(toursRes) ? toursRes : toursRes.items;
      saveSnapshot({ destinations, tours, visas }, false);
      refresh();
      showToast('Snapshot saved successfully!');
    } catch {
      showToast('Failed — backend may be offline.', 'err');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (snap: FrontendSnapshot) => {
    if (!confirm(`Restore data from "${snap.label}"?\n\nThis updates your browser cache so the site serves this snapshot if the backend is offline.`)) return;
    setRestoringId(snap.id);
    try {
      restoreSnapshot(snap.id);
      showToast('Snapshot set as active offline cache!');
    } catch {
      showToast('Restore failed.', 'err');
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = (snap: FrontendSnapshot) => {
    if (!confirm(`Delete snapshot "${snap.label}"?`)) return;
    setDeletingId(snap.id);
    deleteSnapshot(snap.id);
    refresh();
    setDeletingId(null);
    showToast('Snapshot deleted.');
  };

  const handleClearAll = () => {
    if (!confirm('Delete ALL frontend snapshots and clear the offline cache? This cannot be undone.')) return;
    clearAllSnapshots();
    refresh();
    showToast('All snapshots cleared.');
  };

  if (!canEdit) return <div className="p-8 text-center text-red-500">Editor access required.</div>;

  const totalBytes = snapshots.reduce((s, x) => s + x.size, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] px-5 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 transition-all ${
          toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <span className="material-symbols-outlined text-base">
            {toast.type === 'ok' ? 'check_circle' : 'error'}
          </span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface tracking-tight">Frontend Backups</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Browser-side snapshots of site content — serve from cache if backend goes offline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreate}
            disabled={saving}
            className="bg-black text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">{saving ? 'hourglass_empty' : 'save'}</span>
            {saving ? 'Saving…' : 'Save Snapshot'}
          </button>
          {snapshots.length > 0 && (
            <button
              onClick={handleClearAll}
              className="border border-red-300 text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface dark:bg-white/5 rounded-2xl border border-outline-variant/30 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-indigo-600 text-lg">layers</span>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Snapshots</span>
          </div>
          <p className="text-3xl font-light font-serif italic text-on-surface">{snapshots.length}</p>
          <p className="text-xs text-on-surface-variant opacity-60 mt-1">of 8 max kept</p>
        </div>
        <div className="bg-surface dark:bg-white/5 rounded-2xl border border-outline-variant/30 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600 text-lg">storage</span>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Size</span>
          </div>
          <p className="text-3xl font-light font-serif italic text-on-surface">{formatBytes(totalBytes)}</p>
          <p className="text-xs text-on-surface-variant opacity-60 mt-1">in localStorage</p>
        </div>
        <div className="bg-surface dark:bg-white/5 rounded-2xl border border-outline-variant/30 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cache ? 'bg-green-50' : 'bg-amber-50'}`}>
              <span className={`material-symbols-outlined text-lg ${cache ? 'text-green-600' : 'text-amber-500'}`}>
                {cache ? 'cloud_done' : 'cloud_off'}
              </span>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Cache</span>
          </div>
          <p className={`text-sm font-bold ${cache ? 'text-green-700' : 'text-amber-600'}`}>
            {cache ? 'Active' : 'Empty'}
          </p>
          {cache && (
            <p className="text-xs text-gray-400 mt-1">Last updated {timeAgo(cache.cachedAt)}</p>
          )}
        </div>
      </div>

      {/* Auto-backup notice */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
        <span className="material-symbols-outlined text-blue-500 mt-0.5 flex-shrink-0">info</span>
        <p className="text-xs text-blue-700 leading-relaxed">
          <span className="font-bold">Auto-backup is active.</span> The system automatically creates a new snapshot every <strong>2 hours</strong> while the browser is open, keeping the last 8 snapshots. If the backend is unreachable, pages will automatically attempt to serve from the latest cached snapshot.
        </p>
      </div>

      {/* Snapshots table */}
      <div className="bg-surface dark:bg-white/5 rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center gap-2">
          <span className="material-symbols-outlined text-gray-500 text-sm">history</span>
          <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Snapshot History</span>
        </div>
        {snapshots.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-5xl text-gray-200">cloud_off</span>
            <p className="text-sm text-gray-400 font-medium">No snapshots yet.</p>
            <p className="text-xs text-gray-300">Create one manually or wait for the auto-backup to run.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead className="bg-gray-50 border-b border-outline-variant/20">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-black tracking-widest text-gray-400 uppercase">Type</th>
                  <th className="px-6 py-3 text-[10px] font-black tracking-widest text-gray-400 uppercase">Date & Time</th>
                  <th className="px-6 py-3 text-[10px] font-black tracking-widest text-gray-400 uppercase">Content</th>
                  <th className="px-6 py-3 text-[10px] font-black tracking-widest text-gray-400 uppercase">Size</th>
                  <th className="px-6 py-3 text-[10px] font-black tracking-widest text-gray-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {snapshots.map((snap, idx) => (
                  <tr key={snap.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        snap.auto
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        <span className="material-symbols-outlined text-[11px]">{snap.auto ? 'autorenew' : 'touch_app'}</span>
                        {snap.auto ? 'Auto' : 'Manual'}
                      </span>
                      {idx === 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[9px] font-black tracking-wider uppercase">
                          Latest
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">{snap.label}</p>
                      <p className="text-xs text-gray-400">{timeAgo(snap.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px] text-indigo-400">location_on</span>
                          {(snap.data.destinations as []).length}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px] text-emerald-500">flight</span>
                          {(snap.data.tours as []).length}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px] text-purple-400">passport</span>
                          {(snap.data.visas as []).length}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">{formatBytes(snap.size)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRestore(snap)}
                          disabled={restoringId === snap.id}
                          className="text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg font-bold text-xs disabled:opacity-40 transition-all inline-flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">settings_backup_restore</span>
                          Restore
                        </button>
                        <button
                          onClick={() => handleDelete(snap)}
                          disabled={deletingId === snap.id}
                          className="text-red-400 hover:text-white hover:bg-red-500 border border-red-200 px-3 py-1.5 rounded-lg font-bold text-xs disabled:opacity-40 transition-all inline-flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
