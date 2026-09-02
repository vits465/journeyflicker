import { useEffect, useRef, useState, useCallback } from 'react';

interface AutoCarouselProps {
  children: React.ReactNode[];
  autoPlayMs?: number;
  pauseOnHover?: boolean;
  disableScaling?: boolean;
}

export function AutoCarousel({ children, autoPlayMs = 0, pauseOnHover = true, disableScaling = false }: AutoCarouselProps) {
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex(i => (i + 1) % children.length);
  }, [children.length]);

  const prev = useCallback(() => {
    setIndex(i => (i - 1 + children.length) % children.length);
  }, [children.length]);

  useEffect(() => {
    if (isPaused || !autoPlayMs || autoPlayMs <= 0) return;
    const timer = setInterval(next, autoPlayMs);
    return () => clearInterval(timer);
  }, [next, autoPlayMs, isPaused]);

  useEffect(() => {
    if (containerRef.current) {
      const child = containerRef.current.children[index] as HTMLElement;
      if (child) {
        const containerWidth = containerRef.current.offsetWidth;
        const childWidth = child.offsetWidth;
        const scrollLeft = child.offsetLeft - (containerWidth / 2) + (childWidth / 2);
        
        containerRef.current.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [index]);

  return (
    <div className="relative group" 
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <div 
        ref={containerRef}
        className="flex gap-5 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory px-4 sm:px-[15vw] md:px-[20vw] lg:px-[25vw] py-4"
      >
        {children.map((child, i) => (
          <div
            key={i}
            onClick={() => setIndex(i)}
            className={`shrink-0 snap-center transition-all duration-500 cursor-pointer ${
              disableScaling
                ? 'scale-100 opacity-100'
                : (i === index
                  ? 'scale-100 opacity-100 ring-2 ring-primary/60 shadow-2xl rounded-2xl z-10'
                  : 'scale-[0.94] opacity-90 brightness-95 hover:opacity-100 hover:brightness-100 hover:scale-[0.98] rounded-2xl')
            }`}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <button 
        type="button"
        onClick={(e) => { e.stopPropagation(); prev(); }}
        aria-label="Previous slide"
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white hover:text-black hover:scale-110 transition-all opacity-80 sm:opacity-90 hover:opacity-100 shadow-xl z-20"
      >
        <span className="material-symbols-outlined font-light text-lg">chevron_left</span>
      </button>
      <button 
        type="button"
        onClick={(e) => { e.stopPropagation(); next(); }}
        aria-label="Next slide"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white hover:text-black hover:scale-110 transition-all opacity-80 sm:opacity-90 hover:opacity-100 shadow-xl z-20"
      >
        <span className="material-symbols-outlined font-light text-lg">chevron_right</span>
      </button>

      {/* Progress dots */}
      <div className="flex justify-center items-center gap-2 mt-4 sm:mt-6">
        {children.map((_, i) => (
          <button 
            key={i} 
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-500 ${i === index ? 'bg-primary w-8 shadow-sm' : 'bg-outline-variant/30 hover:bg-outline-variant/60 w-3'}`}
          />
        ))}
      </div>
    </div>
  );
}
