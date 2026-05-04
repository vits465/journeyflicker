import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Contact } from '../lib/api';
import { useAdminAuth } from '../lib/adminAuth';
import { SplitViewLayout } from '../components/layout/SplitViewLayout';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';

function timeAgo(ts: number) {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const TYPE_COLORS: Record<string, string> = {
  'Private Curation Strategy': 'bg-primary/10 text-primary border-primary/20',
  'Expedition Modification':   'bg-secondary/10 text-secondary border-secondary/20',
  'Administrative Inquiry':    'bg-tertiary/10 text-tertiary border-tertiary/20',
  'Corporate Partnership':     'bg-success/10 text-success border-success/20',
};

export default function AdminContacts() {
  const { canEdit } = useAdminAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Contact | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [search, setSearch] = useState('');

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => api.listContacts(),
    refetchInterval: 8000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.markContactRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSelected(null);
    },
  });

  const markAllRead = async () => {
    const unread = contacts.filter(c => !c.read);
    await Promise.all(unread.map(c => markReadMutation.mutateAsync(c.id)));
  };

  const handleRowClick = (contact: Contact) => {
    if (!contact.read && canEdit) {
      markReadMutation.mutate(contact.id);
      // Optimistically update selected
      setSelected({ ...contact, read: true });
    } else {
      setSelected(contact);
    }
  };

  const unreadCount = contacts.filter(c => !c.read).length;
  let displayed = filter === 'unread' ? contacts.filter(c => !c.read) : contacts;
  if (search) {
    const s = search.toLowerCase();
    displayed = displayed.filter(c => c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s));
  }

  const columns: Column<Contact>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (c) => (
        <div className="flex items-center gap-3">
          {!c.read && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-black ${
            c.read ? 'bg-surface-container-low text-on-surface-variant' : 'bg-on-surface text-surface'
          }`}>
            {c.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className={`text-sm ${c.read ? 'text-on-surface-variant' : 'font-bold text-on-surface'}`}>{c.name}</span>
            <span className="text-[10px] text-on-surface-variant/60">{c.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      render: (c) => (
        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
          TYPE_COLORS[c.type] || 'bg-surface-container-low text-on-surface-variant border-outline-variant/20'
        }`}>
          {c.type}
        </span>
      )
    },
    {
      key: 'date',
      header: 'Date',
      render: (c) => (
        <span className="text-xs text-on-surface-variant">{timeAgo(c.createdAt)}</span>
      )
    }
  ];

  const actions = (
    <div className="flex items-center gap-2">
      <div className="flex bg-surface-container-low rounded-lg p-1 border border-outline-variant/30">
        {(['unread', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filter === f ? 'bg-white dark:bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
            }`}>
            {f === 'unread' ? `Unread (${unreadCount})` : `All`}
          </button>
        ))}
      </div>
      {unreadCount > 0 && canEdit && (
        <button onClick={markAllRead}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors">
          <span className="material-symbols-outlined text-sm">done_all</span>
          Mark all read
        </button>
      )}
    </div>
  );

  const tableContent = (
    <DataTable
      columns={columns}
      data={displayed}
      isLoading={isLoading}
      onRowClick={handleRowClick}
      search={{
        placeholder: "Search contacts...",
        value: search,
        onChange: setSearch
      }}
    />
  );

  const drawerContent = selected ? (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-on-surface text-surface flex items-center justify-center text-xl font-black shrink-0">
          {selected.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-on-surface">{selected.name}</h2>
          <a href={`mailto:${selected.email}`} className="text-sm text-on-surface-variant hover:text-primary transition-colors">
            {selected.email}
          </a>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
          TYPE_COLORS[selected.type] || 'bg-surface-container-low text-on-surface-variant border-outline-variant/20'
        }`}>
          {selected.type}
        </span>
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-surface-container-low text-on-surface-variant border border-outline-variant/20">
          {timeAgo(selected.createdAt)}
        </span>
      </div>

      <div className="bg-white dark:bg-surface p-6 rounded-xl border border-outline-variant/20 shadow-sm flex-1">
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-on-surface-variant/50 mb-4 border-b border-outline-variant/10 pb-2">Message Content</p>
        {selected.message ? (
          <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
            {selected.message}
          </p>
        ) : (
          <p className="text-sm italic text-on-surface-variant/50">No message body provided.</p>
        )}
      </div>

      <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-primary/70 mb-2">Quick Reply</p>
        <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.type)}&body=Dear ${encodeURIComponent(selected.name)},%0A%0A`}
          className="text-xs text-primary hover:underline font-medium block truncate">
          Click to reply to {selected.email}
        </a>
      </div>
    </div>
  ) : null;

  const drawerActions = selected && canEdit && (
    <button onClick={() => {
      if (confirm('Delete this message?')) deleteMutation.mutate(selected.id);
    }}
      className="flex items-center justify-center w-8 h-8 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
      title="Delete Message"
    >
      <span className="material-symbols-outlined text-xl">delete</span>
    </button>
  );

  return (
    <SplitViewLayout
      title="Contacts"
      actions={actions}
      tableContent={tableContent}
      drawerContent={drawerContent}
      isDrawerOpen={!!selected}
      onCloseDrawer={() => setSelected(null)}
      drawerTitle="Submission Details"
      drawerActions={drawerActions}
    />
  );
}
