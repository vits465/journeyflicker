import { useState, useEffect, useRef } from 'react';
import { generateSrcSet } from '../lib/optimize';

export function LazyImage({ 
  src, 
  alt, 
  className = "", 
  containerClassName = "",
  style,
  onLoad,
  priority = false,
  sizes = "(max-width: 600px) 400px, (max-width: 1024px) 800px, 1200px"
}: { 
  src: string; 
  alt: string; 
  className?: string; 
  containerClassName?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  priority?: boolean;
  sizes?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Check if the image is already loaded from cache
    if (imgRef.current && imgRef.current.complete) {
      setLoaded(true);
      onLoad?.();
    }
  }, [src, onLoad]);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  return (
    <div className={`relative overflow-hidden bg-surface-container-low dark:bg-black/20 ${containerClassName}`} style={style}>
      {/* Loading Skeleton */}
      <div 
        className={`absolute inset-0 animate-pulse bg-outline-variant/10 dark:bg-white/5 transition-opacity duration-500 ${
          loaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`} 
      />
      
      {/* Actual Image */}
      <img
        ref={imgRef}
        src={src}
        srcSet={generateSrcSet(src)}
        sizes={sizes}
        alt={alt}
        loading={priority ? undefined : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        onLoad={handleLoad}
        className={`transition-all duration-1000 ease-out ${
          loaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-105'
        } ${className}`}
        style={style}
      />
    </div>
  );
}
