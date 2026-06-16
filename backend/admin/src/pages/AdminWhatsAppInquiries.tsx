import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Inquiry } from '../lib/api';
import { useAdminAuth } from '../lib/adminAuth';
import { SplitViewLayout } from '../components/layout/SplitViewLayout';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';

function timeAgo(dateStr: string) {
  const ts = new Date(dateStr).getTime();
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (isNaN(secs)) return 'recently';
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const STATUS_COLORS: Record<string, string> = {
  'New': 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50',
  'Quoted': 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
  'Booked': 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
  'Closed': 'bg-zinc-50 dark:bg-zinc-950/20 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-900/50',
};

export default function AdminWhatsAppInquiries() {
  const { canCRUD } = useAdminAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [filter, setFilter] = useState<'All' | 'New' | 'Quoted' | 'Booked' | 'Closed'>('All');
  const [search, setSearch] = useState('');

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['whatsapp-inquiries'],
    queryFn: () => api.listWhatsAppInquiries(),
    refetchInterval: 8000, // Poll every 8 seconds
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      api.updateWhatsAppInquiryStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-inquiries'] });
      if (selected && selected._id === data._id) {
        setSelected(data);
      }
    },
    onError: (err) => {
      console.error(err);
      alert('Failed to update status.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteWhatsAppInquiry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-inquiries'] });
      setSelected(null);
      alert('Inquiry deleted successfully.');
    },
    onError: (err) => {
      console.error(err);
      alert('Failed to delete inquiry.');
    }
  });

  const handleRowClick = (inquiry: Inquiry) => {
    setSelected(inquiry);
  };

  const handleStatusChange = (status: string) => {
    if (!selected || !canCRUD) return;
    updateStatusMutation.mutate({ id: selected._id, status });
  };

  // Filter & search inquiries
  let displayed = filter === 'All' ? inquiries : inquiries.filter(i => i.status === filter);
  if (search) {
    const s = search.toLowerCase();
    displayed = displayed.filter(i => 
      i.name.toLowerCase().includes(s) || 
      (i.phone && i.phone.toLowerCase().includes(s)) ||
      (i.destination && i.destination.toLowerCase().includes(s))
    );
  }

  // Calculate status counters
  const counts = inquiries.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, { 'New': 0, 'Quoted': 0, 'Booked': 0, 'Closed': 0 } as Record<string, number>);

  const columns: Column<Inquiry>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (i) => (
        <div className="flex items-center gap-3">
          {i.status === 'New' && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center shrink-0 text-sm font-black">
            {i.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold text-on-surface">{i.name}</span>
            <span className="text-[10px] text-on-surface-variant/60">{i.phone || 'No Phone'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'destination',
      header: 'Destination',
      render: (i) => (
        <div className="flex flex-col text-left">
          <span className="text-xs font-medium text-on-surface">{i.destination || 'Custom Curation'}</span>
          {i.plan && <span className="text-[9px] text-on-surface-variant/50 uppercase tracking-widest">{i.plan.replace('plan_', '').replace('_', ' ')}</span>}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (i) => (
        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
          STATUS_COLORS[i.status] || 'bg-surface-container-low text-on-surface-variant border-outline-variant/20'
        }`}>
          {i.status}
        </span>
      )
    },
    {
      key: 'date',
      header: 'Time',
      render: (i) => (
        <span className="text-xs text-on-surface-variant">{timeAgo(i.date)}</span>
      )
    }
  ];

  const actions = (
    <div className="flex items-center gap-2 overflow-x-auto py-1">
      <div className="flex bg-surface-container-low rounded-lg p-1 border border-outline-variant/30 shrink-0">
        {(['All', 'New', 'Quoted', 'Booked', 'Closed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              filter === f ? 'bg-white dark:bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
            }`}>
            {f} {f !== 'All' ? `(${counts[f] || 0})` : `(${inquiries.length})`}
          </button>
        ))}
      </div>
    </div>
  );

  const tableContent = (
    <DataTable
      columns={columns}
      data={displayed}
      isLoading={isLoading}
      onRowClick={handleRowClick}
      search={{
        placeholder: "Search WhatsApp leads...",
        value: search,
        onChange: setSearch
      }}
    />
  );

  const drawerContent = selected ? (
    <div className="flex flex-col h-full gap-6 text-left">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-black shrink-0 shadow-lg shadow-emerald-500/10">
          {selected.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-on-surface">{selected.name}</h2>
          <p className="text-sm font-light text-on-surface-variant/80">{selected.phone || 'No Phone number'}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
          STATUS_COLORS[selected.status] || 'bg-surface-container-low text-on-surface-variant border-outline-variant/20'
        }`}>
          {selected.status}
        </span>
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-surface-container-low text-on-surface-variant border border-outline-variant/20">
          📍 {selected.destination || 'General Inquiry'}
        </span>
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-surface-container-low text-on-surface-variant border border-outline-variant/20">
          📅 {timeAgo(selected.date)}
        </span>
      </div>

      {/* WhatsApp Direct Action Button */}
      {selected.phone && (
        <a 
          href={`https://wa.me/${selected.phone.replace(/[^\d]/g, '')}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 text-center shrink-0 cursor-pointer"
        >
          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.197 1.45 4.817 1.451 5.536 0 10.04-4.5 10.044-10.038.002-2.684-1.04-5.207-2.93-7.099-1.89-1.89-4.411-2.932-7.098-2.933-5.54 0-10.046 4.502-10.05 10.039-.001 1.777.464 3.51 1.346 5.034L1.018 21.87l6.108-1.602c1.472.802 3.12 1.226 4.8 1.228z" />
          </svg>
          Open Chat in WhatsApp
        </a>
      )}

      {/* Customer Request Details */}
      <div className="bg-white dark:bg-surface p-5 rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col gap-3">
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-on-surface-variant/50 border-b border-outline-variant/10 pb-2">Customer Inquiry</p>
        <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap font-light">
          {selected.query || <span className="italic text-on-surface-variant/40">No request details provided.</span>}
        </p>
      </div>

      {/* AI Assistant Chat Log */}
      <div className="bg-zinc-50 dark:bg-white/[0.02] p-5 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col gap-3">
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-emerald-600 dark:text-emerald-400 border-b border-outline-variant/10 pb-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          AI Response log
        </p>
        <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap font-light font-mono bg-white dark:bg-zinc-950 p-3 rounded-xl border border-outline-variant/20 max-h-[140px] overflow-y-auto">
          {selected.aiResponse || <span className="italic text-on-surface-variant/40">No automated AI reply registered.</span>}
        </p>
      </div>

      {/* Dynamic Status Changer */}
      {canCRUD && (
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-2">
          <label className="text-[9px] font-black tracking-[0.2em] uppercase text-primary/70 block">Update Lead Status</label>
          <select 
            value={selected.status} 
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full bg-white dark:bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-xs font-semibold outline-none cursor-pointer focus:border-primary"
          >
            <option value="New">🔴 New Lead</option>
            <option value="Quoted">🟡 Quoted / Sent pricing</option>
            <option value="Booked">🟢 Booked / Closed Won</option>
            <option value="Closed">⚪ Closed Lost</option>
          </select>
        </div>
      )}
    </div>
  ) : null;

  const drawerActions = selected && canCRUD && (
    <button onClick={() => {
      if (confirm('Permanently delete this inquiry from CRM databases?')) deleteMutation.mutate(selected._id);
    }}
      className="flex items-center justify-center w-8 h-8 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-colors"
      title="Delete Lead"
    >
      <span className="material-symbols-outlined text-xl">delete</span>
    </button>
  );

  return (
    <SplitViewLayout
      title="WhatsApp Leads"
      actions={actions}
      tableContent={tableContent}
      drawerContent={drawerContent}
      isDrawerOpen={!!selected}
      onCloseDrawer={() => setSelected(null)}
      drawerTitle="WhatsApp Lead Details"
      drawerActions={drawerActions}
    />
  );
}
