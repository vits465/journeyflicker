import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SEO } from '../components/SEO';
import type { Destination, Tour } from '../lib/api';
import { api } from '../lib/api';
import { Preloader } from '../components/Preloader';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1493246232918-d78b97076ac9?q=80&w=2070&auto=format&fit=crop';

/* ─── Landmark Image Slider (mirrors SightseeingSlider from TourDetailsPage) ─── */
function LandmarkSlider({ items }: { items: NonNullable<Destination['landmarks']> }) {
  const [idx, setIdx] = useState(0);
  const [prog, setProg] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const MS = 4500;

  const go = useCallback((next: number) => { setIdx(next); setProg(0); }, []);

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

  const hasImages = items.some(l => l.imageUrl);

  if (!hasImages) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((lm, i) => (
          <div key={i} className="bg-white border border-outline-variant/20 rounded-2xl p-5 hover:shadow-md transition-shadow group">
            <div className="w-8 h-8 bg-surface-container-low rounded-full flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-on-surface-variant font-light text-lg">location_on</span>
            </div>
            <span className="text-[8px] font-black tracking-[0.4em] uppercase text-primary/60 mb-1 block">{lm.category}</span>
            <h4 className="text-lg font-light tracking-tighter italic mb-1">{lm.title}</h4>
            <p className="text-sm font-light text-on-surface-variant leading-relaxed opacity-60">{lm.description}</p>
          </div>
        ))}
      </div>
    );
  }

  const current = items[idx];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ── Main image with crossfade ── */}
      <div className="relative flex-1 overflow-hidden rounded-2xl bg-black shadow-md aspect-[16/9] lg:aspect-auto lg:h-[420px]">
        {items.map((lm, i) => lm.imageUrl && (
          <img key={i} src={lm.imageUrl} alt={lm.title}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === idx ? 'opacity-100' : 'opacity-0'}`} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Overlay info */}
        <div className="absolute bottom-0 inset-x-0 p-5">
          <span className="text-[8px] font-black tracking-[0.4em] uppercase text-primary/80 mb-1 block">{current.category}</span>
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

      {/* ── Thumbnail track ── */}
      <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:max-h-[420px] lg:w-56 shrink-0 pr-1">
        {items.map((lm, i) => (
          <button key={i} onClick={() => go(i)}
            className={`shrink-0 flex lg:flex items-center gap-3 rounded-xl border p-2 transition-all text-left ${
              i === idx ? 'border-black bg-black/5 shadow-sm' : 'border-outline-variant/20 hover:border-black/30'
            }`}>
            {lm.imageUrl ? (
              <img src={lm.imageUrl} alt={lm.title}
                className={`w-12 h-12 lg:w-10 lg:h-10 object-cover rounded-lg shrink-0 transition-all duration-300 ${i === idx ? 'grayscale-0' : 'grayscale opacity-50'}`} />
            ) : (
              <div className="w-12 h-12 lg:w-10 lg:h-10 bg-surface-container-low rounded-lg shrink-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-base font-light text-on-surface-variant">location_on</span>
              </div>
            )}
            <div className="hidden lg:block min-w-0">
              <p className={`text-xs font-semibold truncate ${i === idx ? 'text-black' : 'text-on-surface-variant'}`}>{lm.title}</p>
              <p className="text-[10px] text-on-surface-variant/50 font-light tracking-widest uppercase">{lm.category}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function DestinationDetailsPage() {
  const navigate  = useNavigate();
  const { id }    = useParams<{ id: string }>();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [tours, setTours]             = useState<Tour[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  useEffect(() => {
    if (!id) return;
    window.scrollTo(0, 0);
    Promise.all([api.getDestination(id), api.listTours()])
      .then(([dest, allTours]) => {
        setDestination(dest);
        setTours(allTours.filter(t => t.region === dest.region || t.region.includes(dest.name) || dest.name.includes(t.region)));
        setLoading(false);
      })
      .catch(err => { console.error(err); setError('Failed to load.'); setLoading(false); });
  }, [id]);

  if (loading) return <Preloader fullScreen />;

  if (error || !destination) return (
    <div className="h-screen flex flex-col items-center justify-center text-center px-8">
      <span className="material-symbols-outlined text-6xl text-primary/10 mb-6 block font-light">public_off</span>
      <h2 className="text-3xl font-light mb-5 tracking-tighter uppercase">Territory Missing</h2>
      <button className="bg-black text-white px-10 py-3 text-[10px] tracking-[0.4em] uppercase font-bold rounded-full hover:bg-primary transition-all"
        onClick={() => navigate('/destinations')}>Return to Registry</button>
    </div>
  );

  const landmarks = destination.landmarks || [];
  const gallery   = destination.galleryImages || [destination.heroImageUrl || DEFAULT_IMG];
  const seasons   = destination.seasonsHighlights || [];

  return (
    <div className="overflow-x-hidden w-full">
      <SEO title={`${destination.name} | JourneyFlicker`} description={destination.description || destination.essenceText} image={destination.heroImageUrl} />

      {/* ── 1. HEADER ── */}
      <section className="pt-24 md:pt-28 pb-8 px-4 sm:px-8 md:px-16 max-w-5xl mx-auto animate-reveal-up">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <nav className="flex flex-wrap items-center text-[9px] tracking-[0.3em] uppercase text-on-surface-variant font-bold">
            <span className="cursor-pointer hover:text-black transition-colors" onClick={() => navigate('/')}>Home</span>
            <span className="mx-3 text-outline-variant/30">/</span>
            <span className="cursor-pointer hover:text-black transition-colors" onClick={() => navigate('/destinations')}>Territories</span>
            <span className="mx-3 text-outline-variant/30">/</span>
            <span className="text-on-surface font-black opacity-40 truncate">{destination.name}</span>
          </nav>
          <button onClick={() => window.print()} className="no-print flex items-center gap-1.5 text-[9px] font-black tracking-[0.3em] uppercase bg-black/5 hover:bg-black hover:text-white transition-all px-4 py-2 rounded-full">
            <span className="material-symbols-outlined text-sm">print</span> Brochure
          </button>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="bg-black/5 px-4 py-1.5 rounded-full text-black text-[9px] font-black tracking-[0.3em] uppercase">{destination.region}</span>
              {destination.bestSeasonsMonths && (
                <span className="text-on-surface-variant/40 text-[9px] tracking-[0.3em] uppercase font-bold">
                  Best: {destination.bestSeasonsMonths}
                </span>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tighter leading-tight italic break-words">
              {destination.name}
            </h1>
          </div>

          {destination.essenceText && (
            <div className="w-full lg:max-w-xs bg-white border border-outline-variant/20 rounded-2xl p-5 shadow-sm shrink-0">
              <span className="text-[8px] font-black tracking-[0.4em] uppercase text-on-surface-variant/40 mb-2 block">Essence</span>
              <p className="text-base font-light font-serif italic text-on-surface leading-relaxed opacity-80">
                &ldquo;{destination.essenceText}&rdquo;
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── 2. HERO GALLERY ── */}
      <section className="px-4 sm:px-8 md:px-16 max-w-5xl mx-auto mb-12 animate-reveal-up">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[40vh] sm:h-[50vh] md:h-[55vh]">
          {/* Main image */}
          <div className="lg:col-span-2 overflow-hidden rounded-2xl relative bg-black shadow-sm group min-h-[200px]">
            <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-[5s] ease-out group-hover:scale-105 opacity-90"
              alt={destination.name} src={destination.heroImageUrl || DEFAULT_IMG} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute left-5 md:left-8 bottom-5 md:bottom-8 flex items-center gap-3">
              <div className="h-px w-8 bg-white/40" />
              <span className="text-white/50 text-[9px] tracking-[0.4em] uppercase font-black">Verified Territory Dossier</span>
            </div>
          </div>
          {/* Secondary images */}
          <div className="hidden lg:flex flex-col gap-4 h-full">
            <div className="flex-1 overflow-hidden rounded-2xl group relative bg-black shadow-sm">
              <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-[5s] group-hover:scale-110 opacity-70 group-hover:opacity-100 grayscale group-hover:grayscale-0"
                alt="Gallery 1" src={gallery[0] || DEFAULT_IMG} />
            </div>
            <div className="flex-1 overflow-hidden rounded-2xl group relative bg-black shadow-sm cursor-pointer">
              <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-[5s] group-hover:scale-110 opacity-70 group-hover:opacity-100 grayscale group-hover:grayscale-0"
                alt="Gallery 2" src={gallery[1] || gallery[0] || DEFAULT_IMG} />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                <span className="text-[9px] tracking-[0.4em] font-black uppercase border border-white/50 px-8 py-4 rounded-full">
                  {gallery.length} Photos
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. CONTENT ── */}
      <section className="px-4 sm:px-8 md:px-16 max-w-5xl mx-auto pb-16 md:pb-24">
        <div className="space-y-14 md:space-y-20">

          {/* ── 01. NARRATIVE ── */}
          <article className="animate-reveal-up">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[9px] font-black tracking-[0.4em] text-primary uppercase">01.</span>
              <div className="h-px bg-outline-variant/30 w-14" />
              <h2 className="text-[10px] font-black tracking-[0.6em] uppercase text-on-surface">The Philosophy</h2>
            </div>
            <div className="pl-0 sm:pl-10">
              <p className="text-2xl sm:text-3xl md:text-4xl font-light leading-tight text-on-surface tracking-tighter italic opacity-90 break-words max-w-3xl font-serif">
                &ldquo;{destination.description}&rdquo;
              </p>
            </div>
          </article>

          {/* ── 02. ICONIC LANDMARKS SLIDER ── */}
          {landmarks.length > 0 && (
            <section className="animate-reveal-up">
              <div className="flex items-center gap-4 mb-8">
                <span className="text-[9px] font-black tracking-[0.4em] text-primary uppercase">02.</span>
                <div className="h-px bg-outline-variant/30 w-14" />
                <h2 className="text-[10px] font-black tracking-[0.6em] uppercase text-on-surface">Iconic Landmarks</h2>
              </div>
              <div className="pl-0 sm:pl-10">
                <LandmarkSlider items={landmarks} />
              </div>
            </section>
          )}

          {/* ── 03. SEASONAL RHYTHMS ── */}
          {(seasons.length > 0 || destination.bestSeasonsMonths) && (
            <section className="animate-reveal-up">
              <div className="flex items-center gap-4 mb-8">
                <span className="text-[9px] font-black tracking-[0.4em] text-primary uppercase">03.</span>
                <div className="h-px bg-outline-variant/30 w-14" />
                <h2 className="text-[10px] font-black tracking-[0.6em] uppercase text-on-surface">Seasonal Rhythms</h2>
              </div>
              <div className="pl-0 sm:pl-10">
                <div className="bg-black rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    {/* Best season window */}
                    <div className="p-7 border-b lg:border-b-0 lg:border-r border-white/5">
                      <span className="text-[8px] font-black tracking-[0.5em] uppercase text-white/30 block mb-3">Optimal Window</span>
                      {destination.bestSeasonsTitle && (
                        <span className="text-[9px] font-black tracking-[0.4em] uppercase text-primary/80 block mb-2">{destination.bestSeasonsTitle}</span>
                      )}
                      <p className="text-3xl font-light text-white tracking-tighter">
                        {destination.bestSeasonsMonths}
                      </p>
                      <p className="text-xs text-white/30 font-light mt-3 leading-relaxed italic">
                        Understanding this territory requires precise timing. Our curators monitor localised conditions year-round.
                      </p>
                    </div>
                    {/* Season cards */}
                    {seasons.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/5">
                        {seasons.map((s, i) => (
                          <div key={i} className="bg-black p-6 hover:bg-white/5 transition-colors group">
                            <span className="text-[9px] font-black tracking-[0.3em] text-primary uppercase mb-3 block group-hover:translate-x-1 transition-transform">{s.season}</span>
                            <p className="text-sm font-light leading-relaxed text-white/50 group-hover:text-white/80 transition-colors">{s.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── 04. VISUAL ARCHIVE ── */}
          {gallery.length > 0 && (
            <section className="animate-reveal-up">
              <div className="flex items-center gap-4 mb-8">
                <span className="text-[9px] font-black tracking-[0.4em] text-primary uppercase">04.</span>
                <div className="h-px bg-outline-variant/30 w-14" />
                <h2 className="text-[10px] font-black tracking-[0.6em] uppercase text-on-surface">The Archive</h2>
              </div>
              <div className="pl-0 sm:pl-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {gallery.map((img, i) => (
                  <div key={i}
                    className={`overflow-hidden rounded-xl group relative bg-black shadow-sm ${i === 0 ? 'col-span-2 row-span-2 aspect-square sm:aspect-auto sm:h-60' : 'aspect-square'}`}>
                    <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-[4s] ease-out group-hover:scale-105 grayscale group-hover:grayscale-0"
                      alt={`Archive ${i + 1}`} src={img} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 05. ASSOCIATED TOURS ── */}
          {tours.length > 0 && (
            <section className="animate-reveal-up">
              <div className="flex items-center gap-4 mb-8">
                <span className="text-[9px] font-black tracking-[0.4em] text-primary uppercase">05.</span>
                <div className="h-px bg-outline-variant/30 w-14" />
                <h2 className="text-[10px] font-black tracking-[0.6em] uppercase text-on-surface">Associated Expeditions</h2>
              </div>
              <div className="pl-0 sm:pl-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                  {tours.map((tour, i) => (
                    <div key={tour.id}
                      className="group cursor-pointer animate-reveal-up"
                      style={{ animationDelay: `${i * 0.07}s` }}
                      onClick={() => navigate(`/tours/${tour.id}`)}>
                      <div className="aspect-[4/3] overflow-hidden rounded-2xl mb-3 relative shadow-sm group-hover:shadow-lg transition-all duration-500 bg-black border border-outline-variant/10">
                        <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-[4s] ease-out group-hover:scale-105 opacity-90 mix-blend-luminosity group-hover:mix-blend-normal"
                          alt={tour.name} src={tour.heroImageUrl || DEFAULT_IMG} />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow border border-black/5">
                          <span className="text-[9px] font-black tracking-[0.3em] text-black uppercase">{tour.days} Days</span>
                        </div>
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/0 group-hover:bg-white/20 border border-white/0 group-hover:border-white/30 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur">
                          <span className="material-symbols-outlined text-base font-light">arrow_outward</span>
                        </div>
                      </div>
                      <div className="px-0.5">
                        <span className="text-[9px] font-black tracking-[0.3em] uppercase text-primary/60 mb-0.5 block">{tour.category}</span>
                        <h3 className="text-lg font-light tracking-tighter mb-1 group-hover:text-primary transition-colors duration-300 italic">{tour.name}</h3>
                        <p className="text-xs font-light text-on-surface-variant opacity-60 line-clamp-2 leading-relaxed">{tour.overviewDescription}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/tours')}
                  className="inline-flex items-center gap-2 text-[9px] font-black tracking-[0.4em] uppercase border-b border-black pb-1.5 hover:text-primary transition-all">
                  View Full Portfolio <span className="material-symbols-outlined font-light text-sm">east</span>
                </button>
              </div>
            </section>
          )}

          {/* ── INQUIRY CTA ── */}
          <div className="bg-black rounded-2xl p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 animate-reveal-up">
            <div>
              <span className="text-[9px] font-black tracking-[0.6em] uppercase text-white/30 block mb-2">Plan Your Visit</span>
              <h3 className="text-2xl font-light tracking-tighter mb-1">
                Ready to <span className="font-serif italic text-white/70">explore?</span>
              </h3>
              <p className="text-xs text-white/40 font-light">Our territory curators respond within 24 hours.</p>
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
