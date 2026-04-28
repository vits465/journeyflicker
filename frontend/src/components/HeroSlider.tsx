import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { optimizeImage } from '../lib/optimize';

export interface HeroSlide {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  tag?: string;
  href?: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
  autoPlayMs?: number;
  height?: string; // e.g. 'h-[70vh]' — applied directly
  /** When true, the per-slide title/tag/subtitle/CTA overlay is hidden (use when you supply children) */
  hideSlideText?: boolean;
  /** Extra content rendered centred on top of the slider (search bar, tagline, etc.) */
  children?: React.ReactNode;
  /** Show a skeleton placeholder while data loads */
  loading?: boolean;
}

export function HeroSlider({
  slides,
  autoPlayMs = 5000,
  height = 'h-screen min-h-[540px] max-h-[860px]',
  hideSlideText = false,
  children,
  loading = false,
}: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset to slide 0 whenever the slides array changes identity
  useEffect(() => { setCurrent(0); setPrev(null); }, [slides]);

  const goto = useCallback((index: number) => {
    if (transitioning || slides.length <= 1 || index === current) return;
    setPrev(current);
    setTransitioning(true);
    setProgress(0);
    setCurrent(index);
    setTimeout(() => { setPrev(null); setTransitioning(false); }, 800);
  }, [current, transitioning, slides.length]);

  const next = useCallback(() => {
    if (slides.length < 2) return;
    goto((current + 1) % slides.length);
  }, [goto, current, slides.length]);

  const goBack = useCallback(() => {
    if (slides.length < 2) return;
    goto((current - 1 + slides.length) % slides.length);
  }, [goto, current, slides.length]);

  // Auto-play
  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(next, autoPlayMs);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, autoPlayMs, slides.length]);

  // Progress bar
  useEffect(() => {
    setProgress(0);
    if (slides.length <= 1) return;
    const step = 100 / (autoPlayMs / 50);
    progressRef.current = setInterval(() => setProgress(p => Math.min(p + step, 100)), 50);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [current, autoPlayMs, slides.length]);

  // ── LOADING SKELETON ──
  if (loading) {
    return (
      <section className={`relative w-full ${height} overflow-hidden bg-black flex items-end pb-16 px-4 sm:px-8 md:px-16`}>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black animate-pulse" />
        {children && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto w-full">{children}</div>
          </div>
        )}
      </section>
    );
  }

  // ── NO SLIDES ──
  if (!slides.length) {
    return (
      <section className={`relative w-full ${height} overflow-hidden bg-black`}>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />
        {children && (
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="pointer-events-auto w-full">{children}</div>
          </div>
        )}
      </section>
    );
  }

  const slide = slides[current];

  return (
    <section className={`relative w-full ${height} overflow-hidden bg-black`}>

      {/* ── IMAGES (crossfade) ── */}
      {slides.map((s, i) => (
        <div key={s.id}
          className={`absolute inset-0 transition-opacity duration-[900ms] ease-in-out ${
            i === current ? 'opacity-100 z-10'
            : i === prev  ? 'opacity-0 z-10'
            : 'opacity-0 z-0'
          }`}>
          <img
            src={optimizeImage(s.imageUrl, 1920)}
            alt={s.title}
            className={`w-full h-full object-cover transition-transform duration-[7s] ease-out ${i === current ? 'scale-105' : 'scale-100'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/55" />
        </div>
      ))}

      {/* ── SLIDE TEXT (only when hideSlideText is false and no children are provided) ── */}
      {!hideSlideText && !children && (
        <div className="absolute inset-x-0 bottom-0 z-20 pb-14 sm:pb-18 md:pb-22 px-4 sm:px-8 md:px-16 pointer-events-none">
          <div className="max-w-6xl mx-auto">
            {slide.tag && (
              <div className="mb-3 animate-reveal-up">
                <span className="inline-flex items-center gap-2 border border-white/20 bg-white/10 backdrop-blur-sm text-white/80 text-[9px] font-black tracking-[0.5em] uppercase px-4 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {slide.tag}
                </span>
              </div>
            )}
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tighter leading-tight text-white mb-2 drop-shadow-2xl max-w-3xl animate-reveal-up">
              {slide.title}
            </h2>
            {slide.subtitle && (
              <p className="text-sm font-light text-white/55 max-w-xl leading-relaxed mb-5 italic animate-reveal-up">
                {slide.subtitle}
              </p>
            )}
            {slide.href && (
              <button
                onClick={() => navigate(slide.href!)}
                className="pointer-events-auto inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full text-[10px] font-black tracking-[0.4em] uppercase hover:bg-primary hover:text-white transition-all duration-300 shadow-xl animate-reveal-up">
                View Dossier
                <span className="material-symbols-outlined font-light text-sm">arrow_outward</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── CHILDREN OVERLAY (centred, z-above images) ── */}
      {children && (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
          <div className="pointer-events-auto w-full">{children}</div>
        </div>
      )}

      {/* ── CONTROLS ── */}
      {slides.length > 1 && (
        <>
          {/* Prev arrow */}
          <button onClick={goBack}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all duration-200 shadow-lg">
            <span className="material-symbols-outlined font-light text-xl leading-none">chevron_left</span>
          </button>
          {/* Next arrow */}
          <button onClick={next}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all duration-200 shadow-lg">
            <span className="material-symbols-outlined font-light text-xl leading-none">chevron_right</span>
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => goto(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? 'bg-white w-6 h-2' : 'bg-white/35 hover:bg-white/60 w-2 h-2'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 z-30 h-[2px] bg-white/10">
            <div className="h-full bg-primary" style={{ width: `${progress}%`, transition: 'width 50ms linear' }} />
          </div>

          {/* Counter */}
          <div className="absolute top-20 sm:top-24 right-4 sm:right-8 z-30 text-white/35 text-[9px] font-black tracking-[0.4em] uppercase">
            {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </div>
        </>
      )}
    </section>
  );
}
