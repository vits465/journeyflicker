import { NavLink } from "react-router-dom";

const registry = ['Tours', 'Destinations', 'Visas', 'About'];
const intelligence = ['FAQ', 'Contact', 'Strategy'];

const socialIcons = [
  { svgPath: "M12.031 0C5.388 0 0 5.39 0 12.031c0 2.128.552 4.148 1.603 5.952L.15 23.364l5.525-1.448A11.97 11.97 0 0012.031 24c6.643 0 12.031-5.39 12.031-12.031S18.674 0 12.031 0zm0 22.016c-1.802 0-3.568-.485-5.112-1.4L6.5 20.37l-3.27.857.873-3.187-.272-.432A10.038 10.038 0 012.016 12.03c0-5.54 4.508-10.047 10.047-10.047s10.047 4.507 10.047 10.047-4.507 10.047-10.047 10.047zm5.532-7.535c-.303-.152-1.794-.886-2.072-.988-.278-.101-.482-.152-.684.152-.202.303-.785.988-.96 1.19-.176.202-.353.228-.656.076-.303-.152-1.28-.472-2.438-1.505-.902-.803-1.51-1.794-1.686-2.097-.176-.303-.018-.466.134-.618.135-.135.303-.353.454-.53.152-.176.202-.303.303-.505.101-.202.05-.38-.026-.53-.076-.152-.684-1.648-.937-2.254-.246-.593-.497-.512-.684-.521-.176-.01-.38-.01-.582-.01-.202 0-.53.076-.808.38-.278.303-1.062 1.037-1.062 2.53s1.088 2.934 1.24 3.136c.152.202 2.138 3.262 5.178 4.572.722.313 1.286.498 1.724.639.724.23 1.385.196 1.905.118.583-.087 1.794-.733 2.046-1.442.252-.708.252-1.314.176-1.442-.075-.126-.277-.202-.58-.354z", href: 'https://wa.me/919879268811', label: 'WhatsApp' },
  { svgPath: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z", href: 'https://www.instagram.com/journeyflicker?igsh=MWxxMXZ1bGR1Zjh3MQ==', label: 'Instagram' },
  { icon: 'mail', href: 'mailto:tushar@journeyflicker.com', label: 'Email' },
  { icon: 'phone', href: 'tel:+919879268811', label: 'Phone' },
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
                <a key={s.label} href={s.href} aria-label={s.label} title={s.label}
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300">
                  {s.svgPath ? (
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                      <path d={s.svgPath} />
                    </svg>
                  ) : (
                    <span className="material-symbols-outlined text-base font-light">{s.icon}</span>
                  )}
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
                103, Raj Victoria<br />
                Near Samarth Circle, Adajan<br />
                Surat - 395009, Gujarat, India
              </p>
            </address>
            <div className="space-y-1 pt-1">
              <a href="mailto:tushar@journeyflicker.com"
                className="text-[10px] text-white/30 hover:text-white transition-colors block tracking-wide">
                tushar@journeyflicker.com
              </a>
              <a href="tel:+919879268811"
                className="text-[10px] text-white/30 hover:text-white transition-colors block tracking-wide">
                +91 98792 68811
              </a>
              <a href="tel:02613564717"
                className="text-[10px] text-white/30 hover:text-white transition-colors block tracking-wide">
                0261 3564717
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
