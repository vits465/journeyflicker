import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useSearch } from "../lib/searchContext";
import { useTheme } from "../context/ThemeContext";

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
  const { theme, toggleTheme } = useTheme();
  const { openSearch } = useSearch();
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

  const isGlass = scrolled || mobileOpen;
  const isDark = theme === 'dark';

  return (
    <>
      {/* ── NAVBAR ── */}
      <header className={`fixed top-0 w-full z-[100] transition-all duration-500 ${isGlass ? 'bg-white/95 dark:bg-black/90 backdrop-blur shadow-sm dark:shadow-white/5 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex justify-between items-center">

          {/* Logo */}
          <NavLink to="/" className="flex items-center z-[110] transition-transform hover:scale-105 duration-300">
            <span className={`text-lg sm:text-xl font-light tracking-tighter uppercase transition-colors duration-500 ${isGlass ? 'text-black dark:text-white' : 'text-white'}`}>
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
                      ? `font-black border-b-2 border-current pb-0.5 ${isGlass ? 'text-black dark:text-white' : 'text-white'}`
                      : `font-bold ${isGlass ? 'text-black/50 dark:text-white/40 hover:text-black dark:hover:text-white' : 'text-white/60 hover:text-white'}`
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            
            <button 
              onClick={openSearch}
              className={`p-2 flex items-center justify-center transition-all duration-300 ${isGlass ? 'text-black/50 dark:text-white/40 hover:text-black dark:hover:text-white' : 'text-white/60 hover:text-white'}`}
            >
              <span className="material-symbols-outlined font-light text-xl">search</span>
            </button>

            <button 
              onClick={toggleTheme}
              className={`p-2 flex items-center justify-center transition-all duration-300 ${isGlass ? 'text-black/50 dark:text-white/40 hover:text-black dark:hover:text-white' : 'text-white/60 hover:text-white'}`}
            >
              <span className="material-symbols-outlined font-light text-xl">{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>

            <NavLink to="/contact"
              className={`ml-2 px-5 py-2 rounded-full text-[10px] font-black tracking-[0.3em] uppercase transition-all duration-300 ${
                isGlass
                  ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-primary dark:hover:bg-gray-200 shadow-lg dark:shadow-white/5'
                  : 'bg-white/10 text-white border border-white/30 hover:bg-white hover:text-black'
              }`}>
              Inquire
            </NavLink>
          </nav>

          {/* Mobile toggle area */}
          <div className="flex items-center gap-2 lg:hidden z-[110]">
            <button 
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all duration-300 ${isGlass ? 'text-black dark:text-white bg-surface-container-low dark:bg-white/5' : 'text-white bg-white/10 border border-white/20'}`}
            >
              <span className="material-symbols-outlined font-light text-xl block">{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <button 
              onClick={openSearch}
              className={`p-2.5 rounded-xl transition-all duration-300 ${isGlass ? 'text-black dark:text-white bg-surface-container-low dark:bg-white/5' : 'text-white bg-white/10 border border-white/20'}`}
            >
              <span className="material-symbols-outlined font-light text-xl block">search</span>
            </button>
            <button
              className={`p-2.5 rounded-xl transition-all duration-300 ${isGlass ? 'bg-surface-container-low dark:bg-white/5 text-black dark:text-white' : 'bg-white/10 text-white border border-white/20'}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              <span className="material-symbols-outlined font-light text-2xl leading-none block" style={{ fontSize: '22px' }}>
                {mobileOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE MENU OVERLAY ── */}
      <div className={`fixed inset-0 bg-white dark:bg-black z-[90] lg:hidden transition-all duration-500 ease-out ${mobileOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col h-full px-6 pt-24 pb-10">

          {/* Nav links */}
          <nav className="flex flex-col gap-1 flex-1">
            {navItems.map((item, i) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                className={({ isActive }) =>
                  `text-3xl sm:text-4xl font-light tracking-tighter transition-all duration-300 py-3 border-b border-outline-variant/10 dark:border-white/5 transform ${
                    mobileOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                  } ${isActive ? 'text-black dark:text-white font-black' : 'text-on-surface-variant/50 dark:text-white/30 hover:text-black dark:hover:text-white'}`
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
              className="block bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-xl text-[10px] font-black tracking-[0.5em] uppercase text-center hover:bg-primary dark:hover:bg-gray-200 transition-all shadow-lg dark:shadow-white/5">
              Inquire Strategy
            </NavLink>
            <div className="flex items-center justify-center gap-6 text-[9px] font-bold tracking-widest uppercase text-on-surface-variant/40 dark:text-white/20">
              <a href="mailto:curator@journeyflicker.com" className="hover:text-black dark:hover:text-white transition-colors">Email Us</a>
              <span>·</span>
              <a href="tel:+15557829901" className="hover:text-black dark:hover:text-white transition-colors">Call Us</a>
            </div>
          </div>
        </div>

        {/* Decorative bg text */}
        <div className="absolute bottom-6 right-4 text-6xl font-black text-black/[0.03] dark:text-white/[0.03] select-none pointer-events-none uppercase">DOSSIER</div>
      </div>
    </>
  );
}
