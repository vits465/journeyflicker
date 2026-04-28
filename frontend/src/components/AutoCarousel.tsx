import { useEffect, useRef, useState, useCallback } from 'react';

interface AutoCarouselProps {
  children: React.ReactNode[];
  autoPlayMs?: number;
  pauseOnHover?: boolean;
}

export function AutoCarousel({ children, autoPlayMs = 4000, pauseOnHover = true }: AutoCarouselProps) {
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
    if (isPaused || !autoPlayMs) return;
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
        className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory px-[25vw]"
      >
        {children.map((child, i) => (
          <div key={i} className={`shrink-0 snap-center transition-all duration-700 ${i === index ? 'scale-100 opacity-100' : 'scale-90 opacity-40'}`}>
            {child}
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100 z-20">
        <span className="material-symbols-outlined font-light">chevron_left</span>
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100 z-20">
        <span className="material-symbols-outlined font-light">chevron_right</span>
      </button>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mt-8">
        {children.map((_, i) => (
          <button 
            key={i} 
            onClick={() => setIndex(i)}
            className={`h-1 rounded-full transition-all duration-500 ${i === index ? 'bg-primary w-8' : 'bg-outline-variant/30 w-3'}`}
          />
        ))}
      </div>
    </div>
  );
}
