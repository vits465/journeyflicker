import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/tours", label: "Tours" },
  { to: "/destinations", label: "Destinations" },
  { to: "/visas", label: "Visas" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileOpen]);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isLight = scrolled || mobileOpen;

  return (
    <>
      {/* ── NAVBAR ── */}
      <header className={`fixed top-0 w-full z-[100] transition-all duration-500 ${isLight ? 'bg-white/95 backdrop-blur shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex justify-between items-center">

          {/* Logo */}
          <NavLink to="/" className="flex items-center z-[110] transition-transform hover:scale-105 duration-300">
            <span className={`text-lg sm:text-xl font-light tracking-tighter uppercase transition-colors duration-500 ${isLight ? 'text-black' : 'text-white'}`}>
              Journey<span className="font-black">Flicker</span>
            </span>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                className={({ isActive }) =>
                  `text-[10px] tracking-[0.3em] uppercase font-sans transition-all duration-300 ${
                    isActive
                      ? `font-black border-b-2 border-current pb-0.5 ${isLight ? 'text-black' : 'text-white'}`
                      : `font-bold ${isLight ? 'text-black/50 hover:text-black' : 'text-white/60 hover:text-white'}`
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink to="/contact"
              className={`ml-2 px-5 py-2 rounded-full text-[10px] font-black tracking-[0.3em] uppercase transition-all duration-300 ${
                isLight
                  ? 'bg-black text-white hover:bg-primary'
                  : 'bg-white/10 text-white border border-white/30 hover:bg-white hover:text-black'
              }`}>
              Inquire
            </NavLink>
          </nav>

          {/* Mobile toggle */}
          <button
            className={`lg:hidden p-2.5 rounded-xl transition-all duration-300 z-[110] ${isLight ? 'bg-surface-container-low text-black' : 'bg-white/10 text-white border border-white/20'}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <span className="material-symbols-outlined font-light text-2xl leading-none block" style={{ fontSize: '22px' }}>
              {mobileOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </header>

      {/* ── MOBILE MENU OVERLAY ── */}
      <div className={`fixed inset-0 bg-white z-[90] lg:hidden transition-all duration-500 ease-out ${mobileOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col h-full px-6 pt-24 pb-10">

          {/* Nav links */}
          <nav className="flex flex-col gap-1 flex-1">
            {navItems.map((item, i) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                className={({ isActive }) =>
                  `text-3xl sm:text-4xl font-light tracking-tighter transition-all duration-300 py-3 border-b border-outline-variant/10 transform ${
                    mobileOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                  } ${isActive ? 'text-black font-black' : 'text-on-surface-variant/50 hover:text-black'}`
                }
                style={{ transitionDelay: `${i * 0.04}s` }}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* CTA + contact info */}
          <div className={`pt-6 space-y-5 transition-all duration-500 delay-300 transform ${mobileOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <NavLink to="/contact"
              className="block bg-black text-white px-8 py-4 rounded-xl text-[10px] font-black tracking-[0.5em] uppercase text-center hover:bg-primary transition-all shadow-lg">
              Inquire Strategy
            </NavLink>
            <div className="flex items-center justify-center gap-6 text-[9px] font-bold tracking-widest uppercase text-on-surface-variant/40">
              <a href="mailto:curator@journeyflicker.com" className="hover:text-black transition-colors">Email Us</a>
              <span>·</span>
              <a href="tel:+15557829901" className="hover:text-black transition-colors">Call Us</a>
            </div>
          </div>
        </div>

        {/* Decorative bg text */}
        <div className="absolute bottom-6 right-4 text-6xl font-black text-black/[0.03] select-none pointer-events-none uppercase">DOSSIER</div>
      </div>
    </>
  );
}
