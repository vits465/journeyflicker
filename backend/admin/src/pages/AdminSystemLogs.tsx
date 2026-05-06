import { useState, useEffect, useCallback } from 'react';
import { api, type SystemLog } from '../lib/api';

const LEVEL_CONFIG = {
  error: { label: 'Error',   icon: 'error',          bg: 'bg-red-50 dark:bg-red-900/20',    text: 'text-red-700 dark:text-red-400',   border: 'border-red-200 dark:border-red-800',   dot: 'bg-red-500' },
  warn:  { label: 'Warning', icon: 'warning',         bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  info:  { label: 'Info',    icon: 'info',            bg: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-700 dark:text-blue-400',  border: 'border-blue-200 dark:border-blue-800',  dot: 'bg-blue-500' },
};

const SOURCE_CONFIG = {
  frontend: { label: 'Frontend', icon: 'web', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  backend:  { label: 'Backend',  icon: 'dns', color: 'text-cyan-600 dark:text-cyan-400',     bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
};

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000)   return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function LogDetailModal({ log, onClose, onResolve, onDelete }: {
  log: SystemLog;
  onClose: () => void;
  onResolve: (log: SystemLog, v: boolean) => void;
  onDelete: (log: SystemLog) => void;
}) {
  const lc = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.error;
  const sc = SOURCE_CONFIG[log.source] || SOURCE_CONFIG.frontend;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-outline-variant/20 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`flex items-center gap-3 px-6 py-4 border-b border-outline-variant/20 ${lc.bg}`}>
          <span className={`material-symbols-outlined text-xl ${lc.text}`}>{lc.icon}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-black tracking-widest uppercase ${lc.text}`}>{lc.label} · {sc.label}</p>
            <p className="text-sm font-semibold text-on-surface dark:text-white truncate mt-0.5">{log.message}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-black/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Meta chips */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.color}`}>
              <span className="material-symbols-outlined text-sm">{sc.icon}</span>
              {sc.label}
            </span>
            {log.resolved ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                <span className="material-symbols-outlined text-sm">check_circle</span>Resolved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                <span className="material-symbols-outlined text-sm">radio_button_checked</span>Open
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-container-low dark:bg-white/10 text-on-surface-variant dark:text-white/60">
              <span className="material-symbols-outlined text-sm">schedule</span>{new Date(log.createdAt).toLocaleString()}
            </span>
          </div>

          {log.url && (
            <div>
              <p className="text-[10px] font-black tracking-widest uppercase text-on-surface-variant/50 dark:text-white/30 mb-1">Page URL</p>
              <p className="text-sm font-mono text-primary dark:text-violet-400 break-all bg-surface-container-low dark:bg-white/5 rounded-lg px-3 py-2">{log.url}</p>
            </div>
          )}

          {log.stack && (
            <div>
              <p className="text-[10px] font-black tracking-widest uppercase text-on-surface-variant/50 dark:text-white/30 mb-1">Stack Trace</p>
              <pre className="text-xs font-mono bg-black/90 text-red-300 rounded-xl px-4 py-3 overflow-x-auto whitespace-pre-wrap leading-relaxed">{log.stack}</pre>
            </div>
          )}

          {log.userAgent && (
            <div>
              <p className="text-[10px] font-black tracking-widest uppercase text-on-surface-variant/50 dark:text-white/30 mb-1">User Agent</p>
              <p className="text-xs font-mono text-on-surface-variant dark:text-white/50 break-all bg-surface-container-low dark:bg-white/5 rounded-lg px-3 py-2">{log.userAgent}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant/20">
          <button onClick={() => onDelete(log)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
            <span className="material-symbols-outlined text-base">delete</span>Delete
          </button>
          <button onClick={() => onResolve(log, !log.resolved)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${log.resolved ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'}`}>
            <span className="material-symbols-outlined text-base">{log.resolved ? 'undo' : 'check_circle'}</span>
            {log.resolved ? 'Reopen' : 'Mark Resolved'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSystemLogs() {
  const [logs, setLogs]       = useState<SystemLog[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [levelFilter, setLevelFilter]   = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [resolvedFilter, setResolvedFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [selected, setSelected] = useState<SystemLog | null>(null);
  const [clearing, setClearing] = useState(false);

  const LIMIT = 25;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const opts: Parameters<typeof api.listSystemLogs>[0] = { page, limit: LIMIT };
      if (levelFilter !== 'all')   opts.level = levelFilter;
      if (sourceFilter !== 'all')  opts.source = sourceFilter;
      if (resolvedFilter === 'open')     opts.resolved = false;
      if (resolvedFilter === 'resolved') opts.resolved = true;
      const data = await api.listSystemLogs(opts);
      setLogs(data.items);
      setTotal(data.total);
    } catch { setLogs([]); }
    setLoading(false);
  }, [page, levelFilter, sourceFilter, resolvedFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [levelFilter, sourceFilter, resolvedFilter]);

  const handleResolve = async (log: SystemLog, resolved: boolean) => {
    try {
      const updated = await api.resolveSystemLog(log.id, resolved);
      setLogs(prev => prev.map(l => l.id === log.id ? updated : l));
      if (selected?.id === log.id) setSelected(updated);
    } catch {}
  };

  const handleDelete = async (log: SystemLog) => {
    if (!confirm('Delete this log entry?')) return;
    try {
      await api.deleteSystemLog(log.id);
      setLogs(prev => prev.filter(l => l.id !== log.id));
      setTotal(t => t - 1);
      if (selected?.id === log.id) setSelected(null);
    } catch {}
  };

  const handleClear = async (deleteAll: boolean) => {
    const msg = deleteAll ? 'Delete ALL log entries? This cannot be undone.' : 'Clear all resolved log entries?';
    if (!confirm(msg)) return;
    setClearing(true);
    try {
      const { deleted } = await api.clearSystemLogs(deleteAll);
      alert(`Deleted ${deleted} log entries.`);
      fetchLogs();
    } catch {}
    setClearing(false);
  };

  const openCount     = logs.filter(l => !l.resolved).length;
  const errorCount    = logs.filter(l => l.level === 'error' && !l.resolved).length;
  const warnCount     = logs.filter(l => l.level === 'warn' && !l.resolved).length;
  const totalPages    = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface dark:text-white tracking-tight">System Health Monitor</h2>
          <p className="text-sm text-on-surface-variant dark:text-white/50 mt-0.5">Real-time frontend & backend error analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchLogs()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-low dark:bg-white/10 text-on-surface dark:text-white text-sm font-semibold hover:bg-surface-container dark:hover:bg-white/15 transition-colors disabled:opacity-50">
            <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>refresh</span>Refresh
          </button>
          <button onClick={() => handleClear(false)} disabled={clearing} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50">
            <span className="material-symbols-outlined text-base">cleaning_services</span>Clear Resolved
          </button>
          <button onClick={() => handleClear(true)} disabled={clearing} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50">
            <span className="material-symbols-outlined text-base">delete_sweep</span>Clear All
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Logs',       value: total,      icon: 'summarize',     color: 'text-on-surface dark:text-white',         bg: 'bg-surface-container-low dark:bg-white/10' },
          { label: 'Open Issues',      value: openCount,  icon: 'radio_button_checked', color: 'text-red-600 dark:text-red-400',   bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Errors',           value: errorCount, icon: 'error',         color: 'text-red-600 dark:text-red-400',           bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Warnings',         value: warnCount,  icon: 'warning',       color: 'text-amber-600 dark:text-amber-400',       bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-outline-variant/10`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`material-symbols-outlined text-lg ${s.color}`}>{s.icon}</span>
              <span className="text-[10px] font-black tracking-widest uppercase text-on-surface-variant dark:text-white/40">{s.label}</span>
            </div>
            <p className={`text-3xl font-black tracking-tight ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-surface-container-low dark:bg-white/5 rounded-2xl border border-outline-variant/10">
        <span className="text-[10px] font-black tracking-widest uppercase text-on-surface-variant/50 dark:text-white/30">Filter:</span>
        
        {/* Level */}
        <div className="flex gap-1.5">
          {['all', 'error', 'warn', 'info'].map(l => (
            <button key={l} onClick={() => setLevelFilter(l)}
              className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase transition-all ${levelFilter === l ? 'bg-on-surface dark:bg-white text-surface dark:text-black' : 'bg-surface dark:bg-white/10 text-on-surface-variant dark:text-white/50 hover:bg-surface-container dark:hover:bg-white/20'}`}>
              {l === 'all' ? 'All Levels' : l}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-outline-variant/30" />

        {/* Source */}
        <div className="flex gap-1.5">
          {['all', 'frontend', 'backend'].map(s => (
            <button key={s} onClick={() => setSourceFilter(s)}
              className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase transition-all ${sourceFilter === s ? 'bg-on-surface dark:bg-white text-surface dark:text-black' : 'bg-surface dark:bg-white/10 text-on-surface-variant dark:text-white/50 hover:bg-surface-container dark:hover:bg-white/20'}`}>
              {s === 'all' ? 'All Sources' : s}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-outline-variant/30" />

        {/* Status */}
        <div className="flex gap-1.5">
          {(['all', 'open', 'resolved'] as const).map(s => (
            <button key={s} onClick={() => setResolvedFilter(s)}
              className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase transition-all ${resolvedFilter === s ? 'bg-on-surface dark:bg-white text-surface dark:text-black' : 'bg-surface dark:bg-white/10 text-on-surface-variant dark:text-white/50 hover:bg-surface-container dark:hover:bg-white/20'}`}>
              {s === 'all' ? 'All Status' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Log Table */}
      <div className="rounded-2xl border border-outline-variant/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 animate-spin">refresh</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-green-600 dark:text-green-400">check_circle</span>
            </div>
            <p className="text-on-surface-variant dark:text-white/40 font-semibold">No logs found — system looks healthy!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container-low dark:bg-white/5 border-b border-outline-variant/10">
                <th className="text-left px-4 py-3 text-[10px] font-black tracking-widest uppercase text-on-surface-variant/50 dark:text-white/30">Level</th>
                <th className="text-left px-4 py-3 text-[10px] font-black tracking-widest uppercase text-on-surface-variant/50 dark:text-white/30">Message</th>
                <th className="text-left px-4 py-3 text-[10px] font-black tracking-widest uppercase text-on-surface-variant/50 dark:text-white/30 hidden md:table-cell">Source</th>
                <th className="text-left px-4 py-3 text-[10px] font-black tracking-widest uppercase text-on-surface-variant/50 dark:text-white/30 hidden lg:table-cell">Page</th>
                <th className="text-left px-4 py-3 text-[10px] font-black tracking-widest uppercase text-on-surface-variant/50 dark:text-white/30">Time</th>
                <th className="text-left px-4 py-3 text-[10px] font-black tracking-widest uppercase text-on-surface-variant/50 dark:text-white/30">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {logs.map(log => {
                const lc = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.error;
                const sc = SOURCE_CONFIG[log.source] || SOURCE_CONFIG.frontend;
                return (
                  <tr key={log.id}
                    className={`transition-colors hover:bg-surface-container-low dark:hover:bg-white/5 cursor-pointer ${log.resolved ? 'opacity-50' : ''}`}
                    onClick={() => setSelected(log)}>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${lc.bg} ${lc.text} ${lc.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${lc.dot}`} />
                        {lc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-on-surface dark:text-white truncate">{log.message}</p>
                      {log.stack && <p className="text-xs text-on-surface-variant dark:text-white/40 truncate font-mono mt-0.5">{log.stack.split('\n')[0]}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.color}`}>
                        <span className="material-symbols-outlined text-xs">{sc.icon}</span>{sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {log.url ? (
                        <p className="text-xs text-on-surface-variant dark:text-white/40 font-mono truncate max-w-[160px]" title={log.url}>
                          {log.url.replace(/^https?:\/\/[^/]+/, '')}
                        </p>
                      ) : <span className="text-xs text-on-surface-variant/30">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-on-surface-variant dark:text-white/40">{timeAgo(log.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {log.resolved ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                          <span className="material-symbols-outlined text-sm">check_circle</span>Resolved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 dark:text-red-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />Open
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleResolve(log, !log.resolved)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${log.resolved ? 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-on-surface-variant dark:text-white/40' : 'hover:bg-green-50 dark:hover:bg-green-900/20 text-on-surface-variant dark:text-white/40'}`}
                          title={log.resolved ? 'Reopen' : 'Mark Resolved'}>
                          <span className="material-symbols-outlined text-base">{log.resolved ? 'undo' : 'check'}</span>
                        </button>
                        <button onClick={() => handleDelete(log)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-on-surface-variant dark:text-white/40 transition-colors"
                          title="Delete">
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-on-surface-variant dark:text-white/40">
            Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-surface-container-low dark:bg-white/10 text-sm font-semibold disabled:opacity-40 hover:bg-surface-container dark:hover:bg-white/20 transition-colors">
              ← Prev
            </button>
            <span className="px-3 py-1.5 text-sm text-on-surface-variant dark:text-white/40">
              {page} / {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg bg-surface-container-low dark:bg-white/10 text-sm font-semibold disabled:opacity-40 hover:bg-surface-container dark:hover:bg-white/20 transition-colors">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <LogDetailModal
          log={selected}
          onClose={() => setSelected(null)}
          onResolve={handleResolve}
          onDelete={(l) => { handleDelete(l); setSelected(null); }}
        />
      )}
    </div>
  );
}
