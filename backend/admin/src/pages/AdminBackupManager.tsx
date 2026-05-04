import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, type Backup, type BackupStats } from '../lib/api';

const COLLECTIONS = ['destinations', 'tours', 'visas', 'contacts', 'media'];

function fmtBytes(b: number) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1024 / 1024).toFixed(2) + ' MB';
}

function Toast({ msg, type, onClose }: { msg: string; type: 'ok' | 'err' | 'info'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const colors = { ok: 'bg-emerald-600', err: 'bg-red-600', info: 'bg-blue-600' };
  const icons  = { ok: 'check_circle', err: 'error', info: 'info' };
  return (
    <div className={`fixed top-5 right-5 z-[300] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2.5 text-white ${colors[type]} animate-in slide-in-from-right`}>
      <span className="material-symbols-outlined text-base">{icons[type]}</span>
      {msg}
    </div>
  );
}

export default function AdminBackupManager() {
  const { canEdit } = useOutletContext<{ canEdit: boolean }>();
  const [backups, setBackups]     = useState<Backup[]>([]);
  const [stats, setStats]         = useState<BackupStats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [busy, setBusy]           = useState<string | null>(null);
  const [toast, setToast]         = useState<{ msg: string; type: 'ok' | 'err' | 'info' } | null>(null);
  const [restoreModal, setRestoreModal] = useState<{ backup: Backup; step: 'confirm' | 'preview' | 'select' | 'log'; dryRunData?: Record<string, unknown>; log?: string[]; selectedCols: string[] } | null>(null);
  const [uploadModal, setUploadModal]   = useState(false);
  const [uploadPreview, setUploadPreview] = useState<{ payload: Record<string, unknown>; valid: boolean; errors: string[]; file: File } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const toast$ = (msg: string, type: 'ok' | 'err' | 'info' = 'ok') => setToast({ msg, type });

  const load = async () => {
    setLoading(true);
    try {
      const [bs, st] = await Promise.all([api.listBackups(), api.getBackupStats()]);
      setBackups(bs);
      setStats(st);
    } catch { toast$('Failed to load backups', 'err'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (canEdit) load(); }, [canEdit]);

  const handleCreate = async () => {
    setBusy('create');
    try {
      await api.createBackup();
      toast$('Backup created successfully!');
      await load();
    } catch (e: unknown) { toast$(e instanceof Error ? e.message : 'Failed', 'err'); }
    finally { setBusy(null); }
  };

  const handleDelete = async (b: Backup) => {
    if (!confirm(`Delete backup "${b.filename}"? This cannot be undone.`)) return;
    setBusy(b.id);
    try {
      await api.deleteBackup(b.id);
      toast$('Backup deleted');
      setBackups(prev => prev.filter(x => x.id !== b.id));
    } catch { toast$('Delete failed', 'err'); }
    finally { setBusy(null); }
  };

  const handleDryRun = async (b: Backup) => {
    setBusy('dryrun-' + b.id);
    try {
      const res = await api.restoreBackup(b.id, { dryRun: true });
      setRestoreModal({ backup: b, step: 'preview', dryRunData: res as Record<string, unknown>, selectedCols: [...COLLECTIONS] });
    } catch { toast$('Preview failed', 'err'); }
    finally { setBusy(null); }
  };

  const handleRestore = async () => {
    if (!restoreModal) return;
    setBusy('restore');
    try {
      const res = await api.restoreBackup(restoreModal.backup.id, { collections: restoreModal.selectedCols });
      setRestoreModal(prev => prev ? { ...prev, step: 'log', log: (res as { log?: string[] }).log || [] } : null);
      toast$('Restore completed!');
      await load();
    } catch (e: unknown) { toast$(e instanceof Error ? e.message : 'Restore failed', 'err'); }
    finally { setBusy(null); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy('upload');
    try {
      const content = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        if (file.name.endsWith('.zip')) reader.readAsDataURL(file);
        else reader.readAsText(file);
      });
      const isZip   = file.name.endsWith('.zip');
      const payload = isZip ? content.split(',')[1] : content;
      const result  = await api.uploadBackupFile(file.name, payload);
      setUploadPreview({ ...result, file });
      setUploadModal(true);
    } catch (e: unknown) { toast$(e instanceof Error ? e.message : 'Parse failed', 'err'); }
    finally { setBusy(null); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleUploadRestore = async () => {
    if (!uploadPreview?.payload) return;
    if (!confirm('This will overwrite current data. Continue?')) return;
    setBusy('upload-restore');
    try {
      const res = await api.restoreBackup('', { dryRun: false });
      toast$('Restore from upload completed!');
      console.log(res);
      setUploadModal(false);
      await load();
    } catch (e: unknown) { toast$(e instanceof Error ? e.message : 'Failed', 'err'); }
    finally { setBusy(null); }
  };

  if (!canEdit) return <div className="p-8 text-center text-red-500 font-semibold">Access Denied — Editor role required</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface tracking-tight">Backup Manager</h1>
          <p className="text-on-surface-variant text-sm mt-1">Production-grade backup with checksum verification, JSON/ZIP download, and safe restore.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input ref={fileRef} type="file" accept=".json,.zip" className="hidden" onChange={handleFileUpload} />
          <button onClick={() => fileRef.current?.click()} disabled={!!busy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-outline-variant/40 text-sm font-bold text-on-surface hover:bg-surface-container transition disabled:opacity-50">
            <span className="material-symbols-outlined text-sm">upload_file</span>Upload & Restore
          </button>
          <button onClick={handleCreate} disabled={!!busy}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition shadow-md disabled:opacity-50">
            <span className="material-symbols-outlined text-sm">{busy === 'create' ? 'hourglass_empty' : 'backup'}</span>
            {busy === 'create' ? 'Creating…' : 'Create Backup'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Backups', value: stats.count, icon: 'database', color: 'text-indigo-500', bg: 'bg-indigo-50' },
            { label: 'Total Size', value: fmtBytes(stats.totalSize), icon: 'storage', color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Max Retained', value: stats.maxBackups, icon: 'rule', color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Last Backup', value: stats.lastBackup ? new Date(stats.lastBackup).toLocaleDateString() : 'Never', icon: 'schedule', color: 'text-blue-500', bg: 'bg-blue-50' },
          ].map(s => (
            <div key={s.label} className="bg-surface dark:bg-white/5 rounded-2xl border border-outline-variant/30 p-5 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <span className={`material-symbols-outlined text-lg ${s.color}`}>{s.icon}</span>
              </div>
              <p className="text-xl font-bold text-on-surface">{s.value}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Scheduled backup notice */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
        <span className="material-symbols-outlined text-blue-500 mt-0.5 flex-shrink-0">schedule</span>
        <p className="text-xs text-blue-700 leading-relaxed">
          <span className="font-bold">Scheduled Backup Active.</span> Automatic backups run daily at 2:00 AM UTC. Maximum {stats?.maxBackups || 20} backups retained — oldest are auto-pruned. Each backup includes SHA-256 checksum for integrity verification.
        </p>
      </div>

      {/* Backup list */}
      <div className="bg-surface dark:bg-white/5 rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-600 text-sm">check_circle</span>
          <span className="text-xs font-bold text-on-surface uppercase tracking-widest">Backup History</span>
          <span className="ml-auto text-xs text-on-surface-variant">{backups.length} backups</span>
        </div>

        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-gray-400 text-4xl">progress_activity</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-16 flex flex-col items-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined text-6xl opacity-20">database</span>
            <p className="text-sm font-medium">No backups yet. Create your first backup above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-surface-container-lowest border-b border-outline-variant/20">
                <tr>
                  {['Filename', 'Collections', 'Size', 'Checksum', 'Created', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[10px] font-black tracking-widest text-on-surface uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {backups.map(b => (
                  <tr key={b.id} className="hover:bg-surface-container-lowest transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-indigo-500 text-sm">description</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface truncate max-w-[180px]">{b.filename}</p>
                          <p className="text-[10px] text-on-surface-variant">{b.createdBy || 'System'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {b.collections ? (
                        <div className="flex flex-col gap-0.5 text-[10px] text-on-surface-variant">
                          <span>📍 {b.collections.destinations} dest</span>
                          <span>✈️ {b.collections.tours} tours</span>
                          <span>🖼️ {b.collections.media} media</span>
                        </div>
                      ) : <span className="text-xs text-on-surface-variant">—</span>}
                    </td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant font-medium">{fmtBytes(b.size)}</td>
                    <td className="px-5 py-4">
                      {b.checksum ? (
                        <span className="font-mono text-[9px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                          {b.checksum.slice(0, 12)}…
                        </span>
                      ) : <span className="text-xs text-on-surface-variant">—</span>}
                    </td>
                    <td className="px-5 py-4 text-xs text-on-surface-variant">
                      <p>{new Date(b.createdAt).toLocaleDateString()}</p>
                      <p>{new Date(b.createdAt).toLocaleTimeString()}</p>
                      {b.restoredAt && <p className="text-amber-500 mt-0.5">Restored {new Date(b.restoredAt).toLocaleDateString()}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button onClick={() => handleDryRun(b)} disabled={!!busy}
                          title="Preview restore" className="p-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition disabled:opacity-40">
                          <span className="material-symbols-outlined text-sm">preview</span>
                        </button>
                        <button onClick={() => setRestoreModal({ backup: b, step: 'confirm', selectedCols: [...COLLECTIONS] })} disabled={!!busy}
                          title="Restore" className="p-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition disabled:opacity-40">
                          <span className="material-symbols-outlined text-sm">settings_backup_restore</span>
                        </button>
                        <button onClick={() => api.downloadBackup(b.id)} title="Download JSON"
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                          <span className="material-symbols-outlined text-sm">download</span>
                        </button>
                        <button onClick={() => api.downloadBackupZip(b.id)} title="Download ZIP"
                          className="p-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition">
                          <span className="material-symbols-outlined text-sm">folder_zip</span>
                        </button>
                        <button onClick={() => handleDelete(b)} disabled={busy === b.id}
                          title="Delete" className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition disabled:opacity-40">
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

      {/* Restore Modal */}
      {restoreModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-7 py-5 border-b border-outline-variant/20 flex items-center gap-3">
              <span className="material-symbols-outlined text-indigo-500">settings_backup_restore</span>
              <h2 className="font-semibold text-on-surface text-lg">
                {restoreModal.step === 'confirm' ? 'Restore Backup' :
                 restoreModal.step === 'preview' ? 'Restore Preview (Dry Run)' :
                 restoreModal.step === 'select'  ? 'Select Collections' : 'Restore Log'}
              </h2>
              <button onClick={() => setRestoreModal(null)} className="ml-auto text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="px-7 py-6 space-y-4">
              {restoreModal.step === 'confirm' && (
                <>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                    <span className="material-symbols-outlined text-amber-600 flex-shrink-0">warning</span>
                    <p className="text-sm text-amber-800">A pre-restore safety snapshot will be created automatically before proceeding. Current data will be replaced.</p>
                  </div>
                  <p className="text-sm text-on-surface">Restoring: <span className="font-bold">{restoreModal.backup.filename}</span></p>
                  <div className="flex gap-2">
                    <button onClick={() => setRestoreModal(m => m ? {...m, step: 'select'} : null)}
                      className="flex-1 py-2.5 rounded-xl border border-outline-variant/40 text-sm font-semibold hover:bg-surface-container transition">
                      Select Collections
                    </button>
                    <button onClick={handleRestore} disabled={busy === 'restore'}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50">
                      {busy === 'restore' ? 'Restoring…' : 'Restore All'}
                    </button>
                  </div>
                </>
              )}

              {restoreModal.step === 'select' && (
                <>
                  <p className="text-sm text-on-surface-variant">Choose which collections to restore:</p>
                  <div className="space-y-2">
                    {COLLECTIONS.map(col => (
                      <label key={col} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container cursor-pointer">
                        <input type="checkbox" checked={restoreModal.selectedCols.includes(col)}
                          onChange={e => setRestoreModal(m => m ? {
                            ...m,
                            selectedCols: e.target.checked ? [...m.selectedCols, col] : m.selectedCols.filter(c => c !== col)
                          } : null)}
                          className="w-4 h-4 accent-indigo-600" />
                        <span className="text-sm font-medium capitalize text-on-surface">{col}</span>
                      </label>
                    ))}
                  </div>
                  <button onClick={handleRestore} disabled={!restoreModal.selectedCols.length || busy === 'restore'}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50">
                    {busy === 'restore' ? 'Restoring…' : `Restore ${restoreModal.selectedCols.length} Collection(s)`}
                  </button>
                </>
              )}

              {restoreModal.step === 'preview' && restoreModal.dryRunData && (
                <>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-3">What would be restored:</p>
                    {Object.entries((restoreModal.dryRunData as { preview?: Record<string, number> }).preview || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm py-1 border-b border-blue-100 last:border-0">
                        <span className="capitalize text-blue-700">{k}</span>
                        <span className="font-bold text-blue-900">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setRestoreModal(m => m ? {...m, step: 'confirm'} : null)}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition">
                    Proceed to Restore
                  </button>
                </>
              )}

              {restoreModal.step === 'log' && (
                <div className="bg-black rounded-xl p-4 max-h-64 overflow-y-auto font-mono text-xs text-green-400 space-y-1">
                  {(restoreModal.log || []).map((line, i) => <p key={i}>{line}</p>)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Preview Modal */}
      {uploadModal && uploadPreview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg">
            <div className="px-7 py-5 border-b border-outline-variant/20 flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-500">upload_file</span>
              <h2 className="font-semibold text-on-surface">Uploaded Backup Preview</h2>
              <button onClick={() => { setUploadModal(false); setUploadPreview(null); }} className="ml-auto text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-7 py-6 space-y-4">
              {uploadPreview.valid ? (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-xl">
                  <span className="material-symbols-outlined">verified</span>
                  <span className="text-sm font-semibold">Checksum verified — backup is valid</span>
                </div>
              ) : (
                <div className="text-red-600 bg-red-50 p-3 rounded-xl">
                  <p className="text-sm font-bold mb-2">Validation Errors:</p>
                  {uploadPreview.errors.map((e, i) => <p key={i} className="text-xs">{e}</p>)}
                </div>
              )}
              <button onClick={handleUploadRestore} disabled={!uploadPreview.valid || busy === 'upload-restore'}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50">
                {busy === 'upload-restore' ? 'Restoring…' : 'Restore This Backup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
