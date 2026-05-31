import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem("jf_cookie_consent");
    if (!consent) {
      // Small delay to make the entrance smooth and delightful
      const timer = setTimeout(() => {
        setVisible(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("jf_cookie_consent", "accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("jf_cookie_consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md bg-black/90 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[9999] animate-reveal-up font-sans">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-sm font-light">cookie</span>
          </div>
          <div>
            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-white/40 block">Telemetry Protocol</span>
            <h4 className="text-sm font-light tracking-tight text-white">Curated Telemetry & Cookies</h4>
          </div>
        </div>

        <p className="text-xs font-light text-white/60 leading-relaxed">
          We utilize essential and performance cookies to design profound travel itineraries, secure client telemetry, and orchestrate absolute discovery. Read more in our{" "}
          <Link to="/privacy-policy" className="text-primary hover:underline font-normal">
            Privacy Charter
          </Link>
          .
        </p>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={handleDecline}
            className="text-[9px] font-black tracking-[0.3em] uppercase text-white/40 hover:text-white transition-colors px-4 py-2"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="bg-white text-black hover:bg-primary hover:text-white px-5 py-2.5 rounded-full text-[9px] font-black tracking-[0.3em] uppercase transition-all shadow-sm active:scale-95"
          >
            Accept Charter
          </button>
        </div>
      </div>
    </div>
  );
}
