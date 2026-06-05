import { useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { HeroSlider, type HeroSlide } from '../components/HeroSlider';

export default function AboutPage() {
  const navigate = useNavigate();

  const aboutSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": "https://journeyflicker.com/about/#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://journeyflicker.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "About",
            "item": "https://journeyflicker.com/about"
          }
        ]
      }
    ]
  };

  return (
    <>
      <SEO pageId="about" schema={aboutSchema} />
      {/* ── HERO ── */}
      <HeroSlider
        slides={[
          { id: '1', imageUrl: 'https://images.unsplash.com/photo-1493246232918-d78b97076ac9?q=80&w=2070&auto=format&fit=crop', title: 'The Vision' },
          { id: '2', imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop', title: 'Our Offerings' },
          { id: '3', imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop', title: 'Why Choose Us' }
        ]}
        height="h-[65vh] min-h-[440px] max-h-[680px]"
        hideSlideText={true}
      >
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 md:px-16 text-center md:text-left pt-16 relative z-10 animate-reveal-up">
          <span className="text-white/60 text-[10px] tracking-[0.5em] uppercase mb-4 block font-bold">About Us</span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tighter leading-tight text-white mb-5 drop-shadow-lg">
            Crafting Memories in<br/><span className="italic font-serif text-white/90">Every Destination</span>
          </h1>
          <p className="text-base sm:text-lg font-light text-white/50 max-w-xl leading-relaxed drop-shadow-md mx-auto md:mx-0">
            Welcome to JourneyFlicker, where travel is not just about reaching a destination, but about creating unforgettable experiences and lifelong memories.
          </p>
        </div>
      </HeroSlider>

      {/* ── PHILOSOPHY ── */}
      <section className="py-14 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-surface-container-lowest">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-10 lg:gap-20 items-center">
          <div className="w-full lg:w-1/2 animate-reveal-up">
            <span className="text-[10px] font-bold tracking-[0.4em] text-on-surface-variant uppercase mb-3 block">Our Philosophy</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tighter leading-tight text-on-surface dark:text-white">
              Seamless, Inspiring, and<br/><span className="italic font-serif opacity-40 dark:opacity-20">Truly Special.</span>
            </h2>
          </div>
          <div className="w-full lg:w-1/2 space-y-6 animate-reveal-up" style={{ animationDelay: '0.15s' }}>
            <p className="text-base font-serif italic text-primary/80 dark:text-white border-l-4 border-primary/20 dark:border-white/20 pl-6 py-2 leading-relaxed">
              "At JourneyFlicker, we believe that every journey should be seamless, inspiring, and truly special."
            </p>
            <p className="text-sm font-light text-on-surface-variant leading-relaxed opacity-70">
              With a passion for travel and a commitment to excellence, we specialize in crafting personalized tour packages that cater to every kind of traveler—whether you're seeking adventure, relaxation, cultural exploration, or a romantic getaway.
            </p>
          </div>
        </div>
      </section>

      {/* ── MISSION BENTO ── */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-8 md:px-16 bg-surface-container-low dark:bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5 auto-rows-[220px]">
          {/* Promise — spans 2 cols */}
          <div className="sm:col-span-2 bg-surface dark:bg-white/5 p-7 md:p-10 flex flex-col justify-end shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl group border border-outline-variant/5 dark:border-white/10">
            <span className="material-symbols-outlined text-primary dark:text-white text-3xl mb-4 group-hover:scale-110 transition-transform font-light">map</span>
            <span className="text-[9px] font-bold tracking-[0.4em] text-on-surface-variant dark:text-white/40 uppercase mb-2 block">The Promise</span>
            <h3 className="text-xl sm:text-2xl font-light tracking-tighter leading-snug dark:text-white">Our team of travel experts works tirelessly to design well-planned itineraries, ensuring comfort, convenience, and value at every step.</h3>
          </div>
          {/* Mountains & Beaches */}
          <div className="bg-black flex flex-col justify-center items-center text-center p-6 text-white shadow-xl rounded-2xl group relative overflow-hidden">
            <span className="material-symbols-outlined text-5xl mb-4 font-light opacity-40">landscape</span>
            <p className="text-[10px] font-bold tracking-[0.5em] uppercase">From Breathtaking Mountains<br/>To Serene Beaches</p>
          </div>
          {/* Vision */}
          <div className="bg-surface dark:bg-white/5 p-7 md:p-10 shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl flex flex-col justify-between border border-outline-variant/10 dark:border-white/10">
            <div className="text-3xl font-light italic font-serif dark:text-white">Destinations</div>
            <p className="text-sm font-light leading-relaxed text-on-surface-variant dark:text-white/50 opacity-70">From vibrant cities to hidden gems, we bring you closer to the world's most beautiful destinations.</p>
          </div>
          {/* Image — spans 2 cols */}
          <div className="sm:col-span-2 relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-700 group">
            <img className="absolute inset-0 w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[2s]"
              alt="Travel gear" src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop" />
          </div>
        </div>
      </section>

      {/* ── WHAT WE OFFER ── */}
      <section className="py-14 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-surface-container-lowest">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center mb-10 md:mb-14 animate-reveal-up">
            <span className="text-[10px] font-bold tracking-[0.4em] text-on-surface-variant uppercase mb-3 block">Our Services</span>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tighter leading-none italic opacity-25 dark:opacity-10 dark:text-white">What We Offer</h2>
            <div className="h-px bg-outline-variant/30 dark:bg-white/10 w-24 mt-5" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              {
                title: "Domestic & International Tour Packages",
                desc: "Curated travel packages around the globe, customized to perfection.",
                icon: "public"
              },
              {
                title: "Customized Holiday Planning",
                desc: "Personalized itineraries built to match your unique desires.",
                icon: "design_services"
              },
              {
                title: "Flight & Hotel Bookings",
                desc: "Hassle-free reservations at standard-setting venues worldwide.",
                icon: "bed"
              },
              {
                title: "Group Tours & Corporate Travel",
                desc: "Meticulous planning and execution for teams and groups.",
                icon: "groups"
              }
            ].map((offer, i) => (
              <div key={i} className="group bg-surface dark:bg-white/5 p-6 md:p-8 rounded-2xl border border-outline-variant/10 dark:border-white/10 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 animate-reveal-up flex flex-col justify-between min-h-[220px]" style={{ animationDelay: `${i * 0.08}s` }}>
                <span className="material-symbols-outlined text-primary dark:text-white text-3xl mb-4 group-hover:scale-110 transition-transform font-light">{offer.icon}</span>
                <div>
                  <h4 className="text-base font-light tracking-tighter mb-2 leading-tight dark:text-white">{offer.title}</h4>
                  <p className="text-[11px] font-light text-on-surface-variant dark:text-white/50 leading-relaxed opacity-70">{offer.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="py-14 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-surface-container-low dark:bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-10 lg:gap-20">
          <div className="w-full lg:w-1/3 animate-reveal-up">
            <span className="text-[10px] font-bold tracking-[0.4em] text-on-surface-variant uppercase mb-3 block">Why Choose JourneyFlicker?</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tighter leading-tight text-on-surface dark:text-white">
              Redefining the standard of<br/><span className="italic font-serif opacity-40 dark:opacity-20">Modern Travel.</span>
            </h2>
            <div className="h-px bg-outline-variant/30 dark:bg-white/10 w-24 mt-6 hidden lg:block" />
          </div>
          <div className="w-full lg:w-2/3 space-y-6 md:space-y-8 animate-reveal-up" style={{ animationDelay: '0.15s' }}>
            {[
              {
                title: "Personalized travel experiences tailored to your needs",
                desc: "We ensure every package fits your specific travel goals, whether it is high-pace adventure or peaceful solitude.",
                icon: "psychology"
              },
              {
                title: "Reliable support before, during, and after your trip",
                desc: "Our travel experts are always within reach to handle logistics, schedule adjustments, or real-time assistance.",
                icon: "support_agent"
              },
              {
                title: "Competitive pricing with no compromise on quality",
                desc: "We believe in transparency and providing immense value, assuring standard-setting quality across all price ranges.",
                icon: "payments"
              },
              {
                title: "Strong network of trusted partners worldwide",
                desc: "Our deep connections with local properties and services ensure first-class treatment and exclusive experiences.",
                icon: "hub"
              }
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start group">
                <span className="material-symbols-outlined text-primary dark:text-white text-2xl font-light opacity-60 group-hover:opacity-100 transition-opacity mt-0.5">{item.icon}</span>
                <div>
                  <h4 className="text-base font-light tracking-tighter mb-1.5 dark:text-white leading-tight">{item.title}</h4>
                  <p className="text-xs font-light text-on-surface-variant dark:text-white/50 leading-relaxed opacity-70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 sm:py-20 md:py-28 px-4 sm:px-8 md:px-16 bg-black text-white text-center relative overflow-hidden border-t border-white/10">
        <div className="max-w-2xl mx-auto animate-reveal-up relative z-10">
          <span className="text-white/40 text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block">Satisfaction Guaranteed</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tighter mb-5 leading-tight">
            Let's turn your travel dreams<br/><span className="italic font-serif text-white/90">into reality with JourneyFlicker.</span>
          </h2>
          <p className="text-sm font-light text-white/40 mb-8 max-w-md mx-auto leading-relaxed">
            At JourneyFlicker, your satisfaction is our priority. We don't just plan trips—we create journeys that you will cherish forever.
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
