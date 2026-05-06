import { useState, useEffect, useRef } from 'react';

export function LazyImage({ 
  src, 
  alt, 
  className = "", 
  containerClassName = "",
  style,
  onLoad 
}: { 
  src: string; 
  alt: string; 
  className?: string; 
  containerClassName?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
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
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        className={`transition-all duration-1000 ease-out ${
          loaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-105'
        } ${className}`}
        style={style}
      />
    </div>
  );
}
