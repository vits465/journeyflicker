import React, { Component, ErrorInfo, ReactNode } from "react";
import { reportError } from "../lib/errorReporter";
import { safeSessionStorage } from "../lib/storage";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // 1. Send the error strictly to the Admin Panel's System Health dashboard
    reportError(error, "React ErrorBoundary");

    // 2. Auto-Healing Mechanism: Automatically reload once to clear transient errors
    const lastCrash = safeSessionStorage.getItem('jf_last_crash');
    const now = Date.now();
    
    const msg = error?.message || String(error);
    const isChunkError = msg.includes("Failed to fetch dynamically imported module") || 
                         msg.includes("ChunkLoadError") || 
                         msg.includes("Loading chunk") ||
                         msg.includes("reading 'default'") ||
                         msg.includes("properties of undefined");

    if (isChunkError) {
      console.warn("Chunk load error caught in React ErrorBoundary. Triggering force cache clear and reload...");
      const lastForceReload = safeSessionStorage.getItem('jf_last_force_reload');
      if (!lastForceReload || (now - parseInt(lastForceReload)) > 10000) {
        safeSessionStorage.setItem('jf_last_force_reload', now.toString());
        
        try {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
              const promises = registrations.map(r => r.unregister());
              let cachePromise: Promise<any> = Promise.resolve();
              try {
                if ('caches' in window) {
                  cachePromise = caches.keys().then(names => 
                    Promise.all(names.map(name => caches.delete(name)))
                  ).catch(() => Promise.resolve());
                }
              } catch (cErr) {
                console.warn("Cache API cleanup failed inside ErrorBoundary:", cErr);
              }

              Promise.all([...promises, cachePromise]).then(() => {
                try {
                  const url = new URL(window.location.href);
                  url.searchParams.set('cb', Date.now().toString());
                  window.location.replace(url.toString());
                } catch {
                  window.location.reload();
                }
              }).catch(() => {
                window.location.reload();
              });
            }).catch(() => {
              window.location.reload();
            });
          } else {
            try {
              const url = new URL(window.location.href);
              url.searchParams.set('cb', Date.now().toString());
              window.location.replace(url.toString());
            } catch {
              window.location.reload();
            }
          }
        } catch (swErr) {
          console.warn("ServiceWorker registrations cleanup failed inside ErrorBoundary:", swErr);
          try {
            const url = new URL(window.location.href);
            url.searchParams.set('cb', Date.now().toString());
            window.location.replace(url.toString());
          } catch {
            window.location.reload();
          }
        }
        return;
      }
    }

    if (!lastCrash || (now - parseInt(lastCrash)) > 10000) {
      // It hasn't crashed in the last 10 seconds, so this is likely a transient glitch.
      // Auto-heal by refreshing transparently!
      safeSessionStorage.setItem('jf_last_crash', now.toString());
      window.location.reload();
    }
  }
  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#04090F] text-white p-6 font-['Outfit',sans-serif]">
          <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-sm shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-red-400 text-3xl">error</span>
            </div>
            <h1 className="text-2xl font-bold text-[#E8C870] mb-3 font-serif tracking-wide">Something went wrong</h1>
            <p className="text-white/60 text-sm mb-8 leading-relaxed">
              We've encountered an unexpected issue while loading this page. Please try refreshing.
            </p>
            <button
              onClick={() => {
                safeSessionStorage.removeItem('jf_last_crash');
                window.location.reload();
              }}
              className="px-6 py-3 bg-[#C8A84B] hover:bg-[#E8C870] text-black font-bold text-xs tracking-widest uppercase rounded-full transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
