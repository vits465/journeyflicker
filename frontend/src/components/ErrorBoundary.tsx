import React, { Component, ErrorInfo, ReactNode } from "react";

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
    // If you have an error reporting service, you'd send the error here
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
              onClick={() => window.location.reload()}
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
