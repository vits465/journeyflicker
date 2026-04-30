import { useEffect, useState } from 'react';
import { api, type Backup } from '../lib/api';
import { useOutletContext } from 'react-router-dom';

export default function AdminBackups() {
  const { canEdit } = useOutletContext<{ canEdit: boolean }>();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const data = await api.listBackups();
      setBackups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canEdit) fetchBackups();
  }, [canEdit]);

  const handleCreateBackup = async () => {
    if (!confirm('Create a new database backup?')) return;
    setActionLoading(true);
    try {
      await api.createBackup();
      await fetchBackups();
    } catch (err) {
      alert('Failed to create backup');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (filename: string) => {
    if (!confirm(`Are you sure you want to restore from ${filename}? Current unsaved data will be lost.`)) return;
    setActionLoading(true);
    try {
      await api.restoreBackup(filename);
      alert('Backup restored successfully!');
      window.location.reload();
    } catch (err) {
      alert('Failed to restore backup');
    } finally {
      setActionLoading(false);
    }
  };

  if (!canEdit) return <div className="p-8 text-center text-red-500">Access Denied</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface tracking-tight">Database Backups</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage automated and manual system backups.</p>
        </div>
        <button 
          onClick={handleCreateBackup}
          disabled={actionLoading}
          className="bg-black text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition flex items-center gap-2 shadow-md disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm">{actionLoading ? 'hourglass_empty' : 'backup'}</span>
          Create Backup
        </button>
      </div>

      <div className="bg-surface dark:bg-white/5 rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/10 bg-surface-container-lowest flex items-center gap-2">
          <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
          <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Self-Healing Active</span>
        </div>
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-gray-400 text-3xl">progress_activity</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <span className="material-symbols-outlined text-5xl mb-3 opacity-20">database</span>
            <p className="text-sm font-medium">No backups available yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-surface-container-lowest border-b border-outline-variant/20">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-on-surface uppercase">Filename</th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-on-surface uppercase">Size</th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-on-surface uppercase">Date Created</th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-on-surface uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {backups.map(b => (
                  <tr key={b.filename} className="hover:bg-surface-container-lowest transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-low dark:bg-white/10 flex items-center justify-center text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-sm">description</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{b.filename}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">{(b.size / 1024).toFixed(2)} KB</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(b.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleRestore(b.filename)}
                        disabled={actionLoading}
                        className="text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-600/30 px-3 py-1.5 rounded-lg font-medium text-xs disabled:opacity-50 transition-all inline-flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">settings_backup_restore</span>
                        Restore
                      </button>
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
