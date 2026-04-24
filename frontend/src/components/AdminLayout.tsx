import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../lib/adminAuth';
import { api } from '../lib/api';

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const { role, username, logout, canEdit } = useAdminAuth();

  // Poll for unread contact submissions
  useEffect(() => {
    const fetchUnread = () => {
      api.listContacts()
        .then(contacts => setUnreadCount(contacts.filter(c => !c.read).length))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, []);

  // Redirect to login if not authenticated
  if (!role) return <Navigate to="/admin/login" replace />;

  const adminLinks = [
    { path: '/admin',              label: 'Dashboard',    icon: 'dashboard' },
    { path: '/admin/destinations', label: 'Destinations', icon: 'location_on' },
    { path: '/admin/tours',        label: 'Tours',        icon: 'flight' },
    { path: '/admin/visas',        label: 'Visas',        icon: 'passport' },
    { path: '/admin/media',        label: 'Media Library',icon: 'photo_library' },
    { path: '/admin/reviews',      label: 'Reviews',      icon: 'star' },
    { path: '/admin/contacts',     label: 'Contacts',     icon: 'mail', badge: unreadCount },
  ];

  const editorOnlyLinks = [
    { path: '/admin/hero',         label: 'Hero Slides',    icon: 'slideshow' },
    { path: '/admin/seo',          label: 'SEO Manager',    icon: 'search' },
    { path: '/admin/access',       label: 'Access Control', icon: 'key' },
    { path: '/admin/api-settings', label: 'API Settings',   icon: 'api' },
  ];

  const allLinks = canEdit ? [...adminLinks, ...editorOnlyLinks] : adminLinks;

  const roleBadge = canEdit
    ? { label: 'Editor', color: 'bg-green-500', icon: 'manage_accounts' }
    : { label: 'Viewer', color: 'bg-blue-500', icon: 'visibility' };

  return (
    <div className="flex h-screen bg-surface-container-lowest font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        fixed md:relative z-50 md:z-auto
        w-64 md:w-20 lg:w-64 h-full bg-black text-white
        transition-transform duration-300 ease-in-out flex flex-col`}>

        {/* Brand */}
        <div className="px-5 py-5 flex items-center justify-between flex-shrink-0 border-b border-white/10">
          <NavLink to="/" className="text-white font-light tracking-tighter uppercase whitespace-nowrap hover:opacity-80 transition-opacity">
            <span className="hidden lg:inline">Journey<span className="font-black">Flicker</span></span>
            <span className="lg:hidden text-lg">J<span className="font-black">F</span></span>
          </NavLink>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/40 hover:text-white">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl">
            <div className={`w-2 h-2 rounded-full ${roleBadge.color}`} />
            <span className="material-symbols-outlined text-white/60 text-base">{roleBadge.icon}</span>
            <div className="hidden lg:block min-w-0">
              <p className="text-white text-xs font-semibold truncate">{username}</p>
              <p className="text-white/40 text-[10px]">{roleBadge.label} Access</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <span className="hidden lg:block text-[9px] tracking-[0.4em] uppercase text-white/30 font-black px-3 mb-3">Control</span>
          {allLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/admin'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group whitespace-nowrap ${
                  isActive ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <span className="material-symbols-outlined text-xl flex-shrink-0 font-light">{link.icon}</span>
              <span className="hidden lg:block text-sm font-medium flex-1">{link.label}</span>
              {'badge' in link && (link as { badge?: number }).badge! > 0 && (
                <span className="hidden lg:flex ml-auto min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full items-center justify-center px-1 animate-pulse">
                  {(link as { badge?: number }).badge}
                </span>
              )}
              {'badge' in link && (link as { badge?: number }).badge! > 0 && (
                <span className="lg:hidden absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1 flex-shrink-0">
          <NavLink to="/" onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200 whitespace-nowrap">
            <span className="material-symbols-outlined text-xl flex-shrink-0 font-light">public</span>
            <span className="hidden lg:block text-sm font-light">View Live Site</span>
          </NavLink>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 whitespace-nowrap">
            <span className="material-symbols-outlined text-xl flex-shrink-0 font-light">logout</span>
            <span className="hidden lg:block text-sm font-light">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        {/* Decorative background */}
        <div className="absolute inset-0 z-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        {/* Top Bar */}
        <div className="h-16 flex items-center justify-between px-4 md:px-8 flex-shrink-0 relative z-10 bg-white/80 backdrop-blur border-b border-outline-variant/20 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
              <span className="material-symbols-outlined font-light text-lg">menu</span>
            </button>
            <h1 className="text-base font-semibold text-on-surface tracking-tight">
              {adminLinks.find((l) => location.pathname === l.path)?.label
              ?? (location.pathname === '/admin/access' ? 'Access Control' : 'Admin')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Unread notification bell */}
            {unreadCount > 0 && (
              <NavLink to="/admin/contacts"
                className="relative flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors">
                <span className="material-symbols-outlined text-red-500 text-sm">notifications_active</span>
                <span className="text-red-600 text-[10px] font-black uppercase tracking-wide">{unreadCount} New</span>
              </NavLink>
            )}
            {/* Read-only banner */}
            {!canEdit && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
                <span className="material-symbols-outlined text-blue-500 text-sm">visibility</span>
                <span className="text-blue-600 text-[10px] font-bold uppercase tracking-wide">Read Only</span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-green-700">Live Sync</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 relative z-10">
          <Outlet context={{ canEdit }} />
        </div>
      </div>
    </div>
  );
}
