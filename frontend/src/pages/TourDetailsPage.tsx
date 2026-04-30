import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SEO } from '../components/SEO';
import type { Tour } from '../lib/api';
import { api } from '../lib/api';
import { Preloader } from '../components/Preloader';

/* ─── small inline image carousel for sightseeing ─── */
function SightseeingSlider({ items }: { items: NonNullable<Tour['sightseeing']> }) {
  const [idx, setIdx] = useState(0);
  const [prog, setProg] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const MS = 4500;

  const go = useCallback((next: number) => {
    setIdx(next);
    setProg(0);
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    timerRef.current = setInterval(() => go((idx + 1) % items.length), MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [go, idx, items.length]);

  useEffect(() => {
    setProg(0);
    if (items.length <= 1) return;
    const step = 100 / (MS / 50);
    progRef.current = setInterval(() => setProg(p => Math.min(p + step, 100)), 50);
    return () => { if (progRef.current) clearInterval(progRef.current); };
  }, [idx, items.length]);

  const current = items[idx];
  const images = items.filter(s => s.imageUrl);

  if (!images.length) {
    // No images — show a simple grid of icon cards
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((site, i) => (
          <div key={i} className="bg-white border border-outline-variant/20 rounded-2xl p-5 hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-full bg-surface-container-low group-hover:bg-black group-hover:text-white transition-all flex items-center justify-center mb-3">
              <span className="material-symbols-outlined font-light text-xl">{site.icon || 'star'}</span>
            </div>
            <h4 className="text-lg font-light tracking-tighter italic mb-1">{site.title}</h4>
            <p className="text-sm font-light text-on-surface-variant leading-relaxed opacity-60">{site.description}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ── Main image with crossfade ── */}
      <div className="relative flex-1 overflow-hidden rounded-2xl bg-black shadow-md aspect-[16/9] lg:aspect-auto lg:h-[420px]">
        {items.map((s, i) => s.imageUrl && (
          <img key={i} src={s.imageUrl} alt={s.title}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === idx ? 'opacity-100' : 'opacity-0'}`} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        {/* Info overlay */}
        <div className="absolute bottom-0 inset-x-0 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 backdrop-blur flex items-center justify-center">
              <span className="material-symbols-outlined text-white font-light text-base">{current.icon || 'star'}</span>
            </div>
            <span className="text-[8px] font-black tracking-[0.4em] uppercase text-white/50">Landmark</span>
          </div>
          <h4 className="text-xl sm:text-2xl font-light text-white tracking-tighter italic">{current.title}</h4>
          <p className="text-xs font-light text-white/60 leading-relaxed mt-1 max-w-md">{current.description}</p>
        </div>
        {/* Progress bar */}
        {items.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
            <div className="h-full bg-primary" style={{ width: `${prog}%`, transition: 'width 50ms linear' }} />
          </div>
        )}
        {/* Arrows */}
        {items.length > 1 && (
          <>
            <button onClick={() => go((idx - 1 + items.length) % items.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 border border-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
              <span className="material-symbols-outlined text-base font-light">chevron_left</span>
            </button>
            <button onClick={() => go((idx + 1) % items.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 border border-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
              <span className="material-symbols-outlined text-base font-light">chevron_right</span>
            </button>
          </>
        )}
      </div>

      {/* ── Thumbnail track + details list ── */}
      <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:max-h-[420px] lg:w-56 shrink-0 pr-1">
        {items.map((site, i) => (
          <button key={i} onClick={() => go(i)}
            className={`shrink-0 flex lg:flex items-center gap-3 rounded-xl border p-2 transition-all text-left ${i === idx ? 'border-black bg-black/5 shadow-sm' : 'border-outline-variant/20 hover:border-black/30'}`}>
            {site.imageUrl ? (
              <img src={site.imageUrl} alt={site.title}
                className={`w-12 h-12 lg:w-10 lg:h-10 object-cover rounded-lg shrink-0 transition-all duration-300 ${i === idx ? 'grayscale-0' : 'grayscale opacity-50'}`} />
            ) : (
              <div className="w-12 h-12 lg:w-10 lg:h-10 bg-surface-container-low rounded-lg shrink-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-base font-light text-on-surface-variant">{site.icon || 'star'}</span>
              </div>
            )}
            <div className="hidden lg:block min-w-0">
              <p className={`text-xs font-semibold truncate ${i === idx ? 'text-black' : 'text-on-surface-variant'}`}>{site.title}</p>
              <p className="text-[10px] text-on-surface-variant/50 font-light truncate">{site.description?.slice(0, 40)}…</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── collapsible itinerary item ─── */
function ItineraryDay({ day, index, total }: { day: NonNullable<Tour['itinerary']>[0], index: number, total: number }) {
  const [isOpen, setIsOpen] = useState(index === 0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to parse description for bullet points and format them
  const renderDescription = (text: string, isExpanded: boolean, setIsExpanded: (v: boolean) => void) => {
    if (!text) return null;
    const CHAR_LIMIT = 280; 
    const needsTruncation = text.length > CHAR_LIMIT;
    const displayText = isExpanded ? text : text.slice(0, CHAR_LIMIT);

    const lines = displayText.split('\n');
    return (
      <>
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('•')) {
            return (
              <div key={i} className="mt-4 mb-2 pl-4 border-l-2 border-primary/20 bg-primary/[0.02] p-4 rounded-r-xl">
                <h5 className="text-sm font-bold tracking-tight text-on-surface mb-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {trimmed.replace('•', '').trim()}
                </h5>
              </div>
            );
          }
          return (
            <p key={i} className={`text-sm font-light text-on-surface-variant leading-relaxed opacity-70 ${i > 0 ? 'mt-2' : ''}`}>
              {trimmed}
            </p>
          );
        })}
        {needsTruncation && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="mt-4 flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-black hover:text-primary transition-all group/more"
          >
            <span className="w-6 h-px bg-black group-hover/more:bg-primary transition-all" />
            {isExpanded ? 'Show Less' : 'Show Full Details'}
            <span className={`material-symbols-outlined text-xs transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
          </button>
        )}
      </>
    );
  };

  return (
    <div className="relative pl-8 sm:pl-12 group print:pl-0 print:mb-8 break-inside-avoid">
      {/* Timeline dot */}
      <div className={`absolute left-[-5px] sm:left-[35px] top-7 w-3 h-3 rounded-full ring-8 ring-white ${index === 0 ? 'bg-black' : 'bg-outline-variant group-hover:bg-black transition-colors duration-300'} z-10 print:hidden`} />
      
      {/* Connector line for print/last item */}
      {index < total - 1 && (
        <div className="absolute left-px sm:left-[41px] top-10 bottom-0 w-px bg-outline-variant/20 print:hidden" />
      )}

      <div className="bg-white border border-outline-variant/15 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 print:border-none print:shadow-none">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4 group/btn print:cursor-default"
        >
          <div className="flex-1 min-w-0">
            <span className="bg-black/5 text-black px-3 py-1 rounded-full text-[8px] font-black tracking-[0.3em] uppercase mb-3 inline-block">Phase {String(index + 1).padStart(2, '0')}</span>
            <h3 className="text-xl sm:text-2xl font-light tracking-tighter italic break-words flex items-center gap-2">
              {day.title}
            </h3>
          </div>
          <div className={`mt-8 w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center transition-all duration-500 group-hover/btn:border-black print:hidden ${isOpen ? 'bg-black text-white' : ''}`}>
            <span className={`material-symbols-outlined text-base transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
          </div>
        </button>

        <div className={`transition-all duration-700 ease-[cubic-bezier(0.2,1,0.3,1)] overflow-hidden ${isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'} print:max-h-none print:opacity-100`}>
          <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-outline-variant/10 space-y-6">
            {day.imageUrl && (
              <div className="aspect-[16/7] overflow-hidden rounded-xl bg-surface-container-low">
                <img src={day.imageUrl} alt={day.title} className="w-full h-full object-cover transition-transform duration-[5s] hover:scale-105" />
              </div>
            )}
            
            <div className="space-y-4">
              {renderDescription(day.description, isExpanded, setIsExpanded)}
            </div>

            {/* Detail chips: Schedule / Accommodation / Meals */}
            {(day.schedule || day.accommodation || day.meals) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-outline-variant/15">
                {day.schedule && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary font-light text-lg">schedule</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black tracking-[0.3em] uppercase text-on-surface-variant/40 mb-1">Schedule</p>
                      <p className="text-xs font-light text-on-surface-variant leading-relaxed truncate hover:text-clip hover:whitespace-normal">{day.schedule}</p>
                    </div>
                  </div>
                )}
                {day.accommodation && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary font-light text-lg">hotel</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black tracking-[0.3em] uppercase text-on-surface-variant/40 mb-1">Accommodation</p>
                      <p className="text-xs font-light text-on-surface-variant leading-relaxed truncate">{day.accommodation}</p>
                    </div>
                  </div>
                )}
                {day.meals && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary font-light text-lg">restaurant</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black tracking-[0.3em] uppercase text-on-surface-variant/40 mb-1">Meals</p>
                      <p className="text-xs font-light text-on-surface-variant leading-relaxed">{day.meals}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── main page ─── */
export default function TourDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const defaultHero = "https://images.unsplash.com/photo-1544016768-982d1554f0b9?q=80&w=1974&auto=format&fit=crop";

  useEffect(() => {
    if (!id) return;
    window.scrollTo(0, 0);
    
    const fetchTour = () => {
      api.getTour(id)
        .then(data => { setTour(data); setLoading(false); })
        .catch(err => { console.error(err); setError('Failed to load.'); setLoading(false); });
    };

    fetchTour(); // Initial fetch
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') fetchTour();
    }, 3000); // Poll every 3 seconds only if tab is visible

    const onFocus = () => { if (document.visibilityState === 'visible') fetchTour(); };
    window.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [id]);

  if (loading) return <Preloader fullScreen />;

  if (error || !tour) return (
    <div className="h-screen flex flex-col items-center justify-center text-center px-8">
      <span className="material-symbols-outlined text-6xl text-primary/5 mb-6 block font-light">explore_off</span>
      <h2 className="text-3xl font-light mb-4 tracking-tighter uppercase">Registry Error</h2>
      <p className="text-on-surface-variant font-light mb-10 text-base opacity-70">We could not locate this itinerary.</p>
      <button className="bg-black text-white px-10 py-3 text-[10px] tracking-[0.4em] uppercase font-bold rounded-full hover:bg-primary transition-all"
        onClick={() => navigate('/tours')}>Return to Registry</button>
    </div>
  );

  const visualArchive = tour.visualArchive?.length ? tour.visualArchive : [tour.heroImageUrl || defaultHero];
  const itinerary = tour.itinerary || [];
  const sightseeing = tour.sightseeing || [];
  const departureWindows = tour.departureWindows || ['By Private Request'];

  return (
    <div className="overflow-x-hidden w-full">
      <SEO title={`${tour.name} | JourneyFlicker`} description={tour.overviewDescription} image={tour.heroImageUrl} />

      {/* ── 1. HEADER ── */}
      <section className="pt-24 md:pt-28 pb-8 px-4 sm:px-8 md:px-16 max-w-5xl mx-auto animate-reveal-up">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <nav className="flex flex-wrap items-center text-[9px] tracking-[0.3em] uppercase text-on-surface-variant font-bold">
            <span className="cursor-pointer hover:text-black transition-colors" onClick={() => navigate('/')}>Home</span>
            <span className="mx-3 text-outline-variant/30">/</span>
            <span className="cursor-pointer hover:text-black transition-colors" onClick={() => navigate('/tours')}>Tours</span>
            <span className="mx-3 text-outline-variant/30">/</span>
            <span className="text-on-surface font-black opacity-40 truncate">{tour.name}</span>
          </nav>
          <button onClick={() => window.print()} className="no-print flex items-center gap-1.5 text-[9px] font-black tracking-[0.3em] uppercase bg-black/5 hover:bg-black hover:text-white transition-all px-4 py-2 rounded-full">
            <span className="material-symbols-outlined text-sm">print</span> Brochure
          </button>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="bg-black/5 px-4 py-1.5 rounded-full text-black text-[9px] font-black tracking-[0.3em] uppercase">{tour.region}</span>
              <span className="text-on-surface-variant/40 text-[9px] tracking-[0.3em] uppercase font-bold">{tour.category}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tighter leading-tight italic break-words">{tour.name}</h1>
          </div>
          <div className="flex items-center gap-6 bg-white p-5 rounded-2xl border border-outline-variant/20 shadow-sm w-full sm:w-auto shrink-0">
            <div className="flex flex-col border-r border-outline-variant/30 pr-6">
              <span className="text-[9px] font-black tracking-[0.4em] uppercase text-on-surface-variant mb-1 opacity-50">Duration</span>
              <span className="text-3xl font-light tracking-tighter whitespace-nowrap">{tour.days} <span className="text-base opacity-30 italic font-serif">Days</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black tracking-[0.4em] uppercase text-on-surface-variant mb-1 opacity-50">From</span>
              <span className="text-3xl font-light tracking-tighter font-serif italic">{tour.price}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. HERO GALLERY ── */}
      <section className="px-4 sm:px-8 md:px-16 max-w-5xl mx-auto mb-12 animate-reveal-up">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[40vh] sm:h-[50vh] md:h-[55vh]">
          <div className="lg:col-span-2 overflow-hidden rounded-2xl relative bg-black shadow-sm group min-h-[200px]">
            <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-[5s] ease-out group-hover:scale-105 opacity-90" alt={tour.name} src={tour.heroImageUrl || defaultHero} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute left-5 md:left-8 bottom-5 md:bottom-8 flex items-center gap-3">
              <div className="h-px w-8 bg-white/40" />
              <span className="text-white/50 text-[9px] tracking-[0.4em] uppercase font-black">Verified Asset</span>
            </div>
          </div>
          <div className="hidden lg:flex flex-col gap-4 h-full">
            <div className="flex-1 overflow-hidden rounded-2xl group relative bg-black shadow-sm">
              <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-[5s] group-hover:scale-110 opacity-70 group-hover:opacity-100 grayscale group-hover:grayscale-0" alt="Gallery 1" src={visualArchive[0] || defaultHero} />
            </div>
            <div className="flex-1 overflow-hidden rounded-2xl group relative bg-black shadow-sm cursor-pointer">
              <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-[5s] group-hover:scale-110 opacity-70 group-hover:opacity-100 grayscale group-hover:grayscale-0" alt="Gallery 2" src={visualArchive[1] || tour.heroImageUrl || defaultHero} />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                <span className="text-[9px] tracking-[0.4em] font-black uppercase border border-white/50 px-8 py-4 rounded-full hover:bg-white hover:text-black transition-all">{visualArchive.length} Photos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. CONTENT ── */}
      <section className="px-4 sm:px-8 md:px-16 max-w-5xl mx-auto pb-16 md:pb-24">
        <div className="space-y-14 md:space-y-20">

          {/* ── 01. NARRATIVE (with optional overview image) ── */}
          <article className="animate-reveal-up">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[9px] font-black tracking-[0.4em] text-primary uppercase">01.</span>
              <div className="h-px bg-outline-variant/30 w-14" />
              <h2 className="text-[10px] font-black tracking-[0.6em] uppercase text-on-surface">The Narrative</h2>
            </div>
            <div className={`flex flex-col ${tour.overviewImageUrl ? 'lg:flex-row gap-10' : ''} pl-0 sm:pl-10`}>
              <div className="flex-1 space-y-5">
                <p className="text-2xl sm:text-3xl md:text-4xl font-light leading-tight text-on-surface tracking-tighter italic opacity-90 break-words max-w-3xl">
                  {tour.overviewDescription}
                </p>
                <div className="w-10 h-1 bg-black" />
                <p className="text-on-surface-variant leading-relaxed text-base font-light max-w-3xl whitespace-pre-line opacity-80">
                  {tour.overviewExtended}
                </p>
              </div>
              {tour.overviewImageUrl && (
                <div className="w-full lg:w-72 shrink-0 overflow-hidden rounded-2xl shadow-md group aspect-[3/4]">
                  <img src={tour.overviewImageUrl} alt="Overview"
                    className="w-full h-full object-cover transition-transform duration-[5s] group-hover:scale-105" />
                </div>
              )}
            </div>
          </article>

          {/* ── QUICK STATS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 py-8 border-y border-outline-variant/20 animate-reveal-up pl-0 sm:pl-10">
            {[
              { label: 'Transport',  val: tour.transport || 'Private Air',   icon: 'flight_takeoff' },
              { label: 'Specialist', val: tour.guide     || 'Curator',        icon: 'person' },
              { label: 'Clearance',  val: tour.pickup    || 'VIP Access',     icon: 'verified_user' },
              { label: 'Max Guests', val: `Max ${tour.maxGuests || 8}`,        icon: 'group' },
            ].map((stat, i) => (
              <div key={i} className="space-y-3 group">
                <span className="material-symbols-outlined text-outline-variant/40 group-hover:text-black transition-colors duration-500 font-light text-3xl block">{stat.icon}</span>
                <div>
                  <span className="text-[8px] tracking-[0.4em] font-black text-on-surface-variant uppercase block mb-1 opacity-50">{stat.label}</span>
                  <span className="text-base font-light text-on-surface font-serif italic">{stat.val}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── 02. ITINERARY (with image, schedule, accommodation, meals) ── */}
          {itinerary.length > 0 && (
            <section className="animate-reveal-up">
              <div className="flex items-center gap-4 mb-8">
                <span className="text-[9px] font-black tracking-[0.4em] text-primary uppercase">02.</span>
                <div className="h-px bg-outline-variant/30 w-14" />
                <h2 className="text-[10px] font-black tracking-[0.6em] uppercase text-on-surface">Day-by-Day Sequence</h2>
              </div>
              <div className="space-y-6 pl-0 sm:pl-10 relative">
                {itinerary.map((day, idx) => (
                  <ItineraryDay key={idx} day={day} index={idx} total={itinerary.length} />
                ))}
              </div>
            </section>
          )}

          {/* ── 03. SIGHTSEEING SLIDER ── */}
          {sightseeing.length > 0 && (
            <section className="animate-reveal-up">
              <div className="flex items-center gap-4 mb-8">
                <span className="text-[9px] font-black tracking-[0.4em] text-primary uppercase">03.</span>
                <div className="h-px bg-outline-variant/30 w-14" />
                <h2 className="text-[10px] font-black tracking-[0.6em] uppercase text-on-surface">Territory Landmarks</h2>
              </div>
              <div className="pl-0 sm:pl-10">
                <SightseeingSlider items={sightseeing} />
              </div>
            </section>
          )}

          {/* ── 04. VISUAL ARCHIVE ── */}
          {visualArchive.length > 1 && (
            <section className="animate-reveal-up">
              <div className="flex items-center gap-4 mb-8">
                <span className="text-[9px] font-black tracking-[0.4em] text-primary uppercase">04.</span>
                <div className="h-px bg-outline-variant/30 w-14" />
                <h2 className="text-[10px] font-black tracking-[0.6em] uppercase text-on-surface">Visual Archive</h2>
              </div>
              <div className="pl-0 sm:pl-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {visualArchive.map((img, i) => (
                  <div key={i} className={`overflow-hidden rounded-xl group relative bg-black shadow-sm ${i === 0 ? 'col-span-2 row-span-2 aspect-square sm:aspect-auto sm:h-60' : 'aspect-square'}`}>
                    <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-[4s] ease-out group-hover:scale-105 grayscale group-hover:grayscale-0"
                      alt={`Archive ${i + 1}`} src={img} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 05. TESTIMONIALS ── */}
          {tour.testimonials && tour.testimonials.length > 0 && (
            <section className="animate-reveal-up">
              <div className="flex items-center gap-4 mb-8">
                <span className="text-[9px] font-black tracking-[0.4em] text-primary uppercase">05.</span>
                <div className="h-px bg-outline-variant/30 w-14" />
                <h2 className="text-[10px] font-black tracking-[0.6em] uppercase text-on-surface">Client Registry</h2>
              </div>
              <div className="pl-0 sm:pl-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tour.testimonials.map((t, i) => (
                  <div key={i} className="bg-black text-white rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all group">
                    <div className="flex gap-1 mb-4">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                    </div>
                    <p className="text-sm font-light text-white/70 leading-relaxed italic mb-5 group-hover:text-white/90 transition-colors">&ldquo;{t.quote}&rdquo;</p>
                    <p className="text-[9px] font-black tracking-[0.4em] uppercase text-white/30">— {t.author}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 06. DEPARTURE WINDOWS ── */}
          <section className="animate-reveal-up">
            <div className="flex items-center gap-4 mb-8">
              <span className="text-[9px] font-black tracking-[0.4em] text-primary uppercase">06.</span>
              <div className="h-px bg-outline-variant/30 w-14" />
              <h2 className="text-[10px] font-black tracking-[0.6em] uppercase text-on-surface">Departure Windows</h2>
            </div>
            <div className="pl-0 sm:pl-10 flex flex-wrap gap-3">
              {departureWindows.map((win, idx) => (
                <span key={idx} className="bg-black/5 hover:bg-black hover:text-white transition-all duration-300 px-5 py-2.5 rounded-full text-[9px] tracking-[0.3em] uppercase font-black cursor-default">
                  {win}
                </span>
              ))}
            </div>
          </section>

          {/* ── BOOK CTA ── */}
          <div className="bg-black rounded-2xl p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 animate-reveal-up">
            <div>
              <span className="text-[9px] font-black tracking-[0.6em] uppercase text-white/30 block mb-2">Reserve Access</span>
              <h3 className="text-2xl font-light tracking-tighter mb-1">Ready to <span className="font-serif italic text-white/70">depart?</span></h3>
              <p className="text-xs text-white/40 font-light">Our curators respond within 24 hours.</p>
            </div>
            <button className="shrink-0 bg-white text-black px-7 py-3 rounded-full text-[10px] font-black tracking-[0.4em] uppercase hover:bg-primary hover:text-white transition-all shadow-lg"
              onClick={() => navigate('/contact')}>
              Begin Inquiry
            </button>
          </div>

        </div>
      </section>
    </div>
  );
}