import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Destination, Tour, Visa } from '../lib/api';
import { useAdminAuth } from '../lib/adminAuth';
import { CSVUploader } from '../components/CSVUploader';
import { DocxUploader } from '../components/DocxUploader';
import { useNavigate } from 'react-router-dom';
import { Preloader } from '../components/Preloader';
import { formatDistanceToNow } from 'date-fns';
import type { Activity } from '../lib/api';

type ViewMode = 'grid' | 'list';

const S = `
  .db-container { animation: fadeIn 0.5s ease-out; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  
  .db-glass { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.3); }
  
  .db-banner { 
    position: relative; overflow: hidden; border-radius: 24px; padding: 40px; 
    background: linear-gradient(135deg, #000 0%, #1a1a1a 100%); color: white;
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  }
  .db-banner-img { 
    position: absolute; inset: 0; opacity: 0.3; object-fit: cover; width: 100%; height: 100%; 
    mix-blend-mode: overlay; filter: grayscale(100%);
  }
  
  .stat-card {
    background: var(--color-surface); border-radius: 20px; padding: 24px; border: 1px solid var(--color-outline-variant);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .stat-card:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0,0,0,0.05); border-color: #e0e0e0; }
  
  .action-btn {
    display: flex; align-items: center; gap: 10px; padding: 12px 20px; border-radius: 14px;
    font-size: 13px; font-weight: 700; transition: all 0.2s; border: none; cursor: pointer;
    background: var(--color-surface-container); color: var(--color-on-surface);
  }
  .action-btn:hover { background: var(--color-primary); color: var(--color-on-primary); transform: scale(1.02); }
  
  .db-tab-btn {
    padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 600;
    transition: all 0.2s; display: flex; align-items: center; gap: 8px;
  }
  .db-tab-btn.active { background: var(--color-primary); color: var(--color-on-primary); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  .db-tab-btn:not(.active) { color: var(--color-on-surface-variant); }
  .db-tab-btn:not(.active):hover { background: var(--color-surface-container); color: var(--color-on-surface); }

  .content-card {
    background: var(--color-surface); border-radius: 24px; border: 1px solid var(--color-outline-variant); overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
  }
  
  .grid-item {
    border-radius: 20px; border: 1px solid var(--color-outline-variant); overflow: hidden;
    transition: all 0.3s; background: var(--color-surface);
  }
  .grid-item:hover { border-color: #ddd; box-shadow: 0 10px 25px rgba(0,0,0,0.06); transform: translateY(-3px); }
  
  .pill { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 100px; }
  .pill-blue { background: #eef2ff; color: #4f46e5; }
  .pill-green { background: #f0fdf4; color: #16a34a; }
  .pill-purple { background: #faf5ff; color: #9333ea; }
`;

export default function AdminDashboard() {
  const { canEdit, canCRUD } = useAdminAuth();
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [visas, setVisas] = useState<Visa[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'destinations' | 'tours' | 'visas'>('destinations');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    loadAll();
    loadActivity();
    const interval = setInterval(() => {
      loadAll(true); // Silent background refresh
      loadActivity();
    }, 10000); 
    return () => clearInterval(interval);
  }, []);

  const loadAll = (silent = false) => {
    if (!silent) setLoading(true);
    Promise.all([
      api.listDestinations(),
      api.listTours(),
      api.listVisas()
    ]).then(([d, t, v]) => {
      setDestinations(d || []);
      setTours(t || []);
      setVisas(v || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  const loadActivity = () => {
    api.listActivity()
      .then(setActivities)
      .catch(console.error);
  };

  const stats = [
    { title: 'Destinations', value: destinations.length, icon: 'location_on', color: 'text-indigo-600', bg: 'bg-indigo-50', href: '/destinations' },
    { title: 'Tours', value: tours.length, icon: 'flight', color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/tours' },
    { title: 'Visas', value: visas.length, icon: 'passport', color: 'text-purple-600', bg: 'bg-purple-50', href: '/visas' },
    { title: 'System Status', value: '100%', icon: 'bolt', color: 'text-amber-600', bg: 'bg-amber-50', suffix: ' Uptime' },
  ];

  return (
    <div className="db-container space-y-8 max-w-7xl mx-auto pb-12">
      <style>{S}</style>

      {/* ── Welcome Section ── */}
      <div className="db-banner">
        <img src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2070&auto=format&fit=crop" className="db-banner-img" alt="Background" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/50">System Operational</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white">
              Curator <span className="italic font-serif opacity-90 text-indigo-400">Command</span>
            </h1>
            <p className="text-white/60 text-sm font-light max-w-md"> Orchestrate global itineraries and manage destination intelligence from a single interface. </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-indigo-400">verified_user</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Access Level</p>
              <p className="text-white font-medium text-sm">{canEdit ? 'Administrative Editor' : canCRUD ? 'Co-Editor Access' : 'Observer Access'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="stat-card dark:bg-white/5 dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${s.bg} dark:bg-opacity-10 flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-xl ${s.color}`}>{s.icon}</span>
              </div>
              {s.href && (
                <Link to={s.href} className="text-[10px] font-bold text-on-surface-variant hover:text-on-surface transition-colors uppercase tracking-widest">Manage</Link>
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold font-serif italic text-on-surface">
                {loading ? '...' : s.value}
                {s.suffix && <span className="text-xs font-sans font-bold not-italic ml-1 text-on-surface-variant uppercase tracking-tighter">{s.suffix}</span>}
              </h3>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">{s.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Recent Activity ── */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-white/5 rounded-3xl p-6 border border-gray-100 dark:border-white/10 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Intelligence Feed</h3>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </div>
            </div>
            
            <div className="space-y-6 overflow-y-auto max-h-[500px] pr-2 admin-scroll">
              {activities.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <span className="material-symbols-outlined text-gray-200 text-4xl">history</span>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">No recent activity</p>
                </div>
              ) : (
                activities.map((act) => {
                  let icon = 'info';
                  let iconColor = 'text-blue-500';
                  if (act.action.includes('Created')) { icon = 'add_circle'; iconColor = 'text-emerald-500'; }
                  if (act.action.includes('Updated')) { icon = 'edit'; iconColor = 'text-amber-500'; }
                  if (act.action.includes('Deleted')) { icon = 'delete'; iconColor = 'text-rose-500'; }
                  if (act.action.includes('Uploaded')) { icon = 'cloud_upload'; iconColor = 'text-indigo-500'; }
                  
                  return (
                    <div key={act.id} className="flex gap-4 group">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center border border-gray-100 dark:border-white/10 group-hover:scale-110 transition-transform`}>
                          <span className={`material-symbols-outlined text-lg ${iconColor}`}>{icon}</span>
                        </div>
                        <div className="w-px flex-1 bg-gray-100 dark:bg-white/5 group-last:hidden" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-on-surface leading-tight">
                          {act.user || 'System'} <span className="font-medium text-on-surface-variant">{act.action}</span>
                        </p>
                        <p className="text-[10px] text-on-surface-variant font-medium">{formatDistanceToNow(act.timestamp)} ago</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="lg:col-span-2 space-y-6">
          {canCRUD && (
            <div className="bg-white dark:bg-white/5 rounded-3xl p-6 border border-gray-100 dark:border-white/10 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Administrative Orchestration</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Link to="/destinations" className="action-btn dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                  <span className="material-symbols-outlined">add_location</span>
                  <span>New Destination</span>
                </Link>
                <Link to="/tours" className="action-btn dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                  <span className="material-symbols-outlined">add_road</span>
                  <span>Create Tour</span>
                </Link>
                <Link to="/visas" className="action-btn dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                  <span className="material-symbols-outlined">description</span>
                  <span>Visa Rules</span>
                </Link>
                {canEdit && (
                  <>
                    <Link to="/hero" className="action-btn dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                      <span className="material-symbols-outlined text-amber-600">view_carousel</span> Hero Engine
                    </Link>
                    <Link to="/access" className="action-btn dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                      <span className="material-symbols-outlined text-violet-600">key</span> Security & Access
                    </Link>
                    <CSVUploader type="destination" onUploadComplete={loadAll} />
                    <CSVUploader type="tour" onUploadComplete={loadAll} />
                    <div className="col-span-full h-px bg-outline-variant/10 my-1" />
                    <div className="col-span-full space-y-2">
                      <p className="text-[9px] font-black tracking-[0.2em] uppercase text-primary/60 px-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs">auto_awesome</span>
                        AI Smart Import
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <DocxUploader 
                          label="Tour from Doc" 
                          onParsed={(text: string) => navigate('/tours', { state: { importText: text } })} 
                        />
                        <DocxUploader 
                          label="Dest from Doc" 
                          onParsed={(text: string) => navigate('/destinations', { state: { importText: text } })} 
                        />
                        <DocxUploader 
                          label="Visa from Doc" 
                          onParsed={(text: string) => navigate('/visas', { state: { importText: text } })} 
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Content Browser ── */}
          <div className="content-card dark:bg-white/5 dark:border-white/10">
            <div className="px-6 py-5 border-b border-gray-50 dark:border-white/10 bg-gray-50/30 dark:bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex p-1 bg-gray-100/80 dark:bg-white/5 rounded-14 w-fit">
                {[
                  { id: 'destinations', label: 'Destinations', icon: 'location_on', count: destinations.length },
                  { id: 'tours', label: 'Tours', icon: 'flight', count: tours.length },
                  { id: 'visas', label: 'Visas', icon: 'passport', count: visas.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`db-tab-btn ${activeTab === tab.id ? 'active dark:bg-white dark:text-black' : 'dark:text-white/60 dark:hover:bg-white/10'}`}
                  >
                    <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black' : 'bg-white text-gray-400 dark:bg-white/10 dark:text-white/40'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 p-1 bg-gray-100/80 dark:bg-white/5 rounded-14 w-fit">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-10 transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 shadow-sm text-black dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                  <span className="material-symbols-outlined text-sm block">grid_view</span>
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-10 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 shadow-sm text-black dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                  <span className="material-symbols-outlined text-sm block">view_list</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="py-20"><Preloader /></div>
              ) : (
                <div className="min-h-[400px]">
                  {/* Destinations Grid */}
                  {activeTab === 'destinations' && (
                    destinations.length === 0 ? <EmptyState label="destinations" /> : (
                      <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 gap-6" : "space-y-3"}>
                        {destinations.map(d => (
                          <div key={d.id} className={viewMode === 'grid' ? "grid-item dark:bg-white/5 dark:border-white/10" : "flex items-center gap-4 p-4 border border-gray-100 dark:border-white/10 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"}>
                            <div className={viewMode === 'grid' ? "h-40 overflow-hidden relative" : "w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"}>
                              {d.heroImageUrl ? (
                                <img src={d.heroImageUrl} className="w-full h-full object-cover" alt={d.name} />
                              ) : (
                                <div className="w-full h-full bg-gray-50 dark:bg-white/5 flex items-center justify-center"><span className="material-symbols-outlined text-gray-300">image</span></div>
                              )}
                              {viewMode === 'grid' && (
                                <div className="absolute top-3 right-3"><span className="pill pill-blue backdrop-blur-md bg-white/80 dark:bg-black/60 dark:text-blue-400">{d.region}</span></div>
                              )}
                            </div>
                            <div className={viewMode === 'grid' ? "p-5" : "flex-1 min-w-0"}>
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-bold text-on-surface truncate">{d.name}</h4>
                                {viewMode === 'list' && <span className="pill pill-blue">{d.region}</span>}
                              </div>
                              <p className="text-xs text-on-surface-variant line-clamp-1 mb-3">{d.description || 'No description added.'}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                  {d.landmarks && d.landmarks.length > 0 && <span className="text-[10px] text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">place</span>{d.landmarks.length}</span>}
                                  {d.galleryImages && d.galleryImages.length > 0 && <span className="text-[10px] text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">photo</span>{d.galleryImages.length}</span>}
                                </div>
                                {canCRUD && <Link to={`/destinations?edit=${d.id}`} className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400">Configure →</Link>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {/* Tours Grid */}
                  {activeTab === 'tours' && (
                    tours.length === 0 ? <EmptyState label="tours" /> : (
                      <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 gap-6" : "space-y-3"}>
                        {tours.map(t => (
                          <div key={t.id} className={viewMode === 'grid' ? "grid-item dark:bg-white/5 dark:border-white/10" : "flex items-center gap-4 p-4 border border-gray-100 dark:border-white/10 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"}>
                            <div className={viewMode === 'grid' ? "h-40 overflow-hidden relative" : "w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"}>
                              {t.heroImageUrl ? (
                                <img src={t.heroImageUrl} className="w-full h-full object-cover" alt={t.name} />
                              ) : (
                                <div className="w-full h-full bg-gray-50 dark:bg-white/5 flex items-center justify-center"><span className="material-symbols-outlined text-gray-300">flight</span></div>
                              )}
                              {viewMode === 'grid' && (
                                <div className="absolute top-3 left-3"><span className="pill pill-green backdrop-blur-md bg-white/80 dark:bg-black/60 dark:text-emerald-400">{t.days} Days</span></div>
                              )}
                            </div>
                            <div className={viewMode === 'grid' ? "p-5" : "flex-1 min-w-0"}>
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-bold text-on-surface truncate">{t.name}</h4>
                                {viewMode === 'list' && <span className="pill pill-green">{t.days} Days</span>}
                              </div>
                              <p className="text-xs text-on-surface-variant mb-3">{t.region} · <span className="font-bold text-on-surface/80">{t.price}</span></p>
                              <div className="flex items-center justify-between">
                                <div className="flex gap-3">
                                  {t.itinerary && t.itinerary.length > 0 && <span className="text-[10px] text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">route</span>{t.itinerary.length}</span>}
                                  {t.transport && <span className="text-[10px] text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">commute</span></span>}
                                </div>
                                {canCRUD && <Link to={`/tours?edit=${t.id}`} className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400">Design →</Link>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {/* Visas Grid */}
                  {activeTab === 'visas' && (
                    visas.length === 0 ? <EmptyState label="visas" /> : (
                      <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 gap-6" : "space-y-3"}>
                        {visas.map(v => (
                          <div key={v.id} className={viewMode === 'grid' ? "grid-item dark:bg-white/5 dark:border-white/10" : "flex items-center gap-4 p-4 border border-gray-100 dark:border-white/10 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"}>
                            <div className={viewMode === 'grid' ? "h-40 overflow-hidden relative" : "w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"}>
                              {v.heroImageUrl ? (
                                <img src={v.heroImageUrl} className="w-full h-full object-cover" alt={v.country} />
                              ) : (
                                <div className="w-full h-full bg-purple-50 dark:bg-white/5 flex items-center justify-center"><span className="material-symbols-outlined text-purple-300">passport</span></div>
                              )}
                              {viewMode === 'grid' && (
                                <div className="absolute top-3 left-3"><span className={`pill ${v.difficulty === 'Easy' ? 'pill-green' : v.difficulty === 'Moderate' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'} backdrop-blur-md bg-white/80 dark:bg-black/60`}>{v.difficulty}</span></div>
                              )}
                            </div>
                            <div className={viewMode === 'grid' ? "p-5" : "flex-1 min-w-0"}>
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-bold text-on-surface truncate">{v.country}</h4>
                                {viewMode === 'list' && <span className={`pill ${v.difficulty === 'Easy' ? 'pill-green' : v.difficulty === 'Moderate' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'}`}>{v.difficulty}</span>}
                              </div>
                              <p className="text-xs text-on-surface-variant line-clamp-1 mb-3">{v.description || v.visaType || 'No description added.'}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex gap-3">
                                  <span className="text-[10px] text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">schedule</span>{v.processing}</span>
                                  <span className="text-[10px] text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">payments</span>{v.fee}</span>
                                  {v.documents && v.documents.length > 0 && <span className="text-[10px] text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">description</span>{v.documents.length}</span>}
                                </div>
                                {canCRUD && <Link to={`/visas?edit=${v.id}`} className="text-[10px] font-black uppercase tracking-widest text-purple-500 hover:text-purple-400">Update →</Link>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Sync Active</span>
        </div>
        <p className="text-[10px] text-gray-400 font-medium">JourneyFlicker Core Engine v2.4.0 • Node.js Backend Cluster</p>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-4xl text-gray-200">folder_open</span>
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-1">Archive Empty</h3>
      <p className="text-xs text-gray-400 max-w-[200px]">No {label} have been synchronized with the core database yet.</p>
    </div>
  );
}
