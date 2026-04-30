import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { SEO } from '../components/SEO';
import type { Destination, Tour } from '../lib/api';
import { api } from '../lib/api';
import { HeroSlider, type HeroSlide } from '../components/HeroSlider';
import { useHeroSettings } from '../lib/heroSettings';
import { optimizeImage } from '../lib/optimize';
import {
  buildFilterOptions, applyFilter, getCountry, getState, getTerritory,
  EMPTY_FILTER, type FilterState,
} from '../lib/filterUtils';
import { Preloader } from '../components/Preloader';

type ViewMode = 'grid' | 'list';

const FALLBACK = "https://images.unsplash.com/photo-1541410965313-d53b3c16f907?q=80&w=2000&auto=format&fit=crop";

const TERRITORY_ICONS: Record<string, string> = {
  Asia: 'temple_buddhist', Europe: 'castle', Americas: 'forest',
  Africa: 'savanna', 'Middle East': 'mosque', Oceania: 'surfing', Other: 'public',
};

function FilterSelect({ label, value, options, onChange, disabled }: {
  label: string; value: string; options: string[];
  onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-0.5 min-w-0 ${disabled ? 'opacity-30 pointer-events-none' : ''}`}>
      <label className="text-[9px] font-black tracking-[0.4em] uppercase text-on-surface-variant/50 whitespace-nowrap">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="bg-transparent border-none p-0 pr-5 text-sm font-light focus:ring-0 cursor-pointer appearance-none text-on-surface w-full max-w-[160px] truncate"
        >
          <option value="">All {label}s</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40 text-base">expand_more</span>
      </div>
    </div>
  );
}

export default function DestinationsPage() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const heroIds = useHeroSettings('destinations');

  useEffect(() => {
    const fetchData = () => {
      Promise.all([api.listDestinations(), api.listTours()])
        .then(([d, t]) => { 
          setDestinations(d || []); 
          setTours(t || []);
          setLoading(false); 
        })
        .catch(() => setLoading(false));
    };

    fetchData(); // Initial fetch
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') fetchData();
    }, 3000); // Poll every 3 seconds only if tab is visible

    const onFocus = () => { if (document.visibilityState === 'visible') fetchData(); };
    window.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Build hero slides
  const heroSlides: HeroSlide[] = useMemo(() => {
    const pool = heroIds.length > 0
      ? heroIds.map(id => destinations.find(d => d.id === id)).filter(Boolean) as Destination[]
      : destinations.slice(0, 5);
    if (!pool.length && !loading) return [{ id: 'fb', imageUrl: FALLBACK, title: 'Selected Sanctuaries', subtitle: 'A curated index of evocative landscapes.', tag: 'Global Archives' }];
    return pool.map(d => ({ id: d.id, imageUrl: d.heroImageUrl || FALLBACK, title: d.name, subtitle: d.essenceText || d.description?.slice(0, 90), tag: d.region, href: `/destinations/${d.id}` }));
  }, [destinations, heroIds, loading]);

  // Cascading filter options
  const opts = useMemo(() => buildFilterOptions(destinations, filter), [destinations, filter]);

  // Filtered results
  const filtered = useMemo(() => applyFilter(destinations, filter), [destinations, filter]);
  const filteredTours = useMemo(() => applyFilter(tours, filter), [tours, filter]);

  function setLevel(key: keyof FilterState, value: string) {
    // Reset downstream levels when a parent changes
    setFilter(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'territory') { next.region = ''; next.country = ''; next.state = ''; }
      if (key === 'region')    { next.country = ''; next.state = ''; }
      if (key === 'country')   { next.state = ''; }
      return next;
    });
  }

  const hasFilter = Object.values(filter).some(Boolean);
  const activeCount = Object.values(filter).filter(Boolean).length;

  return (
    <>
      <SEO pageId="destinations" />
      {/* ── HERO SLIDER ── */}
      <HeroSlider slides={heroSlides} loading={loading} autoPlayMs={5000} height="h-[65vh] min-h-[480px] max-h-[700px]" />

      {/* ── FILTER + GRID ── */}
      <section className="py-10 sm:py-14 md:py-20 px-4 sm:px-8 md:px-16 bg-surface-container-lowest dark:bg-black">
        <div className="max-w-6xl mx-auto">

          {/* ── Section header ── */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 pb-5 border-b border-outline-variant/20">
            <div>
              <span className="text-[10px] font-black tracking-[0.5em] text-primary dark:text-white/60 uppercase mb-1.5 block">The Dossiers</span>
              <h1 className="text-4xl sm:text-5xl font-light tracking-tighter leading-tight italic dark:text-white">Territories</h1>
            </div>
            <div className="hidden sm:flex flex-col items-end opacity-20 dark:text-white">
              <span className="text-4xl font-light tracking-tighter leading-none">
                {loading ? '—' : String(filtered.length).padStart(2,'0')}
              </span>
              <span className="text-[10px] font-black tracking-widest uppercase">
                {hasFilter ? 'Filtered' : 'Total Mapped'}
              </span>
            </div>
          </div>

          {/* ── TERRITORY TABS (visual quick-select) ── */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5 no-scrollbar">
            <button
              onClick={() => setFilter(EMPTY_FILTER)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black tracking-[0.3em] uppercase whitespace-nowrap transition-all border ${
                !filter.territory ? 'bg-black text-white border-black shadow-md' : 'border-outline-variant/30 text-on-surface-variant hover:border-black/30'
              }`}>
              <span className="material-symbols-outlined text-sm font-light">public</span>
              All Territories
            </button>
            {opts.territories.map(t => (
              <button key={t}
                onClick={() => setLevel('territory', filter.territory === t ? '' : t)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black tracking-[0.3em] uppercase whitespace-nowrap transition-all border ${
                  filter.territory === t ? 'bg-black text-white border-black shadow-md' : 'border-outline-variant/30 text-on-surface-variant hover:border-black/30'
                }`}>
                <span className="material-symbols-outlined text-sm font-light">{TERRITORY_ICONS[t] || 'explore'}</span>
                {t}
              </button>
            ))}
          </div>

          {/* ── CASCADING DROPDOWNS ── */}
          <div className="sticky top-14 md:top-[58px] z-30 bg-white/95 dark:bg-black/80 backdrop-blur-md rounded-2xl border border-outline-variant/15 dark:border-white/10 shadow-sm px-5 py-4 mb-7 flex flex-wrap items-center gap-6 md:gap-8">
            {/* Breadcrumb trail */}
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.4em] text-on-surface-variant/30 flex-nowrap overflow-x-auto no-scrollbar">
              <span className={filter.territory ? 'text-black' : ''}>
                {filter.territory || 'All Territories'}
              </span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className={filter.region ? 'text-black' : ''}>
                {filter.region || 'All Regions'}
              </span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className={filter.country ? 'text-black' : ''}>
                {filter.country || 'All Countries'}
              </span>
              {opts.states.length > 0 && (
                <>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                  <span className={filter.state ? 'text-black' : ''}>{filter.state || 'All States'}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-5 flex-wrap ml-auto">
              <div className="flex items-center gap-1 h-px w-px" />
              <FilterSelect label="Region" value={filter.region} options={opts.regions}
                onChange={v => setLevel('region', v)} disabled={opts.regions.length === 0} />
              <div className="h-7 w-px bg-outline-variant/20" />
              <FilterSelect label="Country" value={filter.country} options={opts.countries}
                onChange={v => setLevel('country', v)} disabled={opts.countries.length <= 1} />
              {opts.states.length > 1 && (
                <>
                  <div className="h-7 w-px bg-outline-variant/20" />
                  <FilterSelect label="State / Area" value={filter.state} options={opts.states}
                    onChange={v => setLevel('state', v)} />
                </>
              )}

              {hasFilter && (
                <button onClick={() => setFilter(EMPTY_FILTER)}
                  className="flex items-center gap-1 text-[9px] font-black tracking-[0.3em] uppercase text-red-500 hover:text-red-700 transition-colors ml-2 whitespace-nowrap">
                  <span className="material-symbols-outlined text-sm">close</span>
                  Clear {activeCount > 1 ? `(${activeCount})` : ''}
                </button>
              )}

              {/* View toggle */}
              <div className="flex items-center border border-outline-variant/30 dark:border-white/10 rounded-full p-1 gap-1 bg-surface dark:bg-white/5 shadow-sm ml-2">
                {(['grid', 'list'] as ViewMode[]).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${
                      viewMode === mode ? 'bg-on-surface dark:bg-white text-surface dark:text-black shadow-md' : 'text-on-surface-variant/50 hover:text-black dark:hover:text-white'
                    }`}>
                    <span className="material-symbols-outlined font-light text-base">
                      {mode === 'grid' ? 'grid_view' : 'view_agenda'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── RESULTS ── */}
          {loading ? (
            <Preloader />
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center bg-surface-container-low/50 rounded-2xl border border-outline-variant/10">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-4 block font-light">search_off</span>
              <h3 className="text-2xl font-light tracking-tighter mb-2 italic">No territories found</h3>
              <p className="text-sm text-on-surface-variant opacity-60 mb-5">No destinations match the selected filter combination.</p>
              <button onClick={() => setFilter(EMPTY_FILTER)}
                className="text-[10px] font-black tracking-[0.4em] uppercase border-b border-black pb-1.5 hover:text-primary transition-all">
                Clear all filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((dest, i) => {
                const country = getCountry(dest.name, dest.region);
                const state   = getState(dest.name, dest.region);
                const terr    = getTerritory(dest.region);
                return (
                  <div key={dest.id}
                    className="group cursor-pointer animate-reveal-up relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 h-[360px] sm:h-[400px]"
                    style={{ animationDelay: `${(i%3)*0.06}s` }}
                    onClick={() => navigate(`/destinations/${dest.id}`)}>
                    <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-[4s] ease-out group-hover:scale-105 grayscale group-hover:grayscale-0"
                      alt={dest.name} src={optimizeImage(dest.heroImageUrl || FALLBACK, 800)} loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    {/* Territory badge */}
                    <div className="absolute top-3 left-3 bg-black/50 backdrop-blur border border-white/20 px-3 py-1 rounded-full">
                      <span className="text-[8px] font-black tracking-[0.4em] text-white/70 uppercase">{terr}</span>
                    </div>
                    {/* Arrow */}
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full border border-white/20 flex items-center justify-center backdrop-blur bg-white/10 text-white opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <span className="material-symbols-outlined font-light text-base">arrow_outward</span>
                    </div>
                    {/* Bottom info */}
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <span className="text-[8px] font-black tracking-[0.4em] uppercase text-white/40">{dest.region}</span>
                        {country !== dest.region && (
                          <><span className="material-symbols-outlined text-white/20 text-xs">chevron_right</span>
                          <span className="text-[8px] font-black tracking-[0.4em] uppercase text-white/50">{country}</span></>
                        )}
                        {state && state !== dest.name && (
                          <><span className="material-symbols-outlined text-white/20 text-xs">chevron_right</span>
                          <span className="text-[8px] font-black tracking-[0.4em] uppercase text-white/60">{state}</span></>
                        )}
                      </div>
                      <h3 className="text-2xl font-light text-white tracking-tighter leading-tight font-serif italic">{dest.name}</h3>
                      {dest.essenceText && (
                        <p className="text-xs font-light text-white/40 mt-1 leading-relaxed truncate">{dest.essenceText}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // ── LIST VIEW ──
            <div className="flex flex-col divide-y divide-outline-variant/15">
              {filtered.map((dest, i) => {
                const country = getCountry(dest.name, dest.region);
                const state   = getState(dest.name, dest.region);
                const terr    = getTerritory(dest.region);
                return (
                  <article key={dest.id}
                    className="group cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 hover:bg-surface-container-low/60 transition-colors duration-200 rounded-xl px-3 -mx-3 animate-reveal-up"
                    style={{ animationDelay: `${(i%6)*0.04}s` }}
                    onClick={() => navigate(`/destinations/${dest.id}`)}>
                    {/* Thumbnail */}
                    <div className="shrink-0 w-full sm:w-24 aspect-[4/3] sm:aspect-square overflow-hidden rounded-xl bg-surface-container-low relative shadow-sm">
                      <img className="w-full h-full object-cover transition-transform duration-[3s] ease-out group-hover:scale-105 grayscale group-hover:grayscale-0"
                        alt={dest.name} src={optimizeImage(dest.heroImageUrl || FALLBACK, 400)} loading="lazy" />
                      <div className="absolute inset-0 flex items-end p-1.5">
                        <span className="text-[8px] font-black bg-black/60 text-white/80 px-2 py-0.5 rounded-full tracking-widest">{terr}</span>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Breadcrumb */}
                      <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                        <span className="text-[8px] font-black tracking-widest uppercase text-on-surface-variant/40">{dest.region}</span>
                        {country !== dest.region && (
                          <><span className="material-symbols-outlined text-on-surface-variant/20 text-xs">chevron_right</span>
                          <span className="text-[8px] font-black tracking-widest uppercase text-on-surface-variant/40">{country}</span></>
                        )}
                        {state && state !== dest.name && (
                          <><span className="material-symbols-outlined text-on-surface-variant/20 text-xs">chevron_right</span>
                          <span className="text-[8px] font-black tracking-widest uppercase text-on-surface-variant/40">{state}</span></>
                        )}
                      </div>
                      <h3 className="text-lg md:text-xl font-light tracking-tighter italic group-hover:text-primary transition-colors duration-300 truncate">{dest.name}</h3>
                      {dest.essenceText && (
                        <p className="text-xs font-light text-on-surface-variant leading-relaxed opacity-60 mt-0.5 line-clamp-1">{dest.essenceText}</p>
                      )}
                      {dest.description && (
                        <p className="text-xs font-light text-on-surface-variant opacity-50 mt-0.5 line-clamp-1 hidden sm:block">{dest.description}</p>
                      )}
                    </div>
                    {/* CTA */}
                    <div className="flex items-center gap-3 shrink-0">
                      {dest.landmarks && dest.landmarks.length > 0 && (
                        <span className="hidden md:block text-[8px] font-black tracking-widest uppercase text-on-surface-variant/30">
                          {dest.landmarks.length} landmark{dest.landmarks.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-full text-[9px] font-black tracking-[0.3em] uppercase group-hover:bg-primary transition-colors duration-200 whitespace-nowrap">
                        View <span className="material-symbols-outlined font-light text-sm">arrow_forward</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* ── MATCHING EXPEDITIONS (TOURS) ── */}
          {hasFilter && filteredTours.length > 0 && (
            <div className="mt-16 sm:mt-24 pt-10 border-t border-outline-variant/15 animate-reveal-up">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
                <div>
                  <span className="text-[10px] font-black tracking-[0.5em] text-primary uppercase mb-1.5 block">Recommended Access</span>
                  <h2 className="text-3xl sm:text-4xl font-light tracking-tighter leading-tight italic">Matching <span className="not-italic font-black text-black">Expeditions.</span></h2>
                  <p className="text-xs font-light text-on-surface-variant opacity-50 mt-1">Found {filteredTours.length} curated journeys in the selected territory.</p>
                </div>
                <button onClick={() => navigate('/tours')} 
                  className="text-[10px] font-black tracking-[0.4em] uppercase border-b border-black pb-1 hover:text-primary transition-all">
                  View All Tours
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredTours.slice(0, 8).map((tour, idx) => (
                  <div 
                    key={tour.id}
                    onClick={() => navigate(`/tours/${tour.id}`)}
                    className="group cursor-pointer bg-white rounded-xl overflow-hidden border border-outline-variant/10 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img src={tour.heroImageUrl || FALLBACK} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-[4s]" alt={tour.name} />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2.5 py-1 rounded-full">
                        <span className="text-[8px] font-black tracking-widest text-white uppercase">{tour.days} Days</span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <span className="text-[8px] font-black tracking-[0.3em] uppercase text-on-surface-variant/40 mb-1">{tour.category}</span>
                      <h4 className="text-sm font-semibold tracking-tight italic group-hover:text-primary transition-colors line-clamp-1 mb-2">{tour.name}</h4>
                      <div className="mt-auto flex items-center justify-between pt-3 border-t border-outline-variant/5">
                        <span className="text-xs font-serif italic text-on-surface-variant/60">{tour.price}</span>
                        <span className="material-symbols-outlined text-sm font-light transform group-hover:translate-x-1 transition-transform">east</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result count footer */}
          {!loading && filtered.length > 0 && (
            <p className="text-center mt-12 text-[9px] font-black tracking-[0.5em] uppercase text-on-surface-variant/30">
              Showing {filtered.length} of {destinations.length} territories
              {hasFilter && ` · ${activeCount} filter${activeCount > 1 ? 's' : ''} active`}
            </p>
          )}
        </div>
      </section>

      {/* ── TACTICAL SYSTEMS ── */}
      <section className="py-14 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-black text-white border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10 lg:gap-20 items-center">
          <div className="w-full lg:w-1/2 animate-reveal-up">
            <span className="text-primary text-[10px] font-black tracking-[0.6em] uppercase mb-3 block">The Curation Standard</span>
            <h2 className="text-4xl sm:text-5xl font-light leading-tight mb-7 tracking-tighter">
              Tactical<br/><span className="italic font-serif text-white/90">Systems.</span>
            </h2>
            <div className="space-y-6">
              {[
                { title: 'Seasonal Awareness', body: 'Monitoring ephemeral intervals where the architecture of light is most dramatic.' },
                { title: 'Verification Protocol', body: 'A strict 4-week window for auditing private access points across all territories.' },
              ].map(item => (
                <div key={item.title} className="group border-l-2 border-primary/20 pl-5 hover:border-primary transition-all duration-300">
                  <h4 className="text-[10px] font-black tracking-[0.5em] uppercase mb-2 text-white/50 group-hover:text-white transition-all">{item.title}</h4>
                  <p className="text-sm font-light leading-relaxed text-white/40 group-hover:text-white/80 transition-all italic">{item.body}</p>
                </div>
              ))}
            </div>
            <button className="mt-8 bg-white text-black px-7 py-3 text-[10px] font-black tracking-[0.5em] uppercase rounded-full hover:bg-primary hover:text-white transition-all shadow-lg"
              onClick={() => navigate('/contact')}>Request Audit</button>
          </div>
          <div className="w-full lg:w-1/2 animate-reveal-up" style={{ animationDelay: '0.15s' }}>
            <div className="rounded-2xl overflow-hidden aspect-[4/5] relative bg-white/5 border border-white/10 group">
              <img className="absolute inset-0 w-full h-full object-cover transition-all duration-[5s] grayscale group-hover:grayscale-0 group-hover:scale-105"
                alt="Travel Intelligence" src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
