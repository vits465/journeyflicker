import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Destination, Tour } from '../lib/api';
import { api } from '../lib/api';
import { HeroSlider, type HeroSlide } from '../components/HeroSlider';
import { useHeroSettings } from '../lib/heroSettings';

const FALLBACK = "https://images.unsplash.com/photo-1493246232918-d78b97076ac9?q=80&w=2070&auto=format&fit=crop";

// ── Static data for informational sections ──
const STEPS = [
  { step: '01', icon: 'search', title: 'Discover', body: 'Browse our curated registry of verified sanctuaries, handpicked by field curators who live inside their territories.' },
  { step: '02', icon: 'edit_note', title: 'Personalise', body: 'Select your expedition type — luxury, adventure, cultural immersion, or a bespoke private curation designed from scratch.' },
  { step: '03', icon: 'support_agent', title: 'Consult', body: 'A 1-on-1 curator audit aligns your sensory preferences, budget and timing with the perfect departure window.' },
  { step: '04', icon: 'flight_takeoff', title: 'Depart', body: 'Every logistical detail is handled — transport, private access, accommodation — so you arrive with nothing but presence.' },
];

const EXPERIENCE_TYPES = [
  { icon: 'hotel', label: 'Luxury Retreats',    desc: 'Ultra-private properties with editorial-grade service and architectural brilliance.',            img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop' },
  { icon: 'terrain', label: 'Wilderness Expeditions', desc: 'From Arctic tundra to Saharan dunes — raw landscapes accessed by invitation only.',           img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop' },
  { icon: 'museum', label: 'Cultural Immersion', desc: 'Private access to living heritage, local gastronomy and artisan traditions across global territories.', img: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=800&auto=format&fit=crop' },
  { icon: 'sailing', label: 'Ocean & Coastal',   desc: 'Yacht charters, island archipelagos and coastal village circuits along the world\'s most scenic shorelines.', img: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=800&auto=format&fit=crop' },
  { icon: 'restaurant', label: 'Culinary Journeys', desc: 'Michelin-adjacent dining itineraries woven into local farms, wineries and private chef experiences.',  img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop' },
  { icon: 'spa', label: 'Wellness & Silence',  desc: 'Restorative escapes designed around thermal springs, high-altitude meditation and bio-rhythmic rest.',   img: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=800&auto=format&fit=crop' },
];

const TESTIMONIALS = [
  { quote: 'JourneyFlicker transformed what I thought travel could be. Every detail was calibrated to perfection — from the private villa to the dawn safari access. Unparalleled.', author: 'Alexandra M.', role: 'Creative Director, London', rating: 5 },
  { quote: 'As someone who has visited 60+ countries, it is rare to find a curator that actually surprises you. JourneyFlicker managed it on our Patagonia expedition. Extraordinary.', author: 'Richard T.', role: 'Architect, New York', rating: 5 },
  { quote: 'The Bespoke Curation service delivered a cultural itinerary through Japan that no guidebook could ever replicate. The private temple access alone was worth every moment.', author: 'Isabelle F.', role: 'Art Collector, Paris', rating: 5 },
];

const PRESS = ['Travel + Leisure', 'Condé Nast Traveller', 'Forbes Life', 'The New York Times', 'Monocle', 'Wallpaper*'];

import { useSearch } from '../lib/searchContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { openSearch } = useSearch();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const heroIds = useHeroSettings('home');

  useEffect(() => {
    Promise.all([api.listDestinations(), api.listTours()])
      .then(([d, t]) => { setDestinations(d || []); setTours(t || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const heroSlides: HeroSlide[] = (() => {
    if (loading) return [];
    const pool = heroIds.length > 0
      ? heroIds.map(id => destinations.find(d => d.id === id)).filter(Boolean) as Destination[]
      : destinations.slice(0, 5);
    if (!pool.length) return [{ id: 'fallback', imageUrl: FALLBACK, title: 'Journey Beyond.', subtitle: 'A curated index of the most evocative landscapes for the selective voyager.', tag: 'Global Intelligence Bureau' }];
    return pool.map(d => ({ id: d.id, imageUrl: d.heroImageUrl || FALLBACK, title: d.name, subtitle: d.essenceText || d.description?.slice(0, 100), tag: d.region, href: `/destinations/${d.id}` }));
  })();

  return (
    <>
      {/* ────────────────────────── 1. HERO ────────────────────────── */}
      <HeroSlider slides={heroSlides} loading={loading} autoPlayMs={5500} height="h-screen min-h-[560px] max-h-[900px]" hideSlideText={true}>
        <div className="flex flex-col items-center text-center w-full px-4 pt-16">
          <div className="border border-white/20 rounded-full px-5 py-2 mb-5 backdrop-blur-md bg-white/10 inline-block">
            <span className="text-white/70 text-[9px] tracking-[0.5em] uppercase font-black">Global Intelligence Bureau</span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl text-white tracking-tighter leading-[0.88] font-light drop-shadow-2xl mb-2">
            Journey<br/><span className="italic font-serif text-white/90">Beyond.</span>
          </h1>
          {heroSlides.length > 0 && heroSlides[0].id !== 'fallback' && (
            <p className="text-white/40 text-xs font-black tracking-[0.5em] uppercase mt-3 mb-5">
              Now Featuring: <span className="text-white/70">{heroSlides[0]?.title}</span>
            </p>
          )}
          <div 
            className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-2xl sm:rounded-full w-full max-w-2xl flex flex-col sm:flex-row items-stretch p-2 gap-2 shadow-2xl hover:bg-white/15 transition-all duration-500 mt-4 cursor-pointer"
            onClick={openSearch}
          >
            <div className="flex-1 px-4 py-2.5 text-left sm:border-r border-white/20">
              <label className="text-white/50 text-[9px] tracking-[0.4em] font-black uppercase block mb-0.5">Search Territory</label>
              <div className="text-white/30 text-sm font-light">Where to next?</div>
            </div>
            <div className="flex-1 px-4 py-2.5 text-left hidden sm:block">
              <label className="text-white/50 text-[9px] tracking-[0.4em] font-black uppercase block mb-0.5">Protocol</label>
              <div className="text-white/30 text-sm font-light">Private Expedition</div>
            </div>
            <button
              className="bg-white text-black px-6 py-2.5 rounded-xl sm:rounded-full text-[10px] uppercase tracking-[0.4em] font-black hover:bg-primary hover:text-white transition-all duration-300 flex items-center justify-center gap-2 shrink-0 mx-1">
              Access <span className="material-symbols-outlined text-sm font-light">arrow_outward</span>
            </button>
          </div>
        </div>
      </HeroSlider>

      {/* ────────────────────────── 2. LIVE STATS ────────────────────────── */}
      <section className="bg-black text-white border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
          {[
            { value: loading ? '—' : `${destinations.length}+`, label: 'Verified Territories', icon: 'public' },
            { value: loading ? '—' : `${tours.length}+`,        label: 'Active Expeditions',  icon: 'luggage' },
            { value: '4.9',                                      label: 'Avg Client Rating',   icon: 'star' },
            { value: '24h',                                      label: 'Curator Response',     icon: 'schedule' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center py-7 px-4 group hover:bg-white/5 transition-colors duration-300">
              <span className="material-symbols-outlined text-primary/60 text-2xl mb-2 group-hover:text-primary transition-colors font-light">{stat.icon}</span>
              <span className="text-3xl sm:text-4xl font-light tracking-tighter text-white leading-none">{stat.value}</span>
              <span className="text-[9px] font-black tracking-[0.4em] uppercase text-white/30 mt-2">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────────────── 3. TERRITORIES GRID ────────────────────────── */}
      <section className="w-full py-14 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-10 pb-6 border-b border-outline-variant/20 animate-reveal-up">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px bg-primary w-8" />
                <span className="text-primary text-[10px] font-black tracking-[0.5em] uppercase">Global Directory</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-light tracking-tighter leading-tight italic">Territories</h2>
            </div>
            <button onClick={() => navigate('/destinations')}
              className="text-[10px] font-black tracking-[0.4em] uppercase border-b border-primary pb-1.5 hover:text-primary transition-all flex items-center gap-2 shrink-0">
              Full Archive <span className="material-symbols-outlined font-light text-sm">east</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading
              ? [1,2,3].map(i => <div key={i} className="animate-pulse bg-surface-container-low aspect-[4/5] rounded-2xl" />)
              : destinations.slice(0, 6).map(dest => (
                <div key={dest.id}
                  className="group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer aspect-[4/5]"
                  onClick={() => navigate(`/destinations/${dest.id}`)}>
                  <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-[4s] ease-out group-hover:scale-105 grayscale group-hover:grayscale-0"
                    alt={dest.name} src={dest.heroImageUrl || FALLBACK} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent flex flex-col justify-end p-5">
                    <span className="text-white text-[9px] font-black tracking-[0.5em] uppercase bg-black/40 backdrop-blur-sm self-start px-3 py-1 rounded-full border border-white/20 mb-2">{dest.region}</span>
                    <h3 className="text-2xl font-light text-white tracking-tighter font-serif italic">{dest.name}</h3>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </section>

      {/* ────────────────────────── 4. HOW IT WORKS ────────────────────────── */}
      <section className="py-14 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-surface-container-low border-t border-outline-variant/10">
        <div className="max-w-6xl mx-auto">
          {/* Heading */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16 animate-reveal-up">
            <div>
              <span className="text-primary text-[10px] font-black tracking-[0.6em] uppercase mb-3 block">The Process</span>
              <h2 className="text-4xl sm:text-5xl font-light tracking-tighter leading-tight">
                How We <span className="italic font-serif">Curate.</span>
              </h2>
            </div>
            <p className="text-sm font-light text-on-surface-variant opacity-60 max-w-sm leading-relaxed md:text-right">
              From first inquiry to departure gate, our curators manage every dimension of your journey.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="group bg-white rounded-2xl p-6 md:p-7 border border-outline-variant/10 shadow-sm hover:shadow-lg transition-all duration-500 flex flex-col gap-4 animate-reveal-up relative overflow-hidden"
                style={{ animationDelay: `${i * 0.08}s` }}>
                {/* Step number (decorative bg) */}
                <span className="absolute top-4 right-4 text-5xl font-black text-outline-variant/10 select-none group-hover:text-outline-variant/20 transition-colors duration-500 leading-none">{s.step}</span>
                {/* Icon */}
                <div className="w-11 h-11 rounded-xl bg-black group-hover:bg-primary transition-colors duration-500 flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-white font-light text-xl">{s.icon}</span>
                </div>
                {/* Content */}
                <div>
                  <h3 className="text-lg font-semibold tracking-tight mb-2">{s.title}</h3>
                  <p className="text-sm font-light text-on-surface-variant leading-relaxed opacity-70">{s.body}</p>
                </div>
                {/* Connector arrow (not on last) */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white rounded-full border border-outline-variant/20 items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-on-surface-variant/40 text-sm">chevron_right</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-10 text-center animate-reveal-up">
            <button onClick={() => navigate('/contact')}
              className="inline-flex items-center gap-3 bg-black text-white px-8 py-3 rounded-full text-[10px] font-black tracking-[0.4em] uppercase hover:bg-primary transition-all duration-300 shadow-lg">
              Start Your Inquiry <span className="material-symbols-outlined text-sm font-light">arrow_outward</span>
            </button>
          </div>
        </div>
      </section>

      {/* ────────────────────────── 5. EXPERIENCE CATEGORIES ────────────────────────── */}
      <section className="py-14 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center mb-10 md:mb-14 animate-reveal-up">
            <span className="text-primary text-[10px] font-black tracking-[0.6em] uppercase mb-3 block">Curated Formats</span>
            <h2 className="text-4xl sm:text-5xl font-light tracking-tighter leading-tight mb-3">
              Experience <span className="italic font-serif">Categories.</span>
            </h2>
            <p className="text-sm font-light text-on-surface-variant opacity-60 max-w-md leading-relaxed">
              Each format follows a distinct editorial philosophy, designed for a specific kind of traveller.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {EXPERIENCE_TYPES.map((exp, i) => (
              <div key={i}
                className="group relative overflow-hidden rounded-2xl cursor-pointer h-52 sm:h-56 border border-outline-variant/5 shadow-sm hover:shadow-xl transition-all duration-500 animate-reveal-up"
                style={{ animationDelay: `${(i % 3) * 0.07}s` }}
                onClick={() => navigate('/tours')}>
                {/* Background image */}
                <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-[4s] ease-out group-hover:scale-105 grayscale group-hover:grayscale-0"
                  src={exp.img} alt={exp.label} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-white font-light text-base">{exp.icon}</span>
                    </div>
                    <h3 className="text-base font-semibold text-white tracking-tight leading-tight">{exp.label}</h3>
                  </div>
                  <p className="text-xs font-light text-white/60 leading-relaxed line-clamp-2 group-hover:text-white/90 transition-colors duration-500">{exp.desc}</p>
                </div>

                {/* Hover arrow */}
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/0 group-hover:bg-white/20 backdrop-blur border border-white/0 group-hover:border-white/30 flex items-center justify-center transition-all duration-500 text-white opacity-0 group-hover:opacity-100">
                  <span className="material-symbols-outlined text-sm font-light">arrow_outward</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────── 6. PARALLAX SEPARATOR ────────────────────────── */}
      <section className="h-36 sm:h-48 w-full relative bg-black flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-cover bg-fixed bg-center grayscale"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?q=80&w=2070&auto=format&fit=crop')" }} />
        <h2 className="relative z-10 text-white font-light text-2xl sm:text-4xl tracking-tighter text-center font-serif italic">
          Elevate Your Standard.
        </h2>
      </section>

      {/* ────────────────────────── 7. SIGNATURE EXPEDITIONS ────────────────────────── */}
      <section className="py-14 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-surface-container-low">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center mb-10 md:mb-14 animate-reveal-up">
            <span className="text-primary text-[10px] font-black tracking-[0.7em] uppercase mb-3 block">The Portfolio</span>
            <h2 className="text-4xl sm:text-5xl font-light tracking-tighter leading-tight mb-3">
              Signature<br/><span className="italic font-serif">Expeditions.</span>
            </h2>
            <div className="h-px bg-outline-variant/30 w-24" />
          </div>
          <div className="flex flex-col gap-10 md:gap-14">
            {loading
              ? [1,2,3].map(i => (
                <div key={i} className="flex flex-col lg:flex-row gap-7 animate-pulse">
                  <div className="w-full lg:w-3/5 aspect-[4/3] bg-surface-container-low rounded-2xl" />
                  <div className="w-full lg:w-2/5 space-y-3">
                    <div className="h-3 bg-surface-container-low rounded w-1/3" />
                    <div className="h-6 bg-surface-container-low rounded w-3/4" />
                    <div className="h-3 bg-surface-container-low rounded w-full" />
                  </div>
                </div>
              ))
              : tours.slice(0, 3).map((tour, idx) => (
                <div key={tour.id}
                  className={`flex flex-col ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-7 lg:gap-14 group cursor-pointer animate-reveal-up`}
                  onClick={() => navigate(`/tours/${tour.id}`)}>
                  <div className="w-full lg:w-3/5 overflow-hidden rounded-2xl shadow-sm group-hover:shadow-2xl transition-all duration-700 relative aspect-[4/3] bg-black">
                    <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-[5s] ease-out group-hover:scale-105 opacity-80 group-hover:opacity-100"
                      alt={tour.name} src={tour.heroImageUrl || FALLBACK} />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-1.5 rounded-full shadow-lg">
                      <span className="text-[9px] font-black tracking-[0.4em] text-black uppercase">{tour.days} DAYS</span>
                    </div>
                  </div>
                  <div className="w-full lg:w-2/5 flex flex-col items-start">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-black/5 px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.4em] uppercase">No. {String(idx+1).padStart(2,'00')}</span>
                      <span className="text-on-surface-variant text-[9px] tracking-[0.3em] uppercase font-bold">{tour.category}</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-light leading-tight tracking-tighter mb-3 group-hover:text-primary transition-colors duration-500 italic">{tour.name}</h3>
                    <p className="text-sm font-light text-on-surface-variant leading-relaxed mb-5 opacity-70">{tour.overviewDescription}</p>
                    <div className="flex items-center gap-2 text-[9px] font-black tracking-[0.4em] uppercase border-b-2 border-black pb-1.5 hover:translate-x-1 transition-transform duration-300">
                      Read Dossier <span className="material-symbols-outlined text-sm font-light">arrow_forward</span>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>

          {tours.length > 0 && (
            <div className="text-center mt-12 animate-reveal-up">
              <button onClick={() => navigate('/tours')}
                className="inline-flex items-center gap-2 border-2 border-black text-black px-8 py-3 rounded-full text-[10px] font-black tracking-[0.4em] uppercase hover:bg-black hover:text-white transition-all duration-300">
                View Full Portfolio <span className="material-symbols-outlined font-light text-sm">east</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ────────────────────────── 8. TESTIMONIALS ────────────────────────── */}
      <section className="py-14 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-black text-white border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14 animate-reveal-up">
            <div>
              <span className="text-primary text-[10px] font-black tracking-[0.6em] uppercase mb-3 block">Client Registry</span>
              <h2 className="text-4xl sm:text-5xl font-light tracking-tighter leading-tight text-white">
                Voices from the<br/><span className="italic font-serif text-white/80">Field.</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 self-start md:self-end">
              {[1,2,3,4,5].map(s => (
                <span key={s} className="material-symbols-outlined text-primary font-light text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              ))}
              <span className="text-white/40 text-xs font-black tracking-widest ml-2">5.0 / 5.0</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-7 flex flex-col gap-5 hover:bg-white/10 transition-all duration-500 group animate-reveal-up"
                style={{ animationDelay: `${i * 0.1}s` }}>
                {/* Stars */}
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className="material-symbols-outlined text-primary text-base font-light" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                {/* Quote */}
                <p className="text-sm font-light text-white/70 leading-relaxed italic flex-1 group-hover:text-white/90 transition-colors duration-500">
                  &ldquo;{t.quote}&rdquo;
                </p>
                {/* Author */}
                <div className="flex items-center gap-3 border-t border-white/10 pt-5">
                  <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white/40 font-light text-lg">person</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.author}</p>
                    <p className="text-[9px] font-black tracking-widest uppercase text-white/30">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────── 9. PRESS MENTIONS ────────────────────────── */}
      <section className="py-8 sm:py-10 px-4 sm:px-8 md:px-16 bg-surface-container-lowest border-t border-outline-variant/10">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-[9px] font-black tracking-[0.6em] uppercase text-on-surface-variant/30 mb-6">As Featured In</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {PRESS.map((pub, i) => (
              <span key={i}
                className="text-sm sm:text-base font-light tracking-widest text-on-surface-variant/25 hover:text-on-surface-variant/70 transition-colors duration-300 cursor-default select-none italic">
                {pub}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────── 10. NEWSLETTER ────────────────────────── */}
      <section className="py-14 sm:py-20 px-4 sm:px-8 md:px-16 bg-black text-white border-t border-white/10">
        <div className="max-w-xl mx-auto py-10 px-6 border border-white/10 bg-white/[0.03] rounded-2xl animate-reveal-up">
          <span className="text-white/40 text-[10px] font-black tracking-[0.8em] uppercase mb-3 block">Global Intel</span>
          <h2 className="text-3xl sm:text-4xl font-light mb-3 tracking-tighter">
            Secure Your<br/><span className="italic font-serif opacity-80">Access.</span>
          </h2>
          <p className="text-white/50 font-light mb-6 text-sm leading-relaxed">
            A weekly dispatch of undocumented travel inspiration. Strictly confidential.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <input type="email" placeholder="Your Email Address"
              className="flex-grow px-5 py-3 rounded-xl sm:rounded-full border border-white/20 focus:border-white focus:ring-0 bg-transparent text-white text-sm font-light outline-none placeholder:text-white/30" />
            <button className="bg-white text-black px-6 py-3 rounded-xl sm:rounded-full text-[10px] font-black tracking-[0.4em] uppercase hover:bg-primary hover:text-white transition-all shrink-0">
              Incept
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
