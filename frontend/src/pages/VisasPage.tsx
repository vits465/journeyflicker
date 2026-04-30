import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Visa } from '../lib/api';
import { api } from '../lib/api';
import { useAllHeroSettings } from '../lib/heroSettings';
import { Preloader } from '../components/Preloader';
import { HeroSlider } from '../components/HeroSlider';
import { SEO } from '../components/SEO';

const diffColor = (d: string) =>
  d === 'Easy'
    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    : d === 'Moderate'
      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
      : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800';

const diffDot = (d: string) =>
  d === 'Easy' ? 'bg-emerald-400' : d === 'Moderate' ? 'bg-amber-400' : 'bg-rose-400';

const DEFAULT_VISA_BG =
  'https://images.unsplash.com/photo-1544016768-982d1554f0b9?q=80&w=1974&auto=format&fit=crop';

// ── Individual accordion item for a single requirement ──────────────────────
function RequirementAccordion({
  label,
  index,
}: {
  label: string;
  index: number;
}) {
  const [open, setOpen] = useState(false);

  // Split into a short title and optional detail
  const parts = label.split(':');
  const title = parts[0]?.trim() ?? label;
  const detail = parts.slice(1).join(':').trim();

  return (
    <div
      className={`rounded-xl border transition-all duration-300 overflow-hidden ${open
          ? 'border-primary/25 dark:border-white/20 bg-primary/[0.03] dark:bg-white/[0.04]'
          : 'border-outline-variant/10 dark:border-white/8 bg-white/60 dark:bg-white/[0.02]'
        }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left group/req"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-colors duration-300 ${open
                ? 'bg-primary text-white dark:bg-white dark:text-black'
                : 'bg-surface-container-low dark:bg-white/10 text-on-surface-variant dark:text-white/50'
              }`}
          >
            {index + 1}
          </span>
          <span className={`text-sm tracking-tight transition-all duration-300 ${open ? 'font-bold text-on-surface dark:text-white' : 'font-medium text-on-surface/80 dark:text-white/70 truncate'}`}>
            {title}
          </span>
        </div>
        <span
          className={`material-symbols-outlined text-base shrink-0 transition-all duration-300 ${open
              ? 'rotate-180 text-primary dark:text-white'
              : 'text-on-surface-variant/40 dark:text-white/30'
            }`}
        >
          expand_more
        </span>
      </button>

      {/* Expanded detail — shown when there's extra text OR always opens to confirm */}
      <div
        className={`transition-all duration-500 ease-in-out ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          } overflow-hidden`}
      >
        <div className="px-4 pb-4 pt-0">
          <p className="text-xs font-light text-on-surface-variant dark:text-white/55 leading-relaxed border-l-2 border-primary/20 dark:border-white/15 pl-4 ml-2">
            {detail || label}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Visa Card ────────────────────────────────────────────────────────────────
function VisaCard({ visa, index }: { visa: Visa; index: number }) {
  const [docsOpen, setDocsOpen] = useState(false);
  const [reqsOpen, setReqsOpen] = useState(false);

  const requirements = Array.isArray(visa?.requirements)
    ? visa.requirements
    : [];
  const documents = Array.isArray(visa?.documents)
    ? visa.documents
    : [];

  return (
    <div
      className="group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-outline-variant/10 dark:border-white/5 bg-surface dark:bg-white/[0.03] flex flex-col h-full"
      style={{ animationDelay: `${(index % 3) * 0.08}s` }}
    >
      {/* ── Hero Image or Plain Header ── */}
      {visa?.heroImageUrl ? (
        <div className="relative h-48 overflow-hidden flex-shrink-0">
          <img
            src={visa.heroImageUrl}
            alt={visa?.country ?? 'Visa'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/80" />
          <span
            className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[9px] font-bold tracking-[0.2em] border ${diffColor(
              visa?.difficulty ?? ''
            )}`}
          >
            {visa?.difficulty ?? '—'}
          </span>
          <h3 className="absolute bottom-4 left-5 text-white text-3xl font-light tracking-tighter drop-shadow-md">
            {visa?.country ?? 'Unknown'}
          </h3>
        </div>
      ) : (
        <div className="px-6 pt-6 pb-4 border-b border-outline-variant/10 dark:border-white/5 bg-surface-container-lowest dark:bg-white/5">
          <div className="flex justify-between items-start mb-3">
            <div className="w-12 h-12 bg-surface-container-low dark:bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-primary dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all duration-500">
              <span className="material-symbols-outlined font-light text-2xl">public</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-[0.2em] border ${diffColor(
                visa?.difficulty ?? ''
              )}`}
            >
              {visa?.difficulty ?? '—'}
            </span>
          </div>
          <h3 className="text-3xl font-light tracking-tighter group-hover:text-primary dark:group-hover:text-white transition-colors dark:text-white">
            {visa?.country ?? 'Unknown'}
          </h3>
        </div>
      )}

      {/* ── Body ── */}
      <div className="px-6 py-6 flex-1 flex flex-col gap-5">
        {/* Type + Description */}
        <div>
          {visa?.visaType && (
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-on-surface-variant/50 dark:text-white/30 mb-1.5 block">
              {visa.visaType}
            </span>
          )}
          {visa?.description && (
            <p className="text-sm font-light text-on-surface-variant dark:text-white/60 leading-relaxed">
              {visa.description}
            </p>
          )}
        </div>

        {/* ── Documents accordion panel ── */}
        {documents.length > 0 && (
          <div
            className={`rounded-2xl border transition-all duration-500 overflow-hidden ${docsOpen
                ? 'border-primary/20 dark:border-white/15 bg-primary/[0.02] dark:bg-white/[0.02]'
                : 'border-outline-variant/10 dark:border-white/5 bg-surface-container-lowest dark:bg-white/5'
              }`}
          >
            <button
              onClick={() => setDocsOpen(!docsOpen)}
              className="w-full px-5 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-base text-primary/60 dark:text-white/40 font-light">
                  description
                </span>
                <span className="text-[10px] font-black tracking-[0.35em] uppercase text-on-surface-variant/60 dark:text-white/40">
                  Documentation
                </span>
                <span className="text-[9px] font-bold bg-primary/10 dark:bg-white/10 text-primary dark:text-white px-2 py-0.5 rounded-full">
                  {documents.length}
                </span>
              </div>
              <div
                className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300 ${docsOpen
                    ? 'bg-primary dark:bg-white text-white dark:text-black border-primary dark:border-white'
                    : 'border-outline-variant/20 dark:border-white/15'
                  }`}
              >
                <span
                  className={`material-symbols-outlined text-sm transition-transform duration-300 ${docsOpen ? 'rotate-180' : ''
                    }`}
                >
                  expand_more
                </span>
              </div>
            </button>
            <div
              className={`transition-all duration-500 ease-[cubic-bezier(0.2,1,0.3,1)] overflow-hidden ${docsOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
              <ul className="px-5 pb-5 pt-1 space-y-2.5">
                {documents.map((doc, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm font-light text-on-surface-variant dark:text-white/60 leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-[7px] shrink-0" />
                    {doc ?? '—'}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── Requirements — individual accordion items ── */}
        {requirements.length > 0 && (
          <div
            className={`rounded-2xl border transition-all duration-500 overflow-hidden ${reqsOpen
                ? 'border-primary/20 dark:border-white/15'
                : 'border-outline-variant/10 dark:border-white/5'
              }`}
          >
            {/* Section header toggle */}
            <button
              onClick={() => setReqsOpen(!reqsOpen)}
              className="w-full px-5 py-4 flex items-center justify-between bg-surface-container-lowest dark:bg-white/[0.03]"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-base text-primary/60 dark:text-white/40 font-light">
                  checklist
                </span>
                <span className="text-[10px] font-black tracking-[0.35em] uppercase text-on-surface-variant/60 dark:text-white/40">
                  Critical Requirements
                </span>
                <span className="text-[9px] font-bold bg-primary/10 dark:bg-white/10 text-primary dark:text-white px-2 py-0.5 rounded-full">
                  {requirements.length}
                </span>
              </div>
              <div
                className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300 ${reqsOpen
                    ? 'bg-primary dark:bg-white text-white dark:text-black border-primary dark:border-white'
                    : 'border-outline-variant/20 dark:border-white/15'
                  }`}
              >
                <span
                  className={`material-symbols-outlined text-sm transition-transform duration-300 ${reqsOpen ? 'rotate-180' : ''
                    }`}
                >
                  expand_more
                </span>
              </div>
            </button>

            {/* Accordion list of requirements */}
            <div
              className={`transition-all duration-500 ease-[cubic-bezier(0.2,1,0.3,1)] overflow-hidden ${reqsOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
              <div className="px-4 py-4 space-y-2">
                {requirements.map((req, i) => (
                  <RequirementAccordion key={i} label={req ?? '—'} index={i} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Footer: Processing & Fee ── */}
        <div className="mt-auto pt-5 border-t border-outline-variant/10 dark:border-white/5 grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest dark:bg-white/5 p-3 rounded-2xl border border-outline-variant/10 dark:border-white/10 text-center">
            <span className="text-[9px] text-on-surface-variant dark:text-white/40 uppercase font-bold tracking-widest block mb-1 opacity-60">
              Processing
            </span>
            <span className="text-sm font-semibold text-on-surface dark:text-white">
              {visa?.processing ?? '—'}
            </span>
          </div>
          <div className="bg-surface-container-lowest dark:bg-white/5 p-3 rounded-2xl border border-outline-variant/10 dark:border-white/10 text-center">
            <span className="text-[9px] text-on-surface-variant dark:text-white/40 uppercase font-bold tracking-widest block mb-1 opacity-60">
              Fee
            </span>
            <span className="text-sm font-semibold text-on-surface dark:text-white">
              {visa?.fee ?? '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Filter Bar ───────────────────────────────────────────────────────────────
const FILTERS = ['All', 'Easy', 'Moderate', 'Challenging'];

export default function VisasPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [visas, setVisas] = useState<Visa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const { settings } = useAllHeroSettings();

  const bannerImage = settings?.visaBanner ?? DEFAULT_VISA_BG;

  useEffect(() => {
    const fetchVisas = () => {
      api
        .listVisas()
        .then(data => {
          setVisas(data ?? []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    fetchVisas();
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') fetchVisas();
    }, 30000);

    const onFocus = () => {
      if (document.visibilityState === 'visible') fetchVisas();
    };
    window.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const filtered = visas.filter(
    v =>
      (filter === 'All' || v.difficulty === filter) &&
      (search === '' ||
        (v.country ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  const heroSlides = useMemo(() => {
    const validVisas = visas.filter(v => v.heroImageUrl);
    const defaults = [
      { id: '1', imageUrl: bannerImage, title: 'Visa Intelligence' },
      {
        id: '2',
        imageUrl:
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop',
        title: 'Global Movement',
      },
      {
        id: '3',
        imageUrl:
          'https://images.unsplash.com/photo-1493246232918-d78b97076ac9?q=80&w=2070&auto=format&fit=crop',
        title: 'Borderless Strategy',
      },
    ];

    if (loading) return defaults;

    const result = validVisas
      .slice(0, 5)
      .map(v => ({ id: v.id, imageUrl: v.heroImageUrl!, title: v.country }));

    let i = 0;
    while (result.length < 3 && i < defaults.length) {
      if (!result.find(r => r.imageUrl === defaults[i].imageUrl)) {
        result.push(defaults[i]);
      }
      i++;
    }
    return result;
  }, [visas, loading, bannerImage]);

  const faqs = [
    {
      q: 'Standard processing duration?',
      a: 'E-visas typically conclude within 48–72 hours. Physical endorsements via diplomatic channels may take 10–15 business days.',
    },
    {
      q: 'Digital nomad visa coverage?',
      a: 'Yes, we provide specialized guidance for extended-stay digital residency programs across the Caribbean, Europe, and Southeast Asia.',
    },
    {
      q: 'E-Visa vs. ETIAS?',
      a: 'An E-Visa is a digital substitute for a traditional visa. ETIAS is an electronic travel authorization for visa-exempt travelers, enhancing security without the full visa process.',
    },
    {
      q: 'What documents are typically required?',
      a: 'Standard requirements include a valid passport (6+ months validity), passport-sized photographs, completed application forms, travel insurance, and proof of accommodation and financial means.',
    },
  ];

  return (
    <>
      <SEO pageId="visas" />

      {/* ── HERO ── */}
      <HeroSlider
        slides={heroSlides}
        loading={loading}
        height="h-[70vh] min-h-[460px] max-h-[700px]"
        hideSlideText={true}
      >
        <div className="relative z-10 max-w-3xl animate-reveal-up flex flex-col items-center gap-5 text-center px-4 pt-16">
          <span className="text-white/50 text-[10px] tracking-[0.6em] uppercase font-bold">
            Bureau of Movement
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-light leading-tight tracking-tighter text-white drop-shadow-xl">
            Visa
            <br />
            <span className="italic font-serif text-white/80">Intelligence</span>
          </h1>
          <p className="text-base font-light text-white/40 max-w-md leading-relaxed drop-shadow-md">
            Decoding global borders into clear, actionable strategy.
          </p>
          {!loading && visas.length > 0 && (
            <div className="flex items-center gap-6 mt-2">
              <div className="text-center">
                <p className="text-2xl font-light text-white drop-shadow-sm">
                  {visas.length}
                </p>
                <p className="text-[9px] text-white/60 tracking-widest uppercase">
                  Countries
                </p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-light text-white drop-shadow-sm">
                  {visas.filter(v => v.difficulty === 'Easy').length}
                </p>
                <p className="text-[9px] text-white/60 tracking-widest uppercase">
                  Easy Access
                </p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-light text-white drop-shadow-sm">
                  {
                    visas.filter(
                      v =>
                        Array.isArray(v.documents) && v.documents.length > 0
                    ).length
                  }
                </p>
                <p className="text-[9px] text-white/60 tracking-widest uppercase">
                  With Docs Guide
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-white text-[9px] tracking-widest uppercase">
            Scroll
          </span>
          <div className="w-px h-10 bg-white animate-pulse" />
        </div>
      </HeroSlider>

      {/* ── PHILOSOPHY ── */}
      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-surface-container-lowest dark:bg-black">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-10 lg:gap-24 items-center">
          <div className="w-full lg:w-1/2 animate-reveal-up">
            <span className="text-primary dark:text-white/60 text-[10px] font-bold tracking-[0.4em] uppercase mb-3 block">
              Strategic Mobility
            </span>
            <h2 className="text-4xl sm:text-5xl font-light tracking-tighter leading-tight dark:text-white">
              Precision in
              <br />
              <span className="italic font-serif opacity-40 dark:opacity-20">
                Entry.
              </span>
            </h2>
          </div>
          <div
            className="w-full lg:w-1/2 space-y-5 animate-reveal-up"
            style={{ animationDelay: '0.15s' }}
          >
            <p className="text-base font-serif italic text-on-surface dark:text-white border-l-4 border-primary/20 dark:border-white/20 pl-5 py-2 leading-relaxed">
              "Effective travel is a matter of administrative mastery."
            </p>
            <p className="text-sm font-light text-on-surface-variant dark:text-white/60 leading-relaxed opacity-70">
              Our Intelligence bureau distils evolving geopolitical requirements
              into high-definition strategies, ensuring your focus remains on
              the destination — not the paperwork.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { icon: 'search', label: 'Research' },
                { icon: 'description', label: 'Prepare' },
                { icon: 'flight_takeoff', label: 'Depart' },
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <div className="w-10 h-10 rounded-2xl bg-surface-container-low dark:bg-white/10 flex items-center justify-center mx-auto mb-2">
                    <span className="material-symbols-outlined text-lg font-light dark:text-white">
                      {step.icon}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant dark:text-white/40 opacity-60">
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── VISA GRID ── */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-8 md:px-16 bg-surface-container-low dark:bg-[#0a0a0a] border-t border-outline-variant/10 dark:border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 pb-6 border-b border-outline-variant/20 dark:border-white/10 animate-reveal-up">
            <div>
              <span className="text-[10px] font-bold tracking-[0.5em] text-on-surface-variant dark:text-white/40 uppercase mb-1.5 block">
                Current Registry
              </span>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tighter italic opacity-25 dark:opacity-10 dark:text-white leading-none">
                Status Dossiers
              </h2>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-white/40 text-sm">
                search
              </span>
              <input
                type="text"
                placeholder="Search country..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-outline-variant/30 dark:border-white/10 rounded-full bg-surface dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:focus:ring-white/20 dark:text-white w-52"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-8 overflow-x-auto pb-1 no-scrollbar">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase whitespace-nowrap transition-all ${filter === f
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                    : 'bg-white dark:bg-black border border-outline-variant/30 dark:border-white/10 text-on-surface-variant dark:text-white/60 hover:bg-surface-container-lowest dark:hover:bg-white/5'
                  }`}
              >
                {f !== 'All' && (
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${diffDot(f)}`}
                  />
                )}
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <Preloader />
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center bg-white dark:bg-[#111] rounded-3xl border border-outline-variant/10 dark:border-white/5">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 dark:text-white/10 mb-4 block font-light">
                inventory_2
              </span>
              <p className="text-sm font-light text-on-surface-variant dark:text-white/40 italic">
                {search
                  ? `No visas found for "${search}"`
                  : 'No visa dossiers available yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filtered.map((visa, i) => (
                <VisaCard key={visa.id} visa={visa} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-black text-white overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12 animate-reveal-up">
            <span className="text-white/40 text-[10px] font-bold tracking-[0.5em] uppercase mb-3 block">
              Document Protocol
            </span>
            <h2 className="text-4xl font-light tracking-tighter">
              Standard
              <br />
              <span className="font-serif italic text-white/60">
                Requirements
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: 'badge',
                title: 'Valid Passport',
                desc: 'Minimum 6 months validity beyond your travel dates',
              },
              {
                icon: 'photo_camera',
                title: 'Photographs',
                desc: '2 passport-sized photos against a white background',
              },
              {
                icon: 'account_balance',
                title: 'Bank Statement',
                desc: 'Last 3–6 months showing sufficient funds',
              },
              {
                icon: 'health_and_safety',
                title: 'Travel Insurance',
                desc: 'Coverage of at least €30,000 for medical emergencies',
              },
              {
                icon: 'hotel',
                title: 'Accommodation',
                desc: 'Hotel booking confirmation or host invitation letter',
              },
              {
                icon: 'flight',
                title: 'Return Ticket',
                desc: 'Confirmed onward or return flight reservation',
              },
              {
                icon: 'work',
                title: 'Employment Proof',
                desc: 'Letter from employer or business registration docs',
              },
              {
                icon: 'description',
                title: 'Cover Letter',
                desc: 'Purpose of visit and itinerary overview',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-5 border border-white/10 rounded-2xl hover:border-white/30 hover:bg-white/5 transition-all duration-300 group"
              >
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white group-hover:text-black transition-all duration-300">
                  <span className="material-symbols-outlined text-base font-light">
                    {item.icon}
                  </span>
                </div>
                <p className="text-sm font-semibold mb-1 tracking-tight">
                  {item.title}
                </p>
                <p className="text-xs font-light text-white/40 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-8 md:px-16 bg-white dark:bg-black">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 animate-reveal-up">
            <span className="text-[10px] font-bold tracking-[0.5em] text-on-surface-variant dark:text-white/40 uppercase mb-2 block">
              Intelligence Archive
            </span>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tighter leading-none italic opacity-25 dark:opacity-10 dark:text-white">
              Queries
            </h2>
          </div>
          <div className="space-y-3 animate-reveal-up">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === index
                    ? 'bg-white dark:bg-[#111] shadow-lg border-primary/20 dark:border-white/20'
                    : 'bg-surface-container-low/30 dark:bg-white/5 border-outline-variant/10 dark:border-white/5'
                  }`}
              >
                <button
                  className="w-full px-5 py-4 flex justify-between items-center text-left gap-4"
                  onClick={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                >
                  <span className="text-base sm:text-lg font-light tracking-tight pr-4 dark:text-white">
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full border border-outline-variant/30 dark:border-white/20 flex items-center justify-center shrink-0 transition-transform duration-300 ${openFaq === index
                        ? 'rotate-45 bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                        : ''
                      }`}
                  >
                    <span className="material-symbols-outlined font-light text-lg">
                      add
                    </span>
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${openFaq === index
                      ? 'max-h-[400px] opacity-100'
                      : 'max-h-0 opacity-0'
                    }`}
                >
                  <div className="px-5 pb-5">
                    <p className="text-sm font-light leading-relaxed text-on-surface-variant dark:text-white/60 opacity-80 italic border-l-2 border-primary/20 dark:border-white/20 pl-4">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 md:px-16 bg-surface-container-lowest dark:bg-black text-center border-t border-outline-variant/10 dark:border-white/5">
        <div className="max-w-xl mx-auto animate-reveal-up">
          <h2 className="text-3xl sm:text-4xl font-light tracking-tighter mb-4 leading-tight dark:text-white">
            Strategic
            <br />
            <span className="italic font-serif text-on-surface/40 dark:text-white/20">
              Mobility Bureau
            </span>
          </h2>
          <p className="text-sm font-light text-on-surface-variant dark:text-white/60 mb-7 leading-relaxed opacity-70">
            For complex multi-territory itineraries, our senior mobility
            strategists offer end-to-end documentation management.
          </p>
          <button
            className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 text-[10px] font-extrabold tracking-[0.5em] uppercase rounded-full hover:bg-primary dark:hover:bg-gray-200 transition-all shadow-xl active:scale-95"
            onClick={() => navigate('/contact')}
          >
            Connect with Registry
          </button>
        </div>
      </section>
    </>
  );
}