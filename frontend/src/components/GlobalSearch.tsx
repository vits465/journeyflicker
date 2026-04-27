import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Destination, type Tour } from '../lib/api';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ destinations: Destination[]; tours: Tour[] }>({ destinations: [], tours: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      setQuery('');
      setResults({ destinations: [], tours: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 1) {
        setLoading(true);
        try {
          const res = await api.search(query);
          setResults(res);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults({ destinations: [], tours: [] });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-10 bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden mt-10 animate-reveal-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-6 border-b border-outline-variant/10 flex items-center gap-4">
          <span className="material-symbols-outlined text-primary font-light text-2xl">search</span>
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Search territories, expeditions, or regions..."
            className="flex-1 bg-transparent border-none outline-none text-lg font-light placeholder:text-on-surface-variant/30"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && onClose()}
          />
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container-low transition-colors flex items-center justify-center text-on-surface-variant/50"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center text-on-surface-variant/30 italic font-light">
              <span className="material-symbols-outlined animate-spin mb-2">progress_activity</span>
              Consulting the registry...
            </div>
          )}

          {!loading && query.length > 1 && results.destinations.length === 0 && results.tours.length === 0 && (
            <div className="py-20 text-center text-on-surface-variant/40 italic font-light">
              No matches found for "{query}" in the active directories.
            </div>
          )}

          {!loading && query.length <= 1 && (
            <div className="py-20 text-center text-on-surface-variant/20 italic font-light">
              Enter at least 2 characters to begin search.
            </div>
          )}

          {!loading && (results.destinations.length > 0 || results.tours.length > 0) && (
            <div className="space-y-8 p-2">
              {/* Destinations Section */}
              {results.destinations.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4 px-2">
                    <span className="text-[9px] font-black tracking-[0.4em] uppercase text-primary">Territories</span>
                    <div className="h-px bg-outline-variant/20 flex-1" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {results.destinations.map(d => (
                      <div 
                        key={d.id}
                        onClick={() => { navigate(`/destinations/${d.id}`); onClose(); }}
                        className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-container-low cursor-pointer transition-all border border-transparent hover:border-outline-variant/20"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black">
                          <img src={d.heroImageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={d.name} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors italic">{d.name}</h4>
                          <p className="text-[10px] text-on-surface-variant tracking-widest uppercase font-bold opacity-50">{d.region}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tours Section */}
              {results.tours.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4 px-2">
                    <span className="text-[9px] font-black tracking-[0.4em] uppercase text-primary">Expeditions</span>
                    <div className="h-px bg-outline-variant/20 flex-1" />
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {results.tours.map(t => (
                      <div 
                        key={t.id}
                        onClick={() => { navigate(`/tours/${t.id}`); onClose(); }}
                        className="group flex items-center gap-5 p-3 rounded-2xl hover:bg-surface-container-low cursor-pointer transition-all border border-transparent hover:border-outline-variant/20"
                      >
                        <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-black">
                          <img src={t.heroImageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={t.name} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors italic">{t.name}</h4>
                            <span className="text-[10px] font-black tracking-widest uppercase text-on-surface-variant opacity-30">{t.days} Days</span>
                          </div>
                          <p className="text-[10px] text-on-surface-variant tracking-widest uppercase font-bold opacity-50">{t.category} · {t.region}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/5 text-center">
          <p className="text-[9px] font-black tracking-[0.3em] uppercase text-on-surface-variant/30 italic">
            Global Search Protocol v3.1 — Verified Registry Results Only
          </p>
        </div>
      </div>
    </div>
  );
}
