import { useNavigate } from 'react-router-dom';

const team = [
  { name: "Julian Voss", role: "Founding Curator", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop" },
  { name: "Elena Moretti", role: "Cultural Liaison", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop" },
  { name: "Marcus Thorne", role: "Experience Architect", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1974&auto=format&fit=crop" },
  { name: "Sasha Kim", role: "Visual Strategist", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop" },
];

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative h-[65vh] min-h-[440px] max-h-[680px] flex items-center px-4 sm:px-8 md:px-16 overflow-hidden bg-black pt-16">
        <div className="absolute inset-0 z-0">
          <img className="absolute inset-0 w-full h-full object-cover animate-image-pan opacity-55 grayscale"
            alt="About hero" src="https://images.unsplash.com/photo-1493246232918-d78b97076ac9?q=80&w=2070&auto=format&fit=crop" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
        </div>
        <div className="relative z-10 max-w-3xl animate-reveal-up">
          <span className="text-white/60 text-[10px] tracking-[0.5em] uppercase mb-4 block font-bold">The Narrative</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tighter leading-tight text-white mb-5">
            Crafting Art in<br/><span className="italic font-serif text-white/90">Discovery</span>
          </h1>
          <p className="text-base sm:text-lg font-light text-white/50 max-w-xl leading-relaxed">
            JourneyFlicker is a digital curator for the discerning voyager seeking silence, space, and the sublime.
          </p>
        </div>
      </section>

      {/* ── PHILOSOPHY ── */}
      <section className="py-14 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-surface-container-lowest">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-10 lg:gap-20 items-center">
          <div className="w-full lg:w-1/2 animate-reveal-up">
            <span className="text-[10px] font-bold tracking-[0.4em] text-on-surface-variant uppercase mb-3 block">Our Ethos</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tighter leading-tight text-on-surface">
              Luxury is found in<br/><span className="italic font-serif opacity-40">Precision.</span>
            </h2>
          </div>
          <div className="w-full lg:w-1/2 space-y-6 animate-reveal-up" style={{ animationDelay: '0.15s' }}>
            <p className="text-base font-serif italic text-primary/80 border-l-4 border-primary/20 pl-6 py-2 leading-relaxed">
              "We began with a simple observation: the modern traveler is overwhelmed by noise. Authentic exploration requires a curated lens."
            </p>
            <p className="text-sm font-light text-on-surface-variant leading-relaxed opacity-70">
              Our team of curators traverses the globe not to find the most popular destinations, but to secure the most significant ones.
            </p>
          </div>
        </div>
      </section>

      {/* ── MISSION BENTO ── */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-8 md:px-16 bg-surface-container-low">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5 auto-rows-[220px]">
          {/* Mission — spans 2 cols */}
          <div className="sm:col-span-2 bg-white p-7 md:p-10 flex flex-col justify-end shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl group border border-outline-variant/5">
            <span className="material-symbols-outlined text-primary text-3xl mb-4 group-hover:scale-110 transition-transform font-light">auto_awesome</span>
            <span className="text-[9px] font-bold tracking-[0.4em] text-on-surface-variant uppercase mb-2 block">The Mission</span>
            <h3 className="text-xl sm:text-2xl font-light tracking-tighter leading-snug">To redefine the digital travel experience through editorial precision.</h3>
          </div>
          {/* Global network */}
          <div className="bg-black flex flex-col justify-center items-center text-center p-6 text-white shadow-xl rounded-2xl group relative overflow-hidden">
            <span className="material-symbols-outlined text-5xl mb-4 font-light opacity-40">language</span>
            <p className="text-[10px] font-bold tracking-[0.5em] uppercase">Global Sanctuary<br/>Network</p>
          </div>
          {/* Vision */}
          <div className="bg-white p-7 md:p-10 shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl flex flex-col justify-between border border-outline-variant/10">
            <div className="text-3xl font-light italic font-serif">Vision</div>
            <p className="text-sm font-light leading-relaxed text-on-surface-variant opacity-70">A world where journey is a curated masterpiece of quiet architectural beauty.</p>
          </div>
          {/* Image — spans 2 cols */}
          <div className="sm:col-span-2 relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-700 group">
            <img className="absolute inset-0 w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[2s]"
              alt="Travel gear" src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop" />
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="py-14 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-surface-container-lowest">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center mb-10 md:mb-14 animate-reveal-up">
            <span className="text-[10px] font-bold tracking-[0.4em] text-on-surface-variant uppercase mb-3 block">The Collective</span>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tighter leading-none italic opacity-25">Architects of Experience</h2>
            <div className="h-px bg-outline-variant/30 w-24 mt-5" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8">
            {team.map((member, i) => (
              <div key={i} className="group animate-reveal-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="aspect-[3/4] mb-4 overflow-hidden rounded-2xl bg-surface-container shadow-sm group-hover:shadow-xl transition-all duration-700 relative border border-outline-variant/10">
                  <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110 grayscale group-hover:grayscale-0"
                    alt={member.name} src={member.img} />
                </div>
                <div className="text-center px-2">
                  <h5 className="text-base font-light tracking-tighter mb-1 leading-none">{member.name}</h5>
                  <p className="text-[9px] font-bold tracking-[0.3em] text-primary uppercase">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-black text-white text-center relative overflow-hidden border-t border-white/10">
        <div className="max-w-2xl mx-auto animate-reveal-up relative z-10">
          <span className="text-white/40 text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block">Selective Inquiries</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tighter mb-5 leading-tight">
            Begin Your<br/><span className="italic font-serif text-white/90">Journey.</span>
          </h2>
          <p className="text-sm font-light text-white/40 mb-8 max-w-md mx-auto leading-relaxed">
            Connect with our curators to receive our latest lookbook of exclusive territories and private sanctuaries.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button className="bg-white text-black px-8 py-3 text-[10px] font-extrabold tracking-[0.4em] uppercase rounded-full hover:bg-primary hover:text-white transition-all shadow-xl w-full sm:w-auto"
              onClick={() => navigate('/contact')}>Request Access</button>
            <button className="text-[10px] font-bold tracking-[0.4em] uppercase border-b-2 border-white/20 pb-1.5 hover:border-white transition-all"
              onClick={() => navigate('/destinations')}>Explore Destinations</button>
          </div>
        </div>
      </section>
    </>
  );
}
