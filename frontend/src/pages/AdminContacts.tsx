import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { Contact } from '../lib/api';
import { useAdminAuth } from '../lib/adminAuth';

function timeAgo(ts: number) {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const TYPE_COLORS: Record<string, string> = {
  'Private Curation Strategy': 'bg-purple-50 text-purple-700 border-purple-100',
  'Expedition Modification':   'bg-blue-50 text-blue-700 border-blue-100',
  'Administrative Inquiry':    'bg-yellow-50 text-yellow-700 border-yellow-100',
  'Corporate Partnership':     'bg-green-50 text-green-700 border-green-100',
};

export default function AdminContacts() {
  const { canEdit } = useAdminAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  const load = useCallback(() => {
    api.listContacts()
      .then(data => { setContacts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000); // poll every 8s for new messages
    return () => clearInterval(interval);
  }, [load]);

  const markRead = async (contact: Contact) => {
    if (!contact.read && canEdit) {
      await api.markContactRead(contact.id).catch(() => {});
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, read: true } : c));
    }
    setSelected(contact);
  };

  const deleteContact = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    await api.deleteContact(id).catch(() => {});
    setContacts(prev => prev.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const markAllRead = async () => {
    const unread = contacts.filter(c => !c.read);
    await Promise.all(unread.map(c => api.markContactRead(c.id).catch(() => {})));
    setContacts(prev => prev.map(c => ({ ...c, read: true })));
  };

  const unreadCount = contacts.filter(c => !c.read).length;
  const displayed = filter === 'unread' ? contacts.filter(c => !c.read) : contacts;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="bg-black text-white rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg">mail</span>
              </div>
              <span className="text-[10px] font-black tracking-[0.5em] uppercase text-white/40">Incoming Registry</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
                  {unreadCount} new
                </span>
              )}
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Contact Submissions</h1>
            <p className="text-white/40 text-xs font-light mt-1">Inquiries submitted via the public contact form.</p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && canEdit && (
              <button onClick={markAllRead}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/10 text-white/80 rounded-xl text-xs font-semibold hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined text-sm">done_all</span>
                Mark all read
              </button>
            )}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-3xl font-light text-white leading-none">{String(contacts.length).padStart(2,'0')}</span>
              <span className="text-[9px] font-black tracking-widest uppercase text-white/30">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2">
        {(['unread', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-full text-[10px] font-black tracking-[0.3em] uppercase transition-all border ${
              filter === f ? 'bg-black text-white border-black shadow-md' : 'border-outline-variant/30 text-on-surface-variant hover:border-black/30'
            }`}>
            {f === 'unread' ? `Unread (${unreadCount})` : `All (${contacts.length})`}
          </button>
        ))}
      </div>

      {/* ── Main Layout: List + Detail ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Message List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant/20 bg-surface-container-low">
            <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant">
              {filter === 'unread' ? 'Unread Messages' : 'All Messages'}
            </span>
          </div>

          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-black/10 border-t-black animate-spin" />
            </div>
          ) : displayed.length === 0 ? (
            <div className="p-10 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 block mb-3 font-light">
                {filter === 'unread' ? 'mark_email_read' : 'inbox'}
              </span>
              <p className="text-sm text-on-surface-variant opacity-50 italic font-light">
                {filter === 'unread' ? 'No unread messages' : 'No messages yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/15 max-h-[600px] overflow-y-auto">
              {displayed.map(contact => (
                <button key={contact.id} onClick={() => markRead(contact)}
                  className={`w-full text-left px-4 py-4 hover:bg-surface-container-low/60 transition-colors relative group ${
                    selected?.id === contact.id ? 'bg-black/[0.03] border-l-2 border-black' : ''
                  }`}>
                  {/* Unread dot */}
                  {!contact.read && (
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                  <div className="flex items-start gap-3 pr-4">
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-black ${
                      contact.read ? 'bg-surface-container-low text-on-surface-variant' : 'bg-black text-white'
                    }`}>
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={`text-sm truncate ${contact.read ? 'font-normal text-on-surface-variant' : 'font-bold text-black'}`}>
                          {contact.name}
                        </p>
                        <span className="text-[9px] text-on-surface-variant/40 shrink-0 ml-2">{timeAgo(contact.createdAt)}</span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant/60 truncate">{contact.email}</p>
                      <p className="text-xs text-on-surface-variant/50 font-light truncate mt-0.5">{contact.message || contact.type}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden h-full">
              {/* Detail header */}
              <div className="px-6 py-5 border-b border-outline-variant/20 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-lg font-black shrink-0">
                    {selected.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-black">{selected.name}</h2>
                    <a href={`mailto:${selected.email}`} className="text-sm text-on-surface-variant hover:text-primary transition-colors">
                      {selected.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={`mailto:${selected.email}`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-sm">mail</span>
                    Reply
                  </a>
                  {canEdit && (
                    <button onClick={() => deleteContact(selected.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Meta chips */}
              <div className="px-6 py-4 border-b border-outline-variant/10 flex flex-wrap gap-3">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                  TYPE_COLORS[selected.type] || 'bg-surface-container-low text-on-surface-variant border-outline-variant/20'
                }`}>
                  {selected.type}
                </span>
                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-surface-container-low text-on-surface-variant border border-outline-variant/20">
                  {timeAgo(selected.createdAt)}
                </span>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                  selected.read
                    ? 'bg-green-50 text-green-700 border-green-100'
                    : 'bg-red-50 text-red-600 border-red-100'
                }`}>
                  {selected.read ? '✓ Read' : '● Unread'}
                </span>
              </div>

              {/* Message body */}
              <div className="px-6 py-6">
                <p className="text-[9px] font-black tracking-[0.4em] uppercase text-on-surface-variant/40 mb-3">Message</p>
                {selected.message ? (
                  <p className="text-sm font-light text-on-surface leading-relaxed whitespace-pre-wrap opacity-80">
                    {selected.message}
                  </p>
                ) : (
                  <p className="text-sm italic text-on-surface-variant/40 font-light">No message body provided.</p>
                )}
              </div>

              {/* Quick reply hint */}
              <div className="mx-6 mb-6 p-4 bg-surface-container-low rounded-xl border border-outline-variant/15">
                <p className="text-[9px] font-black tracking-[0.3em] uppercase text-on-surface-variant/40 mb-1">Quick Reply</p>
                <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.type)}&body=Dear ${encodeURIComponent(selected.name)},%0A%0A`}
                  className="text-xs font-light text-primary hover:underline break-all">
                  {selected.email}
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-surface-container-low rounded-2xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 font-light">mark_as_unread</span>
              </div>
              <h3 className="text-lg font-light tracking-tighter italic mb-2">Select a message</h3>
              <p className="text-xs text-on-surface-variant opacity-50 max-w-[200px] leading-relaxed">
                Click on a submission from the list to view its full details here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
