import { NavLink } from "react-router-dom";

const registry = ['Tours', 'Destinations', 'Visas', 'About'];
const intelligence = ['FAQ', 'Contact', 'Strategy'];

const socialIcons = [
  { icon: 'photo_camera', href: '#', label: 'Instagram' },
  { icon: 'business', href: '#', label: 'LinkedIn' },
  { icon: 'mail', href: 'mailto:curator@journeyflicker.com', label: 'Email' },
  { icon: 'phone', href: 'tel:+15557829901', label: 'Phone' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-black text-white py-12 sm:py-16 md:py-20 relative overflow-hidden border-t border-white/5 font-sans">

      <div className="max-w-6xl mx-auto px-4 sm:px-8 relative z-10">

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 border-b border-white/10 pb-10 md:pb-12">

          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-5">
            <NavLink to="/" className="group inline-block">
              <span className="text-xl sm:text-2xl font-light tracking-tighter uppercase group-hover:text-primary transition-colors duration-300">
                Journey<span className="font-black">Flicker</span>
              </span>
            </NavLink>
            <p className="text-sm font-light text-white/40 leading-relaxed italic font-serif max-w-xs">
              "Providing architectural silence and profound discovery for the discerning voyager."
            </p>
            {/* Social icons */}
            <div className="flex gap-2 pt-1">
              {socialIcons.map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label}
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300">
                  <span className="material-symbols-outlined text-base font-light">{s.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Registry links */}
          <div className="space-y-4">
            <h4 className="text-[9px] font-black tracking-[0.5em] uppercase text-white/20">Registry</h4>
            <nav className="flex flex-col gap-2.5">
              {registry.map((link) => (
                <NavLink key={link} to={`/${link.toLowerCase()}`}
                  className="text-sm font-light text-white/50 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">
                  {link}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Intelligence links */}
          <div className="space-y-4">
            <h4 className="text-[9px] font-black tracking-[0.5em] uppercase text-white/20">Intelligence</h4>
            <nav className="flex flex-col gap-2.5">
              {intelligence.map((link) => (
                <NavLink key={link} to={link === 'Strategy' ? '/contact' : `/${link.toLowerCase()}`}
                  className="text-sm font-light text-white/50 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">
                  {link}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Bureau info */}
          <div className="space-y-4">
            <h4 className="text-[9px] font-black tracking-[0.5em] uppercase text-white/20">Bureau</h4>
            <address className="not-italic">
              <p className="text-sm font-light text-white/30 leading-loose tracking-wide">
                402 Silicon Drive<br />
                Suite 1200<br />
                California, USA 94025
              </p>
            </address>
            <div className="space-y-1 pt-1">
              <a href="mailto:curator@journeyflicker.com"
                className="text-[10px] text-white/30 hover:text-white transition-colors block tracking-wide">
                curator@journeyflicker.com
              </a>
              <a href="tel:+15557829901"
                className="text-[10px] text-white/30 hover:text-white transition-colors block tracking-wide">
                +1 (555) 782-9901
              </a>
            </div>
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="pt-6 flex flex-col lg:flex-row justify-between items-center gap-6 text-center lg:text-left">
          <div className="space-y-1.5 order-2 lg:order-1">
            <p className="text-[9px] font-black tracking-[0.6em] uppercase text-white/20">Experience curated travel at its finest</p>
            <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-white/30">
              © {year} JourneyFlicker Curator System · All Rights Reserved
            </p>
          </div>

          <div className="flex flex-wrap justify-center lg:justify-end items-center gap-3 sm:gap-5 order-1 lg:order-2">
            <span className="text-[8px] font-black tracking-[0.4em] uppercase text-white/20">Accreditations:</span>
            <span className="text-[9px] font-bold tracking-widest text-white/40 hover:text-white/80 transition-colors uppercase cursor-help" title="International Air Transport Association">IATA</span>
            <span className="text-[9px] font-bold tracking-widest text-white/40 hover:text-white/80 transition-colors uppercase cursor-help" title="Air Travel Organisers' Licensing">ATOL Protected</span>
            <span className="text-[9px] font-bold tracking-widest text-white/40 hover:text-white/80 transition-colors uppercase cursor-help" title="American Society of Travel Advisors">ASTA Member</span>
            <span className="text-[8px] font-bold tracking-widest text-white/40 hover:text-white/80 transition-colors uppercase border border-white/20 px-2 py-0.5 rounded-sm cursor-help" title="Quality Management System">ISO 9001:2015</span>
          </div>

          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 shrink-0 order-3"
            aria-label="Scroll to top">
            <span className="material-symbols-outlined font-light text-base">north</span>
          </button>
        </div>

      </div>
    </footer>
  );
}
