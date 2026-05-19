import React from "react";

type SkeletonProps = {
  type: "tour-card" | "destination-card" | "visa-row" | "hero";
  count?: number;
};

export function Skeleton({ type, count = 1 }: SkeletonProps) {
  const cards = Array.from({ length: count });

  if (type === "tour-card") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cards.map((_, i) => (
          <div key={i} className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden animate-pulse">
            {/* Image Placeholder */}
            <div className="h-64 bg-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer-line_2.5s_infinite_alternate]" />
            </div>
            {/* Card Content Placeholder */}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-3 w-1/4 bg-white/10 rounded-full" />
                <div className="h-3 w-1/3 bg-white/10 rounded-full" />
              </div>
              <div className="h-6 w-3/4 bg-white/15 rounded-full" />
              <div className="h-3 w-full bg-white/10 rounded-full" />
              <div className="h-3 w-5/6 bg-white/10 rounded-full" />
              <div className="pt-4 flex justify-between items-center border-t border-white/5">
                <div className="h-5 w-1/4 bg-white/15 rounded-full" />
                <div className="h-9 w-1/3 bg-white/15 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "destination-card") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((_, i) => (
          <div key={i} className="h-[380px] bg-[#18181b] border border-white/5 rounded-2xl p-6 flex flex-col justify-end space-y-3 relative overflow-hidden animate-pulse">
            {/* Background image shim */}
            <div className="absolute inset-0 bg-white/5" />
            <div className="relative z-10 space-y-3">
              <div className="h-3 w-1/3 bg-white/10 rounded-full" />
              <div className="h-6 w-3/4 bg-white/15 rounded-full" />
              <div className="h-3 w-full bg-white/10 rounded-full" />
              <div className="h-3 w-4/5 bg-white/10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "visa-row") {
    return (
      <div className="space-y-4 w-full">
        {cards.map((_, i) => (
          <div key={i} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-[#18181b] border border-white/5 rounded-2xl space-y-4 md:space-y-0 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-16 bg-white/10 rounded-lg" />
              <div className="space-y-2">
                <div className="h-5 w-32 bg-white/15 rounded-full" />
                <div className="h-3 w-20 bg-white/10 rounded-full" />
              </div>
            </div>
            <div className="flex space-x-8">
              <div className="space-y-2">
                <div className="h-3 w-16 bg-white/10 rounded-full" />
                <div className="h-4 w-20 bg-white/15 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-16 bg-white/10 rounded-full" />
                <div className="h-4 w-20 bg-white/15 rounded-full" />
              </div>
            </div>
            <div className="h-10 w-28 bg-white/15 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "hero") {
    return (
      <div className="w-full h-[60vh] bg-[#18181b] relative overflow-hidden animate-pulse flex items-end">
        <div className="absolute inset-0 bg-white/5" />
        <div className="max-w-7xl mx-auto w-full px-6 pb-16 space-y-4 relative z-10">
          <div className="h-3 w-24 bg-white/10 rounded-full" />
          <div className="h-12 w-2/3 bg-white/15 rounded-full" />
          <div className="h-4 w-1/2 bg-white/10 rounded-full" />
        </div>
      </div>
    );
  }

  return null;
}
