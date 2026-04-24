import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Visa } from '../lib/api';
import { api } from '../lib/api';
import { useAllHeroSettings } from '../lib/heroSettings';
import { Preloader } from '../components/Preloader';

const diffColor = (d: string) =>
  d === 'Easy' ? 'bg-green-50 text-green-700 border-green-100'
  : d === 'Moderate' ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
  : 'bg-red-50 text-red-700 border-red-100';

const faqs = [
  { q: "Standard processing duration?", a: "E-visas typically conclude within 48–72 hours. Physical endorsements via diplomatic channels may take 10–15 business days." },
  { q: "Digital nomad visa coverage?", a: "Yes, we provide specialized guidance for extended-stay digital residency programs across the Caribbean, Europe, and Southeast Asia." },
  { q: "E-Visa vs. ETIAS?", a: "An E-Visa is a digital substitute for a traditional visa. ETIAS is an electronic travel authorization for visa-exempt travelers, enhancing security without the full visa process." },
];

export default function VisasPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [visas, setVisas] = useState<Visa[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useAllHeroSettings();

  const bannerImage = settings?.visaBanner || "https://images.unsplash.com/photo-1544016768-982d1554f0b9?q=80&w=1974&auto=format&fit=crop";

  useEffect(() => {
    api.listVisas().then(data => { setVisas(data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative h-[60vh] min-h-[400px] max-h-[620px] flex flex-col justify-center items-center px-4 sm:px-8 overflow-hidden bg-black text-center pt-16">
        <div className="absolute inset-0 z-0">
          <img className="absolute inset-0 w-full h-full object-cover animate-image-pan opacity-55 grayscale"
            alt="Passport" src={bannerImage} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/80" />
        </div>
        <div className="relative z-10 max-w-3xl animate-reveal-up flex flex-col items-center">
          <span className="text-white/60 text-[10px] tracking-[0.5em] uppercase mb-4 block font-bold">Bureau of Movement</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tighter text-white mb-4">
            Visa<br/><span className="italic font-serif text-white/90">Intelligence</span>
          </h1>
          <p className="text-base font-light text-white/40 max-w-md leading-relaxed">Decoding global borders into clear, actionable strategy.</p>
        </div>
      </section>

      {/* ── PHILOSOPHY ── */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-8 md:px-16 bg-surface-container-lowest">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-10 lg:gap-20 items-center">
          <div className="w-full lg:w-1/2 animate-reveal-up">
            <span className="text-primary text-[10px] font-bold tracking-[0.4em] uppercase mb-3 block">Strategic Mobility</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tighter leading-tight">
              Precision in<br/><span className="italic font-serif opacity-40">Entry.</span>
            </h2>
          </div>
          <div className="w-full lg:w-1/2 space-y-5 animate-reveal-up" style={{ animationDelay: '0.15s' }}>
            <p className="text-base font-serif italic text-on-surface border-l-4 border-primary/20 pl-5 py-2 leading-relaxed">
              "Effective travel is a matter of administrative mastery."
            </p>
            <p className="text-sm font-light text-on-surface-variant leading-relaxed opacity-70">
              Our Intelligence bureau distills evolving geopolitical requirements into high-definition strategies, ensuring your focus remains on the destination territory.
            </p>
          </div>
        </div>
      </section>

      {/* ── VISA GRID ── */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-8 md:px-16 bg-surface-container-low border-t border-outline-variant/10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 md:mb-12 pb-6 border-b border-outline-variant/20 animate-reveal-up">
            <div>
              <span className="text-[10px] font-bold tracking-[0.5em] text-on-surface-variant uppercase mb-1.5 block">Current Registry</span>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tighter italic opacity-25 leading-none">Status Dossiers</h2>
            </div>
            <span className="text-2xl font-light text-primary/20 tracking-tighter font-sans font-bold">INTELL</span>
          </div>

          {loading ? (
            <Preloader />
          ) : visas.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-outline-variant/10">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-4 block font-light">inventory_2</span>
              <p className="text-sm font-light text-on-surface-variant italic">All dossiers are currently sequestered.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visas.map((visa, i) => (
                <div key={visa.id}
                  className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-outline-variant/10 hover:shadow-lg transition-all duration-500 group"
                  style={{ animationDelay: `${(i%3)*0.08}s` }}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500">
                      <span className="material-symbols-outlined font-light text-xl">public</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-[0.2em] border ${diffColor(visa.difficulty)}`}>
                      {visa.difficulty}
                    </span>
                  </div>
                  <h3 className="text-2xl font-light mb-4 tracking-tighter group-hover:text-primary transition-colors">{visa.country}</h3>
                  <div className="space-y-2 border-t border-outline-variant/10 pt-3">
                    <div className="flex justify-between items-center text-[10px] tracking-widest">
                      <span className="text-on-surface-variant uppercase font-bold opacity-40">Processing</span>
                      <span className="text-sm font-light text-on-surface-variant">{visa.processing}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] tracking-widest">
                      <span className="text-on-surface-variant uppercase font-bold opacity-40">Fee</span>
                      <span className="text-sm font-light text-on-surface-variant">{visa.fee}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── VISA FAQ ── */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-8 md:px-16 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 md:mb-10 animate-reveal-up">
            <span className="text-[10px] font-bold tracking-[0.5em] text-on-surface-variant uppercase mb-2 block">Intelligence Archive</span>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tighter leading-none italic opacity-25">Queries</h2>
          </div>
          <div className="space-y-3 animate-reveal-up">
            {faqs.map((faq, index) => (
              <div key={index}
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === index ? 'bg-white shadow-lg border-primary/20' : 'bg-surface-container-low/30 border-outline-variant/10'}`}>
                <button className="w-full px-5 py-4 flex justify-between items-center text-left gap-4"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                  <span className="text-base sm:text-lg font-light tracking-tight pr-4">{faq.q}</span>
                  <div className={`w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-45 bg-black text-white' : ''}`}>
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
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-8 md:px-16 bg-black text-white text-center relative overflow-hidden border-t border-white/5">
        <div className="max-w-xl mx-auto animate-reveal-up relative z-10">
          <h2 className="text-3xl sm:text-4xl font-light tracking-tighter mb-4 leading-tight">
            Strategic<br/><span className="italic font-serif text-white/90">Mobility</span> Bureau
          </h2>
          <p className="text-sm font-light text-white/40 mb-7 leading-relaxed italic">
            For complex multi-territory itineraries, our senior mobility strategists offer end-to-end documentation management.
          </p>
          <button className="bg-white text-black px-8 py-3 text-[10px] font-extrabold tracking-[0.5em] uppercase rounded-full hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95"
            onClick={() => navigate('/contact')}>
            Connect with Registry
          </button>
        </div>
      </section>
    </>
  );
}
