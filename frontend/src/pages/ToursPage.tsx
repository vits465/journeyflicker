import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { SEO } from "../components/SEO";
import type { Tour } from "../lib/api";
import { api } from "../lib/api";
import { HeroSlider, type HeroSlide } from "../components/HeroSlider";
import { useHeroSettings } from "../lib/heroSettings";
import { optimizeImage } from "../lib/optimize";
import {
  buildFilterOptions, applyFilter, getCountry, getState, getTerritory,
  EMPTY_FILTER, type FilterState,
} from "../lib/filterUtils";
import { Preloader } from '../components/Preloader';

type ViewMode = "grid" | "list";

const FALLBACK = "https://images.unsplash.com/photo-1544016768-982d1554f0b9?q=80&w=1974&auto=format&fit=crop";

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
        <select value={value} onChange={e => onChange(e.target.value)}
          className="bg-transparent border-none p-0 pr-5 text-sm font-light focus:ring-0 cursor-pointer appearance-none text-on-surface w-full max-w-[150px] truncate">
          <option value="">All {label}s</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40 text-base">expand_more</span>
      </div>
    </div>
  );
}

export default function ToursPage() {
  const navigate = useNavigate();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [maxDays, setMaxDays] = useState('');
  const heroIds = useHeroSettings('tours');

  useEffect(() => {
    const fetchTours = () => {
      api.listTours()
        .then(data => { setTours(data || []); setLoading(false); })
        .catch(() => setLoading(false));
    };

    fetchTours(); // Initial fetch
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') fetchTours();
    }, 3000); // Poll every 3 seconds only if tab is visible

    const onFocus = () => { if (document.visibilityState === 'visible') fetchTours(); };
    window.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Hero slides
  const heroSlides: HeroSlide[] = useMemo(() => {
    const pool = heroIds.length > 0
      ? heroIds.map(id => tours.find(t => t.id === id)).filter(Boolean) as Tour[]
      : tours.slice(0, 5);
    if (!pool.length && !loading) return [{ id: 'fb', imageUrl: FALLBACK, title: 'Curated Expeditions.', subtitle: 'Cinematic journeys balanced for visual depth and cultural resonance.', tag: 'Collections' }];
    return pool.map(t => ({ id: t.id, imageUrl: t.heroImageUrl || FALLBACK, title: t.name, subtitle: t.overviewDescription?.slice(0, 90), tag: `${t.days} Days · ${t.category}`, href: `/tours/${t.id}` }));
  }, [tours, heroIds, loading]);

  // Cascading filter options from region+name
  const opts = useMemo(() => buildFilterOptions(tours, filter), [tours, filter]);

  // All categories
  const allCategories = useMemo(() => Array.from(new Set(tours.map(t => t.category))).filter(Boolean).sort(), [tours]);

  // Filtered tours
  const filtered = useMemo(() => {
    let result = applyFilter(tours, filter);
    if (categoryFilter) result = result.filter(t => t.category === categoryFilter);
    if (maxDays) result = result.filter(t => t.days <= Number(maxDays));
    return result;
  }, [tours, filter, categoryFilter, maxDays]);

  function setLevel(key: keyof FilterState, value: string) {
    setFilter(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'territory') { next.region = ''; next.country = ''; next.state = ''; }
      if (key === 'region')    { next.country = ''; next.state = ''; }
      if (key === 'country')   { next.state = ''; }
      return next;
    });
  }

  function clearAll() {
    setFilter(EMPTY_FILTER);
    setCategoryFilter('');
    setMaxDays('');
  }

  const hasFilter = Object.values(filter).some(Boolean) || categoryFilter || maxDays;
  const activeCount = Object.values(filter).filter(Boolean).length + (categoryFilter ? 1 : 0) + (maxDays ? 1 : 0);

  return (
    <main className="flex flex-col min-h-screen">
      <SEO pageId="tours" />

      {/* ── HERO SLIDER ── */}
      <HeroSlider slides={heroSlides} loading={loading} autoPlayMs={5200} height="h-[60vh] min-h-[460px] max-h-[680px]" />

      <div className="px-4 sm:px-8 md:px-16 max-w-6xl mx-auto w-full pb-14">

        {/* ── PAGE HEADER ── */}
        <header className="pt-10 mb-6 animate-reveal-up">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 border-b border-outline-variant/20 pb-6">
            <div>
              <span className="text-[9px] font-black tracking-[0.6em] uppercase text-on-surface-variant/50 mb-1.5 block">Collections</span>
              <h1 className="text-4xl sm:text-5xl font-light tracking-tighter leading-tight mb-1 italic">
                Curated <span className="not-italic font-black text-on-surface dark:text-white">Expeditions.</span>
              </h1>
              <p className="text-sm font-light text-on-surface-variant opacity-70 max-w-xl leading-relaxed">
                A rigorous selection of cinematic journeys across the globe.
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-end opacity-20 shrink-0">
              <span className="text-4xl font-light tracking-tighter italic">
                {loading ? '—' : String(filtered.length).padStart(2,'0')}
              </span>
              <span className="text-[9px] font-black tracking-[0.5em] uppercase">
                {hasFilter ? 'Filtered' : 'Entries'}
              </span>
            </div>
          </div>
        </header>

        {/* ── TERRITORY PILLS ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 no-scrollbar">
          <button onClick={clearAll}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black tracking-[0.3em] uppercase whitespace-nowrap transition-all border ${
              !filter.territory ? 'bg-black text-white border-black shadow-md' : 'border-outline-variant/30 text-on-surface-variant hover:border-black/30'
            }`}>
            <span className="material-symbols-outlined text-sm font-light">public</span> All
          </button>
          {opts.territories.map(t => (
            <button key={t} onClick={() => setLevel('territory', filter.territory === t ? '' : t)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black tracking-[0.3em] uppercase whitespace-nowrap transition-all border ${
                filter.territory === t ? 'bg-black text-white border-black shadow-md' : 'border-outline-variant/30 text-on-surface-variant hover:border-black/30'
              }`}>
              <span className="material-symbols-outlined text-sm font-light">{TERRITORY_ICONS[t] || 'explore'}</span>
              {t}
            </button>
          ))}
        </div>

        {/* ── STICKY FILTER BAR ── */}
        <section className="sticky top-14 md:top-[58px] bg-white/95 dark:bg-black/80 backdrop-blur-md z-40 rounded-2xl border border-outline-variant/15 dark:border-white/10 shadow-sm px-4 py-3 mb-7">
          <div className="flex flex-wrap items-center gap-4 md:gap-6">

            {/* Location breadcrumb */}
            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.3em] text-on-surface-variant/30 overflow-x-auto no-scrollbar">
              <span className={filter.territory ? 'text-black' : ''}>{filter.territory || 'Territory'}</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className={filter.region ? 'text-black' : ''}>{filter.region || 'Region'}</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className={filter.country ? 'text-black' : ''}>{filter.country || 'Country'}</span>
              {opts.states.length > 1 && (
                <>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span className={filter.state ? 'text-black' : ''}>{filter.state || 'State'}</span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-5 ml-auto">
              {/* Region */}
              <FilterSelect label="Region" value={filter.region} options={opts.regions}
                onChange={v => setLevel('region', v)} disabled={opts.regions.length === 0} />
              <div className="h-6 w-px bg-outline-variant/20" />
              {/* Country */}
              <FilterSelect label="Country" value={filter.country} options={opts.countries}
                onChange={v => setLevel('country', v)} disabled={opts.countries.length <= 1} />
              {opts.states.length > 1 && (
                <>
                  <div className="h-6 w-px bg-outline-variant/20" />
                  <FilterSelect label="State/Area" value={filter.state} options={opts.states}
                    onChange={v => setLevel('state', v)} />
                </>
              )}
              <div className="h-6 w-px bg-outline-variant/20" />
              {/* Category */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-black tracking-[0.4em] uppercase text-on-surface-variant/50">Category</label>
                <div className="relative">
                  <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                    className="bg-transparent border-none p-0 pr-5 text-sm font-light focus:ring-0 cursor-pointer appearance-none text-on-surface max-w-[140px]">
                    <option value="">All Types</option>
                    {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40 text-base">expand_more</span>
                </div>
              </div>
              <div className="h-6 w-px bg-outline-variant/20" />
              {/* Max Duration */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-black tracking-[0.4em] uppercase text-on-surface-variant/50">Max Days</label>
                <div className="relative">
                  <select value={maxDays} onChange={e => setMaxDays(e.target.value)}
                    className="bg-transparent border-none p-0 pr-5 text-sm font-light focus:ring-0 cursor-pointer appearance-none text-on-surface max-w-[110px]">
                    <option value="">Any Length</option>
                    <option value="5">Up to 5 days</option>
                    <option value="8">Up to 8 days</option>
                    <option value="10">Up to 10 days</option>
                    <option value="14">Up to 14 days</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40 text-base">expand_more</span>
                </div>
              </div>

              {/* Clear */}
              {hasFilter && (
                <button onClick={clearAll}
                  className="flex items-center gap-1 text-[9px] font-black tracking-[0.3em] uppercase text-red-500 hover:text-red-700 transition-colors whitespace-nowrap">
                  <span className="material-symbols-outlined text-sm">close</span>
                  Clear{activeCount > 1 ? ` (${activeCount})` : ''}
                </button>
              )}

              {/* View toggle */}
              <div className="flex items-center border border-outline-variant/30 dark:border-white/10 rounded-full p-1 gap-1 bg-surface dark:bg-white/5 shadow-sm">
                {(['grid', 'list'] as ViewMode[]).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${viewMode === mode ? 'bg-on-surface dark:bg-white text-surface dark:text-black' : 'text-on-surface-variant/50 hover:text-black dark:hover:text-white'}`}>
                    <span className="material-symbols-outlined font-light text-base">{mode === 'grid' ? 'grid_view' : 'view_agenda'}</span>
                  </button>
                ))}
              </div>

              <span className="hidden lg:block text-[9px] font-black tracking-[0.3em] uppercase text-on-surface-variant/40 whitespace-nowrap">
                {loading ? '…' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        </section>

        {/* ── TOUR CONTENT ── */}
        {loading ? (
          <Preloader />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-low rounded-2xl border border-outline-variant/10">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-4 block font-light">search_off</span>
            <h3 className="text-2xl font-light mb-2 tracking-tighter italic">No expeditions found</h3>
            <p className="text-on-surface-variant font-light max-w-sm mx-auto text-sm opacity-70 mb-5">No tours match the selected filters.</p>
            <button onClick={clearAll} className="text-[10px] font-black tracking-[0.4em] uppercase border-b border-black pb-1.5 hover:text-primary transition-all">
              Clear all filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-9">
            {filtered.map((tour, idx) => {
              const terr = getTerritory(tour.region);
              const country = getCountry(tour.name, tour.region);
              return (
                <article key={tour.id}
                  className="group cursor-pointer animate-reveal-up"
                  style={{ animationDelay: `${(idx%6)*0.05}s` }}
                  onClick={() => navigate(`/tours/${tour.id}`)}>
                  <div className="overflow-hidden mb-3.5 aspect-[4/5] bg-surface-container-low rounded-2xl relative shadow-sm group-hover:shadow-xl transition-all duration-500">
                    <img className="w-full h-full object-cover transition-transform duration-[4s] ease-out group-hover:scale-105 mix-blend-luminosity group-hover:mix-blend-normal"
                      alt={tour.name} src={optimizeImage(tour.heroImageUrl || FALLBACK, 800)} loading="lazy" />
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow border border-black/5">
                        <span className="text-[9px] font-black tracking-[0.3em] text-black uppercase">{tour.days} Days</span>
                      </div>
                      <div className="bg-black/60 backdrop-blur px-3 py-1 rounded-full">
                        <span className="text-[8px] font-black tracking-[0.3em] text-white/80 uppercase">{terr}</span>
                      </div>
                    </div>
                    {/* Price hover */}
                    <div className="absolute inset-x-3 bottom-3 bg-black/70 backdrop-blur px-4 py-2.5 rounded-xl opacity-0 group-hover:opacity-100 translate-y-1.5 group-hover:translate-y-0 transition-all duration-300 flex justify-between items-center">
                      <span className="text-[9px] font-black tracking-widest uppercase text-white/60">From</span>
                      <span className="text-base font-light font-serif italic text-white">{tour.price}</span>
                    </div>
                  </div>
                  <div className="px-0.5">
                    {/* Location breadcrumb */}
                    <div className="flex items-center gap-1 mb-1 flex-wrap">
                      <span className="text-[8px] font-black tracking-[0.3em] uppercase text-primary/60">{tour.region}</span>
                      {country !== tour.region && (
                        <>
                          <span className="material-symbols-outlined text-on-surface-variant/30 text-xs">chevron_right</span>
                          <span className="text-[8px] font-black tracking-[0.3em] uppercase text-on-surface-variant/50">{country}</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-lg font-light tracking-tight mb-1 leading-tight group-hover:text-primary transition-colors duration-200">{tour.name}</h3>
                    <span className="text-[9px] font-black tracking-[0.3em] uppercase text-on-surface-variant/40 mb-2 block">{tour.category}</span>
                    <button className="inline-flex items-center gap-1.5 text-[9px] font-black tracking-[0.3em] uppercase border-b border-on-surface/20 dark:border-white/20 pb-0.5 hover:border-primary dark:hover:border-white transition-all duration-200 dark:text-white/60">
                      View Dossier <span className="material-symbols-outlined font-light text-sm">arrow_forward</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          // ── LIST VIEW ──
          <div className="flex flex-col divide-y divide-outline-variant/15">
            {filtered.map((tour, idx) => {
              const terr = getTerritory(tour.region);
              const country = getCountry(tour.name, tour.region);
              return (
                <article key={tour.id}
                  className="group cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 hover:bg-surface-container-low/60 transition-colors duration-200 rounded-xl px-3 -mx-3"
                  onClick={() => navigate(`/tours/${tour.id}`)}>
                  <div className="shrink-0 w-full sm:w-20 md:w-24 aspect-[4/3] sm:aspect-square overflow-hidden rounded-xl bg-surface-container-low relative shadow-sm">
                    <img className="w-full h-full object-cover transition-transform duration-[3s] ease-out group-hover:scale-105"
                      alt={tour.name} src={tour.heroImageUrl || FALLBACK} />
                    <div className="absolute inset-0 flex items-end p-1.5">
                      <span className="text-[8px] font-black bg-black/60 text-white/80 px-2 py-0.5 rounded-full tracking-widest">{terr}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                    <div className="flex-1 min-w-0">
                      {/* Breadcrumb */}
                      <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                        <span className="text-[8px] font-black tracking-widest uppercase text-on-surface-variant/40">{tour.region}</span>
                        {country !== tour.region && (
                          <>
                            <span className="material-symbols-outlined text-on-surface-variant/20 text-xs">chevron_right</span>
                            <span className="text-[8px] font-black tracking-widest uppercase text-on-surface-variant/40">{country}</span>
                          </>
                        )}
                        <span className="text-on-surface-variant/20 text-xs">·</span>
                        <span className="text-[8px] font-black tracking-widest uppercase text-on-surface-variant/40">{tour.category}</span>
                      </div>
                      <h3 className="text-lg md:text-xl font-light tracking-tighter group-hover:text-primary transition-colors duration-300 truncate">{tour.name}</h3>
                      <p className="text-xs font-light text-on-surface-variant leading-relaxed opacity-60 mt-0.5 line-clamp-1">{tour.overviewDescription}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-lg font-light tracking-tighter font-serif italic">{tour.price}</span>
                        <span className="text-[8px] font-black tracking-widest uppercase text-on-surface-variant/40">{tour.days} days</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-full text-[9px] font-black tracking-[0.3em] uppercase group-hover:bg-primary transition-colors duration-200 whitespace-nowrap">
                        View <span className="material-symbols-outlined font-light text-sm">arrow_forward</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Result count footer */}
        {!loading && filtered.length > 0 && (
          <p className="text-center mt-6 text-[9px] font-black tracking-[0.5em] uppercase text-on-surface-variant/30">
            Showing {filtered.length} of {tours.length} expeditions
            {hasFilter && ` · ${activeCount} filter${activeCount > 1 ? 's' : ''} active`}
          </p>
        )}

        {/* ── BESPOKE STRIP ── */}
        <section className="mt-14 bg-black text-white rounded-2xl px-7 py-9 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="max-w-sm">
            <span className="text-[9px] font-black tracking-[0.6em] uppercase text-white/30 block mb-2">Private Inception Bureau</span>
            <h2 className="text-2xl font-light tracking-tighter leading-tight">
              Tailored <span className="font-serif italic text-white/80">curations.</span>
            </h2>
            <p className="text-sm font-light text-white/40 mt-1.5 leading-relaxed">Senior-level strategy for private departures across our global sanctuary network.</p>
          </div>
          <button className="shrink-0 border-2 border-white text-white px-6 py-2.5 text-[9px] font-black tracking-[0.5em] uppercase rounded-full hover:bg-white hover:text-black transition-all duration-300 whitespace-nowrap"
            onClick={() => navigate('/contact')}>
            Request Strategic Audit
          </button>
        </section>
      </div>
    </main>
  );
}
