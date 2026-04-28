import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Destination, Tour, Visa } from '../lib/api';
import { useAdminAuth } from '../lib/adminAuth';
import { CSVUploader } from '../components/CSVUploader';
import { Preloader } from '../components/Preloader';

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
    background: white; border-radius: 20px; padding: 24px; border: 1px solid #f0f0f0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .stat-card:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0,0,0,0.05); border-color: #e0e0e0; }
  
  .action-btn {
    display: flex; align-items: center; gap: 10px; padding: 12px 20px; border-radius: 14px;
    font-size: 13px; font-weight: 700; transition: all 0.2s; border: none; cursor: pointer;
    background: #f8f9fa; color: #1a1a1a;
  }
  .action-btn:hover { background: #1a1a1a; color: white; transform: scale(1.02); }
  
  .db-tab-btn {
    padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 600;
    transition: all 0.2s; display: flex; align-items: center; gap: 8px;
  }
  .db-tab-btn.active { background: #000; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  .db-tab-btn:not(.active) { color: #666; }
  .db-tab-btn:not(.active):hover { background: #f0f0f0; color: #000; }

  .content-card {
    background: white; border-radius: 24px; border: 1px solid #f0f0f0; overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
  }
  
  .grid-item {
    border-radius: 20px; border: 1px solid #f0f0f0; overflow: hidden;
    transition: all 0.3s; background: white;
  }
  .grid-item:hover { border-color: #ddd; box-shadow: 0 10px 25px rgba(0,0,0,0.06); transform: translateY(-3px); }
  
  .pill { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 100px; }
  .pill-blue { background: #eef2ff; color: #4f46e5; }
  .pill-green { background: #f0fdf4; color: #16a34a; }
  .pill-purple { background: #faf5ff; color: #9333ea; }
`;

export default function AdminDashboard() {
  const { role: _role, canEdit, canCRUD } = useAdminAuth();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [visas, setVisas] = useState<Visa[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'destinations' | 'tours' | 'visas'>('destinations');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 10000); // Sync every 10s
    return () => clearInterval(interval);
  }, []);

  const loadAll = () => {
    Promise.all([api.listDestinations(), api.listTours(), api.listVisas()])
      .then(([d, t, v]) => { 
        setDestinations(d); 
        setTours(t); 
        setVisas(v); 
        setLoading(false); 
      })
      .catch((err) => { 
        console.error(err); 
        setLoading(false); 
      });
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
          <div key={i} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-xl ${s.color}`}>{s.icon}</span>
              </div>
              {s.href && (
                <a href={s.href} className="text-[10px] font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest">Manage</a>
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-light font-serif italic text-gray-900">
                {loading ? '...' : s.value}
                {s.suffix && <span className="text-xs font-sans font-bold not-italic ml-1 text-gray-400 uppercase tracking-tighter">{s.suffix}</span>}
              </h3>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{s.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      {canCRUD && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Administrative Orchestration</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/destinations" className="action-btn">
              <span className="material-symbols-outlined">add_location</span>
              <span>New Destination</span>
            </a>
            <a href="/tours" className="action-btn">
              <span className="material-symbols-outlined">add_road</span>
              <span>Create Tour</span>
            </a>
            <a href="/visas" className="action-btn">
              <span className="material-symbols-outlined">description</span>
              <span>Visa Rules</span>
            </a>
            <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block" />
            {canEdit && (
              <>
                <a href="/hero" className="action-btn">
                  <span className="material-symbols-outlined text-amber-600">view_carousel</span> Hero Engine
                </a>
                <div className="h-10 w-[1px] bg-gray-100 mx-2 self-center hidden md:block"></div>
                <CSVUploader type="destination" onUploadComplete={loadAll} />
                <CSVUploader type="tour" onUploadComplete={loadAll} />
                <CSVUploader type="visa" onUploadComplete={loadAll} />
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Content Browser ── */}
      <div className="content-card">
        <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex p-1 bg-gray-100/80 rounded-14 w-fit">
            {[
              { id: 'destinations', label: 'Destinations', icon: 'location_on', count: destinations.length },
              { id: 'tours', label: 'Tours', icon: 'flight', count: tours.length },
              { id: 'visas', label: 'Visas', icon: 'passport', count: visas.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`db-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-white text-gray-400'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 p-1 bg-gray-100/80 rounded-14 w-fit">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-10 transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}>
              <span className="material-symbols-outlined text-sm block">grid_view</span>
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-10 transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}>
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
                  <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
                    {destinations.map(d => (
                      <div key={d.id} className={viewMode === 'grid' ? "grid-item" : "flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors"}>
                        <div className={viewMode === 'grid' ? "h-40 overflow-hidden relative" : "w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"}>
                          {d.heroImageUrl ? (
                            <img src={d.heroImageUrl} className="w-full h-full object-cover" alt={d.name} />
                          ) : (
                            <div className="w-full h-full bg-gray-50 flex items-center justify-center"><span className="material-symbols-outlined text-gray-300">image</span></div>
                          )}
                          {viewMode === 'grid' && (
                            <div className="absolute top-3 right-3"><span className="pill pill-blue backdrop-blur-md bg-white/80">{d.region}</span></div>
                          )}
                        </div>
                        <div className={viewMode === 'grid' ? "p-5" : "flex-1 min-w-0"}>
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-bold text-gray-900 truncate">{d.name}</h4>
                            {viewMode === 'list' && <span className="pill pill-blue">{d.region}</span>}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1 mb-3">{d.description || 'No description added.'}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              {d.landmarks && d.landmarks.length > 0 && <span className="text-[10px] text-gray-400 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">place</span>{d.landmarks.length}</span>}
                              {d.galleryImages && d.galleryImages.length > 0 && <span className="text-[10px] text-gray-400 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">photo</span>{d.galleryImages.length}</span>}
                            </div>
                            {canCRUD && <a href="/destinations" className="text-[10px] font-bold text-indigo-600 hover:underline">Configure →</a>}
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
                  <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
                    {tours.map(t => (
                      <div key={t.id} className={viewMode === 'grid' ? "grid-item" : "flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors"}>
                        <div className={viewMode === 'grid' ? "h-40 overflow-hidden relative" : "w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"}>
                          {t.heroImageUrl ? (
                            <img src={t.heroImageUrl} className="w-full h-full object-cover" alt={t.name} />
                          ) : (
                            <div className="w-full h-full bg-gray-50 flex items-center justify-center"><span className="material-symbols-outlined text-gray-300">flight</span></div>
                          )}
                          {viewMode === 'grid' && (
                            <div className="absolute top-3 left-3"><span className="pill pill-green backdrop-blur-md bg-white/80">{t.days} Days</span></div>
                          )}
                        </div>
                        <div className={viewMode === 'grid' ? "p-5" : "flex-1 min-w-0"}>
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-bold text-gray-900 truncate">{t.name}</h4>
                            {viewMode === 'list' && <span className="pill pill-green">{t.days} Days</span>}
                          </div>
                          <p className="text-xs text-gray-500 mb-3">{t.region} · <span className="font-bold text-gray-900">{t.price}</span></p>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-3">
                              {t.itinerary && t.itinerary.length > 0 && <span className="text-[10px] text-gray-400 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">route</span>{t.itinerary.length}</span>}
                              {t.transport && <span className="text-[10px] text-gray-400 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">commute</span></span>}
                            </div>
                            {canCRUD && <a href="/tours" className="text-[10px] font-bold text-emerald-600 hover:underline">Design →</a>}
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
                  <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
                    {visas.map(v => (
                      <div key={v.id} className={viewMode === 'grid' ? "grid-item" : "flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors"}>
                        <div className={viewMode === 'grid' ? "h-40 overflow-hidden relative" : "w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"}>
                          {v.heroImageUrl ? (
                            <img src={v.heroImageUrl} className="w-full h-full object-cover" alt={v.country} />
                          ) : (
                            <div className="w-full h-full bg-purple-50 flex items-center justify-center"><span className="material-symbols-outlined text-purple-300">passport</span></div>
                          )}
                          {viewMode === 'grid' && (
                            <div className="absolute top-3 left-3"><span className={`pill ${v.difficulty === 'Easy' ? 'pill-green' : v.difficulty === 'Moderate' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'} backdrop-blur-md bg-white/80`}>{v.difficulty}</span></div>
                          )}
                        </div>
                        <div className={viewMode === 'grid' ? "p-5" : "flex-1 min-w-0"}>
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-bold text-gray-900 truncate">{v.country}</h4>
                            {viewMode === 'list' && <span className={`pill ${v.difficulty === 'Easy' ? 'pill-green' : v.difficulty === 'Moderate' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>{v.difficulty}</span>}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1 mb-3">{v.description || v.visaType || 'No description added.'}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-3">
                              <span className="text-[10px] text-gray-400 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">schedule</span>{v.processing}</span>
                              <span className="text-[10px] text-gray-400 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">payments</span>{v.fee}</span>
                              {v.documents && v.documents.length > 0 && <span className="text-[10px] text-gray-400 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">description</span>{v.documents.length}</span>}
                            </div>
                            {canCRUD && <a href="/visas" className="text-[10px] font-bold text-purple-600 hover:underline">Update →</a>}
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
