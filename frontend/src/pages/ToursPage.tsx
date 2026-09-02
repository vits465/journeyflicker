import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "../components/SEO";
import type { Tour } from "../lib/api";
import { api } from "../lib/api";
import { HeroSlider, type HeroSlide } from "../components/HeroSlider";
import { useHeroSettings } from "../lib/heroSettings";
import { optimizeImage } from "../lib/optimize";
import {
  REGIONS_DIRECTORY,
  filterTours,
  getRegionTourCounts,
  getDestinationTourCount,
  type TourFilterState,
  INITIAL_TOUR_FILTER
} from "../lib/filterUtils";
import { Skeleton } from '../components/Skeleton';
import { LazyImage } from '../components/LazyImage';

type ViewMode = "grid" | "list";

const FALLBACK = "https://images.unsplash.com/photo-1544016768-982d1554f0b9?q=80&w=1974&auto=format&fit=crop";

export default function ToursPage() {
  const navigate = useNavigate();
  const { data: tours = [], isLoading: loading } = useQuery({
    queryKey: ['tours'],
    queryFn: async (): Promise<Tour[]> => {
      const data = await api.listTours();
      return (Array.isArray(data) ? data : data?.items) || [];
    }
  });

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filter, setFilter] = useState<TourFilterState>(INITIAL_TOUR_FILTER);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(9);
  const heroIds = useHeroSettings('tours');

  // Hero slides
  const heroSlides: HeroSlide[] = useMemo(() => {
    const pool = heroIds.length > 0
      ? heroIds.map(id => tours.find(t => t.id === id)).filter(Boolean) as Tour[]
      : tours.slice(0, 5);
    if (!pool.length && !loading) return [{ id: 'fb', imageUrl: FALLBACK, title: 'Curated Expeditions.', subtitle: 'Cinematic journeys balanced for visual depth and cultural resonance.', tag: 'Collections' }];
    return pool.map(t => ({ id: t.id, imageUrl: t.heroImageUrl || FALLBACK, title: t.name, subtitle: t.overviewDescription?.slice(0, 90), tag: `${t.days} Days · ${t.category}`, href: `/tours/${t.id}` }));
  }, [tours, heroIds, loading]);

  // All categories from current tours
  const allCategories = useMemo(() => Array.from(new Set(tours.map(t => t.category))).filter(Boolean).sort(), [tours]);

  // Filtered tours with robust matching
  const filtered = useMemo(() => filterTours(tours, filter), [tours, filter]);

  // Tour counts by Region
  const regionCounts = useMemo(() => getRegionTourCounts(tours), [tours]);

  // Active region object if any selected
  const activeRegionObj = useMemo(() => {
    if (!filter.region) return null;
    return REGIONS_DIRECTORY.find(r => r.name.toLowerCase() === filter.region.toLowerCase());
  }, [filter.region]);

  function handleSelectRegion(regionName: string) {
    setFilter(prev => {
      if (prev.region === regionName) {
        // Toggle off if already selected
        return { ...prev, region: '', country: '' };
      }
      return { ...prev, region: regionName, country: '' };
    });
    setVisibleCount(9);
  }

  function handleSelectCountry(countryName: string, regionName?: string) {
    setFilter(prev => {
      if (prev.country === countryName) {
        return { ...prev, country: '' };
      }
      return {
        ...prev,
        country: countryName,
        region: regionName || prev.region
      };
    });
    setVisibleCount(9);
  }

  function clearAll() {
    setFilter(INITIAL_TOUR_FILTER);
    setVisibleCount(9);
  }

  const hasFilter = Boolean(filter.region || filter.country || filter.search || filter.category || filter.maxDays);
  const activeFilterCount = [filter.region, filter.country, filter.search, filter.category, filter.maxDays].filter(Boolean).length;

  const toursSchema = useMemo(() => {
    if (!tours || tours.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "@id": "https://journeyflicker.com/tours/#breadcrumb",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://journeyflicker.com" },
            { "@type": "ListItem", "position": 2, "name": "Expeditions", "item": "https://journeyflicker.com/tours" }
          ]
        },
        {
          "@type": "ItemList",
          "@id": "https://journeyflicker.com/tours/#itemlist",
          "name": "Luxury Expeditions Portfolio | JourneyFlicker",
          "description": "Browse our rigorous selection of curated luxury expeditions and heritage tours.",
          "url": "https://journeyflicker.com/tours",
          "numberOfItems": tours.length,
          "itemListElement": tours.map((t, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "url": `https://journeyflicker.com/tours/${t.id}`,
            "name": t.name,
            "description": t.overviewDescription
          }))
        }
      ]
    };
  }, [tours]);

  return (
    <main className="flex flex-col min-h-screen">
      <SEO pageId="tours" schema={toursSchema} />

      {/* ── HERO SLIDER ── */}
      <HeroSlider slides={heroSlides} loading={loading} autoPlayMs={5200} height="h-[60vh] min-h-[460px] max-h-[680px]" />

      <div className="px-4 sm:px-8 md:px-16 max-w-7xl mx-auto w-full pb-16">

        {/* ── PAGE HEADER ── */}
        <header className="pt-10 mb-6 animate-reveal-up">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 border-b border-outline-variant/20 pb-6">
            <div>
              <span className="text-[9px] font-black tracking-[0.6em] uppercase text-primary mb-1.5 block">Global Catalogue</span>
              <h1 className="text-4xl sm:text-5xl font-light tracking-tighter leading-tight mb-1 italic">
                Curated <span className="not-italic font-black text-on-surface dark:text-white">Expeditions.</span>
              </h1>
              <p className="text-sm font-light text-on-surface-variant opacity-70 max-w-xl leading-relaxed">
                Filter by global region, country, or destination across our certified expedition portfolio.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDirectoryOpen(prev => !prev)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-black tracking-[0.3em] uppercase transition-all border shadow-sm ${
                  isDirectoryOpen
                    ? 'bg-primary text-white border-primary shadow-lg ring-2 ring-primary/30'
                    : 'bg-surface-container hover:bg-surface-container-high border-outline-variant/30 text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base font-light">view_column</span>
                <span>{isDirectoryOpen ? 'Hide Country Directory' : 'Region & Country Directory'}</span>
                <span className="material-symbols-outlined text-sm transition-transform duration-300" style={{ transform: isDirectoryOpen ? 'rotate(180deg)' : 'none' }}>
                  expand_more
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* ── REGION PILLS SELECTOR ── */}
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2 mb-2 px-1">
            <span className="text-[9px] font-black tracking-[0.4em] uppercase text-on-surface-variant/60">Filter by Region</span>
            {filter.region && (
              <button
                onClick={() => setFilter(prev => ({ ...prev, region: '', country: '' }))}
                className="text-[9px] font-bold uppercase tracking-widest text-primary hover:underline"
              >
                Reset Region
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setFilter(prev => ({ ...prev, region: '', country: '' }))}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black tracking-[0.25em] uppercase whitespace-nowrap transition-all border shrink-0 ${
                !filter.region
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
                  : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-black/30 dark:hover:border-white/30'
              }`}
            >
              <span className="material-symbols-outlined text-base font-light">public</span>
              <span>All Regions</span>
              <span className="text-[9px] font-normal opacity-70">({tours.length})</span>
            </button>

            {REGIONS_DIRECTORY.map(r => {
              const isActive = filter.region.toLowerCase() === r.name.toLowerCase();
              const count = regionCounts[r.name] || 0;
              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectRegion(r.name)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black tracking-[0.25em] uppercase whitespace-nowrap transition-all border shrink-0 ${
                    isActive
                      ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
                      : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-black/30 dark:hover:border-white/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-base font-light">{r.icon}</span>
                  <span>{r.name}</span>
                  <span className={`text-[9px] font-normal ${isActive ? 'opacity-90' : 'opacity-50'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── ACTIVE REGION COUNTRY QUICK-PILLS ── */}
        {activeRegionObj && (
          <div className="mb-6 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-sm animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base font-light">{activeRegionObj.icon}</span>
                <span className="text-xs font-black tracking-widest uppercase text-on-surface">
                  {activeRegionObj.name} Destinations ({activeRegionObj.destinations.length})
                </span>
              </div>
              <span className="text-[9px] font-medium text-on-surface-variant opacity-60">Click any country or state to filter</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilter(prev => ({ ...prev, country: '' }))}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                  !filter.country
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface hover:bg-surface-container border-outline-variant/30 text-on-surface'
                }`}
              >
                All {activeRegionObj.name}
              </button>
              {activeRegionObj.destinations.map(d => {
                const isSelected = filter.country.toLowerCase() === d.name.toLowerCase();
                const dCount = getDestinationTourCount(tours, d);
                return (
                  <button
                    key={d.name}
                    onClick={() => handleSelectCountry(d.name, activeRegionObj.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all border ${
                      isSelected
                        ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-sm'
                        : 'bg-surface hover:bg-surface-container border-outline-variant/30 text-on-surface'
                    }`}
                  >
                    <span>{d.name}</span>
                    {isSelected && <span className="material-symbols-outlined text-xs">check</span>}
                    {dCount > 0 && <span className="text-[8px] opacity-60 font-normal">({dCount})</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── EXPANDABLE REGION & COUNTRY DIRECTORY TABLE (AS IN PRINTED SHEET) ── */}
        {isDirectoryOpen && (
          <section className="mb-8 bg-surface dark:bg-neutral-950 border border-outline-variant/20 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl animate-reveal-up overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/20 mb-6">
              <div>
                <span className="text-[9px] font-black tracking-[0.5em] uppercase text-primary block mb-1">Interactive Directory</span>
                <h3 className="text-2xl font-light tracking-tight italic">
                  Explore by <span className="not-italic font-black text-on-surface dark:text-white">Region & Country</span>
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[9px] font-black tracking-widest uppercase text-red-500 hover:text-red-700 transition-colors"
                >
                  Reset All Filters
                </button>
                <button
                  type="button"
                  onClick={() => setIsDirectoryOpen(false)}
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
                  aria-label="Close directory"
                >
                  <span className="material-symbols-outlined text-sm font-light">close</span>
                </button>
              </div>
            </div>

            {/* 8-Column Layout corresponding to the document sheet */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 text-left">
              {REGIONS_DIRECTORY.map(reg => (
                <div key={reg.id} className="flex flex-col">
                  {/* Column Header */}
                  <div
                    onClick={() => handleSelectRegion(reg.name)}
                    className="cursor-pointer group flex items-center justify-between pb-2 mb-3 border-b-2 border-primary/80"
                  >
                    <h4 className="font-bold text-xs uppercase tracking-wider text-primary group-hover:underline">
                      {reg.name}
                    </h4>
                    <span className="text-[9px] text-on-surface-variant/60 font-mono">
                      {regionCounts[reg.name] || 0}
                    </span>
                  </div>

                  {/* Destination list under column */}
                  <ul className="space-y-1.5 text-[11px]">
                    {reg.destinations.map(dest => {
                      const isSelected = filter.country.toLowerCase() === dest.name.toLowerCase();
                      const dCount = getDestinationTourCount(tours, dest);
                      return (
                        <li key={dest.name}>
                          <button
                            type="button"
                            onClick={() => handleSelectCountry(dest.name, reg.name)}
                            className={`w-full text-left py-0.5 px-1.5 rounded flex items-center justify-between transition-colors ${
                              isSelected
                                ? 'bg-primary/15 text-primary font-bold'
                                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                            }`}
                          >
                            <span className="truncate">{dest.name}</span>
                            <span className="flex items-center gap-1 shrink-0 ml-1">
                              {isSelected && <span className="material-symbols-outlined text-xs text-primary font-bold">check</span>}
                              {dCount > 0 && !isSelected && (
                                <span className="text-[8.5px] text-on-surface-variant/40 font-mono">{dCount}</span>
                              )}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── STICKY SEARCH & FILTER CONTROL BAR ── */}
        <section className="sticky top-14 md:top-[58px] bg-white/95 dark:bg-black/85 backdrop-blur-md z-40 rounded-2xl border border-outline-variant/20 dark:border-white/10 shadow-md px-4 py-3 mb-8">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">

            {/* Free text search */}
            <div className="flex-1 min-w-[200px] sm:min-w-[260px] relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-base pointer-events-none">search</span>
              <input
                type="text"
                value={filter.search}
                onChange={e => {
                  setFilter(prev => ({ ...prev, search: e.target.value }));
                  setVisibleCount(9);
                }}
                placeholder="Search tour title, city, or route..."
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-9 pr-8 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-all"
              />
              {filter.search && (
                <button
                  type="button"
                  onClick={() => setFilter(prev => ({ ...prev, search: '' }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface text-sm"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>

            {/* Region Select */}
            <div className="flex flex-col gap-0.5">
              <div className="relative">
                <select
                  value={filter.region}
                  onChange={e => handleSelectRegion(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 pr-7 text-xs font-medium focus:ring-0 focus:border-primary cursor-pointer appearance-none text-on-surface min-w-[130px]"
                >
                  <option value="">All Regions</option>
                  {REGIONS_DIRECTORY.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/50 text-sm">expand_more</span>
              </div>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-0.5">
              <div className="relative">
                <select
                  value={filter.category}
                  onChange={e => {
                    setFilter(prev => ({ ...prev, category: e.target.value }));
                    setVisibleCount(9);
                  }}
                  className="bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 pr-7 text-xs font-medium focus:ring-0 focus:border-primary cursor-pointer appearance-none text-on-surface min-w-[120px]"
                >
                  <option value="">All Types</option>
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/50 text-sm">expand_more</span>
              </div>
            </div>

            {/* Max Duration */}
            <div className="flex flex-col gap-0.5">
              <div className="relative">
                <select
                  value={filter.maxDays}
                  onChange={e => {
                    setFilter(prev => ({ ...prev, maxDays: e.target.value }));
                    setVisibleCount(9);
                  }}
                  className="bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 pr-7 text-xs font-medium focus:ring-0 focus:border-primary cursor-pointer appearance-none text-on-surface min-w-[110px]"
                >
                  <option value="">Any Days</option>
                  <option value="5">Up to 5 days</option>
                  <option value="8">Up to 8 days</option>
                  <option value="10">Up to 10 days</option>
                  <option value="14">Up to 14 days</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/50 text-sm">expand_more</span>
              </div>
            </div>

            {/* Clear Filters */}
            {hasFilter && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-[9px] font-black tracking-[0.2em] uppercase text-red-500 hover:text-red-700 transition-colors whitespace-nowrap px-2 py-1.5"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                Clear ({activeFilterCount})
              </button>
            )}

            {/* View Mode & Results Count */}
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center border border-outline-variant/30 dark:border-white/10 rounded-full p-1 gap-1 bg-surface dark:bg-white/5 shadow-sm">
                {(['grid', 'list'] as ViewMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    aria-label={`${mode} view`}
                    className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${
                      viewMode === mode
                        ? 'bg-on-surface dark:bg-white text-surface dark:text-black'
                        : 'text-on-surface-variant/50 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined font-light text-base">{mode === 'grid' ? 'grid_view' : 'view_agenda'}</span>
                  </button>
                ))}
              </div>

              <span className="hidden lg:block text-[9px] font-black tracking-[0.25em] uppercase text-on-surface-variant/60 whitespace-nowrap">
                {loading ? '…' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
              </span>
            </div>

          </div>

          {/* Active Filter Badges */}
          {hasFilter && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-outline-variant/10 text-[9px] font-bold uppercase tracking-wider">
              <span className="text-on-surface-variant/50 mr-1">Active:</span>
              {filter.region && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md">
                  Region: {filter.region}
                  <button onClick={() => setFilter(prev => ({ ...prev, region: '', country: '' }))} className="hover:text-red-500">×</button>
                </span>
              )}
              {filter.country && (
                <span className="inline-flex items-center gap-1 bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 rounded-md">
                  Country: {filter.country}
                  <button onClick={() => setFilter(prev => ({ ...prev, country: '' }))} className="hover:text-red-400">×</button>
                </span>
              )}
              {filter.search && (
                <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded-md border border-outline-variant/20">
                  Search: "{filter.search}"
                  <button onClick={() => setFilter(prev => ({ ...prev, search: '' }))} className="hover:text-red-500">×</button>
                </span>
              )}
              {filter.category && (
                <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded-md border border-outline-variant/20">
                  Type: {filter.category}
                  <button onClick={() => setFilter(prev => ({ ...prev, category: '' }))} className="hover:text-red-500">×</button>
                </span>
              )}
              {filter.maxDays && (
                <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded-md border border-outline-variant/20">
                  Max: {filter.maxDays} Days
                  <button onClick={() => setFilter(prev => ({ ...prev, maxDays: '' }))} className="hover:text-red-500">×</button>
                </span>
              )}
            </div>
          )}
        </section>

        {/* ── TOUR CONTENT ── */}
        {loading ? (
          <Skeleton type="tour-card" count={6} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-low rounded-3xl border border-outline-variant/10 shadow-sm">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4 block font-light">search_off</span>
            <h3 className="text-2xl font-light mb-2 tracking-tighter italic">No expeditions found</h3>
            <p className="text-on-surface-variant font-light max-w-md mx-auto text-sm opacity-70 mb-6 leading-relaxed">
              No tours matched your selected region or country filter. Try selecting another destination or resetting all filters.
            </p>
            <button
              onClick={clearAll}
              className="bg-black text-white dark:bg-white dark:text-black px-6 py-2.5 rounded-full text-[10px] font-black tracking-[0.4em] uppercase hover:bg-primary hover:text-white transition-all shadow-md"
            >
              Clear all filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {filtered.slice(0, visibleCount).map((tour, idx) => (
              <article
                key={tour.id}
                className="group cursor-pointer animate-reveal-up flex flex-col justify-between"
                style={{ animationDelay: `${(idx % 6) * 0.05}s` }}
                onClick={() => navigate(`/tours/${tour.id}`)}
              >
                <div>
                  <div className="overflow-hidden mb-3.5 aspect-[4/5] bg-surface-container-low rounded-2xl relative shadow-md group-hover:shadow-2xl transition-all duration-500">
                    <LazyImage 
                      containerClassName="absolute inset-0 w-full h-full"
                      className="w-full h-full object-cover transition-transform duration-[4s] ease-out group-hover:scale-105"
                      alt={tour.name}
                      src={optimizeImage(tour.heroImageUrl || FALLBACK, 800)}
                    />
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
                      <div className="bg-white/95 backdrop-blur px-3 py-1 rounded-full shadow border border-black/5">
                        <span className="text-[9px] font-black tracking-[0.3em] text-black uppercase">{tour.days} Days</span>
                      </div>
                      {tour.region && (
                        <div className="bg-black/75 backdrop-blur px-3 py-1 rounded-full border border-white/10">
                          <span className="text-[8px] font-black tracking-[0.25em] text-white uppercase">{tour.region}</span>
                        </div>
                      )}
                    </div>
                    {/* Price hover */}
                    <div className="absolute inset-x-3 bottom-3 bg-black/80 backdrop-blur-md px-4 py-2.5 rounded-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex justify-between items-center shadow-lg">
                      <span className="text-[9px] font-black tracking-widest uppercase text-white/70">From</span>
                      <span className="text-base font-light font-serif italic text-white">{tour.price}</span>
                    </div>
                  </div>

                  <div className="px-1">
                    <div className="flex items-center gap-1.5 mb-1 text-[8px] font-black tracking-[0.3em] uppercase text-primary">
                      <span>{tour.region}</span>
                      <span className="text-on-surface-variant/30">·</span>
                      <span className="text-on-surface-variant/50">{tour.category}</span>
                    </div>
                    <h3 className="text-lg font-light tracking-tight mb-1.5 leading-snug group-hover:text-primary transition-colors duration-200 line-clamp-2">
                      {tour.name}
                    </h3>
                  </div>
                </div>

                <div className="px-1 pt-2">
                  <button className="inline-flex items-center gap-1.5 text-[9px] font-black tracking-[0.3em] uppercase border-b border-on-surface/20 dark:border-white/20 pb-0.5 group-hover:border-primary group-hover:text-primary transition-all duration-200">
                    View Dossier <span className="material-symbols-outlined font-light text-sm">arrow_forward</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          // ── LIST VIEW ──
          <div className="flex flex-col divide-y divide-outline-variant/15">
            {filtered.slice(0, visibleCount).map(tour => (
              <article
                key={tour.id}
                className="group cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-5 py-5 hover:bg-surface-container-low/60 transition-colors duration-200 rounded-2xl px-4 -mx-4"
                onClick={() => navigate(`/tours/${tour.id}`)}
              >
                <div className="shrink-0 w-full sm:w-28 md:w-36 aspect-[4/3] sm:aspect-square overflow-hidden rounded-2xl bg-surface-container-low relative shadow-md">
                  <LazyImage 
                    containerClassName="absolute inset-0 w-full h-full"
                    className="w-full h-full object-cover transition-transform duration-[3s] ease-out group-hover:scale-105"
                    alt={tour.name}
                    src={tour.heroImageUrl || FALLBACK}
                  />
                  <div className="absolute inset-0 flex items-end p-2 pointer-events-none z-10 bg-gradient-to-t from-black/60 to-transparent">
                    <span className="text-[8px] font-black bg-white/90 text-black px-2.5 py-0.5 rounded-full tracking-widest uppercase">
                      {tour.days} Days
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 text-[8px] font-black tracking-widest uppercase text-primary">
                      <span>{tour.region}</span>
                      <span className="text-on-surface-variant/30">·</span>
                      <span className="text-on-surface-variant/50">{tour.category}</span>
                    </div>
                    <h3 className="text-lg md:text-xl font-light tracking-tight group-hover:text-primary transition-colors duration-300 truncate mb-1">
                      {tour.name}
                    </h3>
                    <p className="text-xs font-light text-on-surface-variant leading-relaxed opacity-60 line-clamp-2">
                      {tour.overviewDescription}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-xl font-light tracking-tight font-serif italic text-on-surface">{tour.price}</span>
                      <span className="text-[8px] font-black tracking-widest uppercase text-on-surface-variant/50">per person</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black text-white dark:bg-white dark:text-black px-5 py-2.5 rounded-full text-[9px] font-black tracking-[0.3em] uppercase group-hover:bg-primary group-hover:text-white transition-colors duration-200 whitespace-nowrap shadow-sm">
                      View <span className="material-symbols-outlined font-light text-sm">arrow_forward</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Result count footer & Load More */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col items-center mt-12 gap-4">
            {visibleCount < filtered.length && (
              <button 
                onClick={() => setVisibleCount(v => v + 9)}
                className="bg-surface-container-low hover:bg-surface-container-high text-on-surface px-8 py-3 rounded-full text-[10px] font-black tracking-[0.4em] uppercase transition-all border border-outline-variant/30 shadow-md hover:shadow-lg"
              >
                Load More Expeditions
              </button>
            )}
            <p className="text-center text-[9px] font-black tracking-[0.4em] uppercase text-on-surface-variant/40">
              Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} expeditions
              {hasFilter && ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`}
            </p>
          </div>
        )}

        {/* ── BESPOKE STRIP ── */}
        <section className="mt-16 bg-black text-white rounded-3xl px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xl border border-white/10">
          <div className="max-w-md">
            <span className="text-[9px] font-black tracking-[0.6em] uppercase text-primary block mb-2">Private Inception Bureau</span>
            <h2 className="text-3xl font-light tracking-tighter leading-tight">
              Tailored <span className="font-serif italic text-white/90">curations.</span>
            </h2>
            <p className="text-sm font-light text-white/60 mt-2 leading-relaxed">
              Senior-level travel strategy for custom bespoke itineraries across our global directory network.
            </p>
          </div>
          <button
            className="shrink-0 border-2 border-white text-white px-7 py-3 text-[10px] font-black tracking-[0.5em] uppercase rounded-full hover:bg-white hover:text-black transition-all duration-300 whitespace-nowrap shadow-lg"
            onClick={() => navigate('/contact')}
          >
            Request Strategic Audit
          </button>
        </section>
      </div>
    </main>
  );
}
