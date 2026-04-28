import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Visa } from '../lib/api';
import { api } from '../lib/api';
import { useAllHeroSettings } from '../lib/heroSettings';
import { Preloader } from '../components/Preloader';
import { HeroSlider } from '../components/HeroSlider';
import { SEO } from '../components/SEO';

const diffColor = (d: string) =>
  d === 'Easy' ? 'bg-emerald-50  text-emerald-700 border-emerald-200'
    : d === 'Moderate' ? 'bg-amber-50    text-amber-700   border-amber-200'
      : 'bg-rose-50    text-rose-700    border-rose-200';

const diffDot = (d: string) =>
  d === 'Easy' ? 'bg-emerald-400'
    : d === 'Moderate' ? 'bg-amber-400'
      : 'bg-rose-400';

const DEFAULT_VISA_BG = 'https://images.unsplash.com/photo-1544016768-982d1554f0b9?q=80&w=1974&auto=format&fit=crop';

// Expandable Visa Detail Card
function VisaCard({ visa, index }: { visa: Visa; index: number }) {
  const [open, setOpen] = useState(false);

  const hasExtras = (visa.documents?.length ?? 0) > 0 ||
    (visa.requirements?.length ?? 0) > 0 ||
    visa.description;

  return (
    <div
      className="group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-outline-variant/10 bg-white flex flex-col"
      style={{ animationDelay: `${(index % 3) * 0.08}s` }}
    >
      {/* Background Image Strip */}
      {visa.heroImageUrl ? (
        <div className="relative h-36 overflow-hidden flex-shrink-0">
          <img
            src={visa.heroImageUrl}
            alt={visa.country}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60" />
          {/* Difficulty badge over image */}
          <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[9px] font-bold tracking-[0.2em] border ${diffColor(visa.difficulty)}`}>
            {visa.difficulty}
          </span>
          {/* Country name overlay */}
          <h3 className="absolute bottom-3 left-4 text-white text-xl font-light tracking-tighter">
            {visa.country}
          </h3>
        </div>
      ) : (
        /* No image — classic text layout */
        <div className="px-6 pt-6 pb-4">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500">
              <span className="material-symbols-outlined font-light text-xl">public</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-[0.2em] border ${diffColor(visa.difficulty)}`}>
              {visa.difficulty}
            </span>
          </div>
          <h3 className="text-2xl font-light tracking-tighter group-hover:text-primary transition-colors">
            {visa.country}
          </h3>
        </div>
      )}

      {/* Core Info */}
      <div className={`px-6 ${visa.heroImageUrl ? 'pt-4' : 'pt-0'} pb-4 flex-1 flex flex-col`}>
        {visa.visaType && (
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-on-surface-variant/50 mb-2 block">
            {visa.visaType}
          </span>
        )}
        {visa.description && (
          <p className="text-xs font-light text-on-surface-variant leading-relaxed mb-3 opacity-70 line-clamp-2">
            {visa.description}
          </p>
        )}

        {/* Requirements Preview */}
        {visa.requirements && visa.requirements.length > 0 && !open && (
          <div className="space-y-1.5 mb-3 border-t border-outline-variant/10 pt-3">
            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-on-surface-variant/40 mb-2">Key Requirements</p>
            {visa.requirements.slice(0, 2).map((req, i) => (
              <div key={i} className="flex justify-between items-start gap-3 text-xs">
                <span className="font-semibold text-on-surface opacity-80 min-w-max">{req.label}</span>
                <span className="font-light text-on-surface-variant text-right">{req.detail}</span>
              </div>
            ))}
            {visa.requirements.length > 2 && (
              <p className="text-[10px] text-primary/70 italic text-center pt-1">+ {visa.requirements.length - 2} more</p>
            )}
          </div>
        )}

        <div className="space-y-2 border-t border-outline-variant/10 pt-3 mt-auto">
          <div className="flex justify-between items-center text-[10px] tracking-widest">
            <span className="text-on-surface-variant uppercase font-bold opacity-40">Processing</span>
            <span className="text-sm font-light text-on-surface-variant">{visa.processing}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] tracking-widest">
            <span className="text-on-surface-variant uppercase font-bold opacity-40">Fee</span>
            <span className="text-sm font-light text-on-surface-variant">{visa.fee}</span>
          </div>
        </div>

        {/* Expand button */}
        {hasExtras && (
          <button
            onClick={() => setOpen(!open)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-surface-container-low hover:bg-black hover:text-white transition-all text-xs font-bold tracking-[0.2em] uppercase text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-base">{open ? 'expand_less' : 'expand_more'}</span>
            {open ? 'Collapse' : 'View Details'}
          </button>
        )}
      </div>

      {/* Expandable Section */}
      {hasExtras && (
        <div className={`grid transition-all duration-500 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="px-6 pb-6 space-y-5 border-t border-outline-variant/10 pt-5">

              {/* Description full */}
              {visa.description && (
                <p className="text-sm font-light text-on-surface-variant leading-relaxed italic border-l-2 border-primary/20 pl-3">
                  {visa.description}
                </p>
              )}

              {/* Documents required */}
              {visa.documents && visa.documents.length > 0 && (
                <div>
                  <p className="text-[10px] font-black tracking-[0.4em] uppercase text-on-surface-variant/50 mb-3">
                    📄 Required Documents
                  </p>
                  <ul className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">
                    {visa.documents.map((doc, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-light text-on-surface-variant">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {visa.requirements && visa.requirements.length > 0 && (
                <div>
                  <p className="text-[10px] font-black tracking-[0.4em] uppercase text-on-surface-variant/50 mb-3">
                    ✅ Key Requirements
                  </p>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto admin-scroll pr-2">
                    {visa.requirements.map((req, i) => (
                      <div key={i} className="flex justify-between items-start gap-4 py-2 border-b border-outline-variant/10 last:border-0">
                        <span className="text-xs font-semibold text-on-surface">{req.label}</span>
                        <span className="text-xs font-light text-on-surface-variant text-right">{req.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Filter Bar ──────────────────────────────────────────────────────────────
const FILTERS = ['All', 'Easy', 'Moderate', 'Challenging'];

export default function VisasPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [visas, setVisas] = useState<Visa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const { settings } = useAllHeroSettings();

  const bannerImage = settings?.visaBanner || DEFAULT_VISA_BG;

  useEffect(() => {
    api.listVisas()
      .then(data => { setVisas(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = visas.filter(v =>
    (filter === 'All' || v.difficulty === filter) &&
    (search === '' || v.country.toLowerCase().includes(search.toLowerCase()))
  );

  const heroSlides = useMemo(() => {
    const validVisas = visas.filter(v => v.heroImageUrl);
    const defaults = [
      { id: '1', imageUrl: bannerImage, title: 'Visa Intelligence' },
      { id: '2', imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop', title: 'Global Movement' },
      { id: '3', imageUrl: 'https://images.unsplash.com/photo-1493246232918-d78b97076ac9?q=80&w=2070&auto=format&fit=crop', title: 'Borderless Strategy' }
    ];

    if (loading) return defaults;

    const result = validVisas.slice(0, 5).map(v => ({ id: v.id, imageUrl: v.heroImageUrl!, title: v.country }));

    // Pad with defaults to ensure there are always at least 3 slides for a nice slider effect
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
    { q: "Standard processing duration?", a: "E-visas typically conclude within 48–72 hours. Physical endorsements via diplomatic channels may take 10–15 business days." },
    { q: "Digital nomad visa coverage?", a: "Yes, we provide specialized guidance for extended-stay digital residency programs across the Caribbean, Europe, and Southeast Asia." },
    { q: "E-Visa vs. ETIAS?", a: "An E-Visa is a digital substitute for a traditional visa. ETIAS is an electronic travel authorization for visa-exempt travelers, enhancing security without the full visa process." },
    { q: "What documents are typically required?", a: "Standard requirements include a valid passport (6+ months validity), passport-sized photographs, completed application forms, travel insurance, and proof of accommodation and financial means." },
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
          <span className="text-white/50 text-[10px] tracking-[0.6em] uppercase font-bold">Bureau of Movement</span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-light leading-tight tracking-tighter text-white drop-shadow-xl">
            Visa<br /><span className="italic font-serif text-white/80">Intelligence</span>
          </h1>
          <p className="text-base font-light text-white/40 max-w-md leading-relaxed drop-shadow-md">
            Decoding global borders into clear, actionable strategy.
          </p>
          {/* Stats strip */}
          {!loading && visas.length > 0 && (
            <div className="flex items-center gap-6 mt-2">
              <div className="text-center">
                <p className="text-2xl font-light text-white drop-shadow-sm">{visas.length}</p>
                <p className="text-[9px] text-white/60 tracking-widest uppercase">Countries</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-light text-white drop-shadow-sm">{visas.filter(v => v.difficulty === 'Easy').length}</p>
                <p className="text-[9px] text-white/60 tracking-widest uppercase">Easy Access</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-light text-white drop-shadow-sm">{visas.filter(v => v.documents && v.documents.length > 0).length}</p>
                <p className="text-[9px] text-white/60 tracking-widest uppercase">With Docs Guide</p>
              </div>
            </div>
          )}
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-white text-[9px] tracking-widest uppercase">Scroll</span>
          <div className="w-px h-10 bg-white animate-pulse" />
        </div>
      </HeroSlider>

      {/* ── PHILOSOPHY ── */}
      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-surface-container-lowest">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-10 lg:gap-24 items-center">
          <div className="w-full lg:w-1/2 animate-reveal-up">
            <span className="text-primary text-[10px] font-bold tracking-[0.4em] uppercase mb-3 block">Strategic Mobility</span>
            <h2 className="text-4xl sm:text-5xl font-light tracking-tighter leading-tight">
              Precision in<br /><span className="italic font-serif opacity-40">Entry.</span>
            </h2>
          </div>
          <div className="w-full lg:w-1/2 space-y-5 animate-reveal-up" style={{ animationDelay: '0.15s' }}>
            <p className="text-base font-serif italic text-on-surface border-l-4 border-primary/20 pl-5 py-2 leading-relaxed">
              "Effective travel is a matter of administrative mastery."
            </p>
            <p className="text-sm font-light text-on-surface-variant leading-relaxed opacity-70">
              Our Intelligence bureau distils evolving geopolitical requirements into high-definition strategies, ensuring your focus remains on the destination — not the paperwork.
            </p>
            {/* Process steps */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { icon: 'search', label: 'Research' },
                { icon: 'description', label: 'Prepare' },
                { icon: 'flight_takeoff', label: 'Depart' },
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <div className="w-10 h-10 rounded-2xl bg-surface-container-low flex items-center justify-center mx-auto mb-2">
                    <span className="material-symbols-outlined text-lg font-light">{step.icon}</span>
                  </div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant opacity-60">{step.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── VISA GRID ── */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-8 md:px-16 bg-surface-container-low border-t border-outline-variant/10">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 pb-6 border-b border-outline-variant/20 animate-reveal-up">
            <div>
              <span className="text-[10px] font-bold tracking-[0.5em] text-on-surface-variant uppercase mb-1.5 block">Current Registry</span>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tighter italic opacity-25 leading-none">Status Dossiers</h2>
            </div>
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                type="text"
                placeholder="Search country..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-outline-variant/30 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 w-52"
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-1 no-scrollbar">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase whitespace-nowrap transition-all ${filter === f
                  ? 'bg-black text-white shadow-md'
                  : 'bg-white border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-lowest'
                  }`}
              >
                {f !== 'All' && (
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${diffDot(f)}`} />
                )}
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <Preloader />
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-outline-variant/10">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-4 block font-light">inventory_2</span>
              <p className="text-sm font-light text-on-surface-variant italic">
                {search ? `No visas found for "${search}"` : 'No visa dossiers available yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((visa, i) => (
                <VisaCard key={visa.id} visa={visa} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-black text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12 animate-reveal-up">
            <span className="text-white/40 text-[10px] font-bold tracking-[0.5em] uppercase mb-3 block">Document Protocol</span>
            <h2 className="text-4xl font-light tracking-tighter">Standard<br /><span className="font-serif italic text-white/60">Requirements</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: 'badge', title: 'Valid Passport', desc: 'Minimum 6 months validity beyond your travel dates' },
              { icon: 'photo_camera', title: 'Photographs', desc: '2 passport-sized photos against a white background' },
              { icon: 'account_balance', title: 'Bank Statement', desc: 'Last 3–6 months showing sufficient funds' },
              { icon: 'health_and_safety', title: 'Travel Insurance', desc: 'Coverage of at least €30,000 for medical emergencies' },
              { icon: 'hotel', title: 'Accommodation', desc: 'Hotel booking confirmation or host invitation letter' },
              { icon: 'flight', title: 'Return Ticket', desc: 'Confirmed onward or return flight reservation' },
              { icon: 'work', title: 'Employment Proof', desc: 'Letter from employer or business registration docs' },
              { icon: 'description', title: 'Cover Letter', desc: 'Purpose of visit and itinerary overview' },
            ].map((item, i) => (
              <div key={i} className="p-5 border border-white/10 rounded-2xl hover:border-white/30 hover:bg-white/5 transition-all duration-300 group">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white group-hover:text-black transition-all duration-300">
                  <span className="material-symbols-outlined text-base font-light">{item.icon}</span>
                </div>
                <p className="text-sm font-semibold mb-1 tracking-tight">{item.title}</p>
                <p className="text-xs font-light text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-8 md:px-16 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 animate-reveal-up">
            <span className="text-[10px] font-bold tracking-[0.5em] text-on-surface-variant uppercase mb-2 block">Intelligence Archive</span>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tighter leading-none italic opacity-25">Queries</h2>
          </div>
          <div className="space-y-3 animate-reveal-up">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === index ? 'bg-white shadow-lg border-primary/20' : 'bg-surface-container-low/30 border-outline-variant/10'}`}
              >
                <button
                  className="w-full px-5 py-4 flex justify-between items-center text-left gap-4"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="text-base sm:text-lg font-light tracking-tight pr-4">{faq.q}</span>
                  <div className={`w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-45 bg-black text-white border-black' : ''}`}>
                    <span className="material-symbols-outlined font-light text-lg">add</span>
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-5 pb-5">
                    <p className="text-sm font-light leading-relaxed text-on-surface-variant opacity-80 italic border-l-2 border-primary/20 pl-4">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 md:px-16 bg-surface-container-lowest text-center border-t border-outline-variant/10">
        <div className="max-w-xl mx-auto animate-reveal-up">
          <h2 className="text-3xl sm:text-4xl font-light tracking-tighter mb-4 leading-tight">
            Strategic<br /><span className="italic font-serif text-on-surface/40">Mobility Bureau</span>
          </h2>
          <p className="text-sm font-light text-on-surface-variant mb-7 leading-relaxed opacity-70">
            For complex multi-territory itineraries, our senior mobility strategists offer end-to-end documentation management.
          </p>
          <button
            className="bg-black text-white px-8 py-3 text-[10px] font-extrabold tracking-[0.5em] uppercase rounded-full hover:bg-primary transition-all shadow-xl active:scale-95"
            onClick={() => navigate('/contact')}
          >
            Connect with Registry
          </button>
        </div>
      </section>
    </>
  );
}
