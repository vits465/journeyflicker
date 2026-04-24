import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Category = 'Expeditions' | 'Logistics' | 'Protocol';

const categories: { name: Category; icon: string }[] = [
  { name: 'Expeditions', icon: 'explore' },
  { name: 'Logistics', icon: 'local_shipping' },
  { name: 'Protocol', icon: 'verified_user' },
];

const questions: Record<Category, { q: string; a: string }[]> = {
  Expeditions: [
    { q: "What defines a Signature Journey?", a: "A highly choreographed expedition characterized by architectural silence, private access to cultural monoliths, and low-density group dynamics (typically max 8 guests)." },
    { q: "Are private departures available?", a: "Yes. Every itinerary in our portfolio can be sequestered for exclusive private departures. Contact our curators to initiate a private audit." },
    { q: "Can itineraries be modified?", a: "While our Signature Series are pre-designed for narrative flow, our Bespoke Curation service allows total architectural modification of any existing territory dossier." },
  ],
  Logistics: [
    { q: "What is the typical curation lead time?", a: "We require a minimum lead time of 4–6 weeks to ensure absolute verification of private access points and secure transport logistics." },
    { q: "Is transport included?", a: "All signature journeys include full airside-to-airside private transport within the destination territory, typically via executive SUV or private charter." },
    { q: "What is the cancellation protocol?", a: "Due to the exclusive nature of our sequestered assets, cancellations are handled case-by-case per the Curator Protocol Agreement signed at induction." },
  ],
  Protocol: [
    { q: "How is my digital identity protected?", a: "All registry transmissions are encrypted via high-level curator archives. We do not store identity data on public cloud servers." },
    { q: "Do I need travel insurance?", a: "Active travel insurance with medical evacuation coverage is a mandatory protocol for all JourneyFlicker expeditions." },
    { q: "What is a Curator Audit?", a: "An audit is a 1-on-1 strategy session with a lead curator to ensure your sensory preferences align with the chosen expedition territory." },
  ],
};

export default function FaqPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<Category>('Expeditions');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative h-[55vh] min-h-[360px] max-h-[560px] flex flex-col justify-end px-4 sm:px-8 md:px-16 overflow-hidden bg-black pb-10 sm:pb-14">
        <div className="absolute inset-0 z-0">
          <img className="absolute inset-0 w-full h-full object-cover opacity-55 grayscale animate-image-pan"
            alt="Minimalist library" src="https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?q=80&w=2070&auto=format&fit=crop" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 max-w-3xl animate-reveal-up">
          <span className="text-white/60 text-[10px] tracking-[0.5em] uppercase mb-3 block font-bold">Support Bureau</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tighter text-white">
            Bureau of<br/><span className="italic font-serif text-white/90">Intelligence</span>
          </h1>
        </div>
      </section>

      {/* ── CATEGORY TABS ── */}
      <section className="py-4 bg-white border-b border-outline-variant/10 px-4 sm:px-8 sticky top-16 z-20 backdrop-blur">
        <div className="max-w-5xl mx-auto flex justify-center gap-4 sm:gap-8 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button key={cat.name}
              onClick={() => { setActiveCategory(cat.name); setOpenIndex(null); }}
              className={`flex flex-col items-center gap-2 py-2 group transition-all duration-300 min-w-[64px] ${activeCategory === cat.name ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${activeCategory === cat.name ? 'bg-black text-white border-black shadow-lg' : 'bg-surface-container border-outline-variant/30'}`}>
                <span className="material-symbols-outlined text-lg font-light">{cat.icon}</span>
              </div>
              <span className={`text-[9px] font-black tracking-[0.3em] uppercase whitespace-nowrap ${activeCategory === cat.name ? 'text-black' : 'text-on-surface-variant'}`}>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── FAQ LIST ── */}
      <section className="py-10 sm:py-14 md:py-20 px-4 sm:px-8 md:px-16 bg-surface-container-lowest">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-7 animate-reveal-up">
            <span className="text-primary text-[10px] font-bold tracking-[0.4em] uppercase block italic">{activeCategory} Dossier</span>
            <div className="h-px bg-primary/20 w-20 mx-auto mt-3" />
          </div>

          <div className="space-y-3 animate-reveal-up">
            {questions[activeCategory].map((faq, i) => (
              <div key={`${activeCategory}-${i}`}
                className={`rounded-2xl border overflow-hidden transition-all duration-300 ${openIndex === i ? 'bg-white shadow-lg border-primary/20' : 'bg-surface-container-low/50 border-outline-variant/5 hover:bg-surface-container-low hover:shadow-sm'}`}>
                <button className="w-full px-5 py-4 sm:py-5 flex justify-between items-center text-left gap-4 outline-none"
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                  <h3 className={`text-base sm:text-lg font-light tracking-tight leading-snug max-w-xl transition-colors duration-300 ${openIndex === i ? 'text-black' : 'text-on-surface/70'}`}>
                    {faq.q}
                  </h3>
                  <div className={`w-8 h-8 rounded-full border border-black/10 flex items-center justify-center shrink-0 transition-all duration-300 ${openIndex === i ? 'rotate-45 bg-black text-white border-black' : 'hover:scale-110'}`}>
                    <span className="material-symbols-outlined text-lg font-light">add</span>
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-out ${openIndex === i ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-5 pb-5">
                    <div className="h-px bg-primary/10 w-24 mb-3" />
                    <p className="text-sm font-light text-on-surface-variant leading-relaxed opacity-80 max-w-2xl">
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
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-8 md:px-16 bg-black text-white text-center relative overflow-hidden border-t border-white/5">
        <div className="max-w-xl mx-auto animate-reveal-up relative z-10">
          <span className="text-white/40 text-[10px] tracking-[0.4em] uppercase mb-3 block font-bold">Still Undocumented?</span>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tighter mb-4 leading-tight">
            Reach your<br/><span className="italic font-serif text-white/90">Curator</span>
          </h2>
          <p className="text-sm font-light text-white/40 mb-7 leading-relaxed italic">
            For specific intelligence queries or complex itinerary requirements, our senior curators offer private digital audits.
          </p>
          <button className="bg-white text-black px-8 py-3 text-[10px] font-extrabold tracking-[0.5em] uppercase rounded-full hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95"
            onClick={() => navigate('/contact')}>
            Registry Incept
          </button>
        </div>
      </section>
    </>
  );
}
