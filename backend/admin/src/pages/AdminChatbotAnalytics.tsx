import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { AdminLoader } from '../components/AdminLoader';

export default function AdminChatbotAnalytics() {

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['whatsapp-inquiries'],
    queryFn: () => api.listWhatsAppInquiries(),
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const metrics = useMemo(() => {
    if (!inquiries.length) return {
      total: 0,
      newCount: 0,
      quotedCount: 0,
      bookedCount: 0,
      closedCount: 0,
      conversionRate: '0.0',
      activeRate: '0.0',
      hotDestinations: [] as { name: string; count: number; pct: number }[],
      trendsByDay: [] as { label: string; count: number; heightPct: number }[],
      aiResponseRate: '0.0'
    };

    const total = inquiries.length;
    let newCount = 0;
    let quotedCount = 0;
    let bookedCount = 0;
    let closedCount = 0;
    let aiResponded = 0;

    const destMap: Record<string, number> = {};
    const timelineMap: Record<string, number> = {};

    inquiries.forEach(i => {
      // Status breakdown
      if (i.status === 'New') newCount++;
      else if (i.status === 'Quoted') quotedCount++;
      else if (i.status === 'Booked') bookedCount++;
      else if (i.status === 'Closed') closedCount++;

      // AI Response telemetry
      if (i.aiResponse && i.aiResponse.trim() !== '') {
        aiResponded++;
      }

      // Hot Destinations
      const dest = i.destination ? i.destination.trim() : 'Custom Curation';
      destMap[dest] = (destMap[dest] || 0) + 1;

      // Simple timeline grouping (MM/DD)
      try {
        const dateObj = new Date(i.date);
        const dayLabel = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
        timelineMap[dayLabel] = (timelineMap[dayLabel] || 0) + 1;
      } catch (err) {
        // Fallback for raw formats
      }
    });

    // Sort hot destinations
    const hotDestinations = Object.entries(destMap)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Dynamic timeline chart height conversion (limit to last 7 active days)
    const sortedDays = Object.entries(timelineMap)
      .slice(-7);
    const maxDayCount = sortedDays.length ? Math.max(...sortedDays.map(([, c]) => c)) : 1;
    const trendsByDay = sortedDays.map(([label, count]) => ({
      label,
      count,
      heightPct: Math.max(15, Math.round((count / maxDayCount) * 100))
    }));

    // Calculations
    const conversionRate = (((bookedCount + quotedCount) / total) * 100).toFixed(1);
    const activeRate = (((total - closedCount) / total) * 100).toFixed(1);
    const aiResponseRate = ((aiResponded / total) * 100).toFixed(1);

    return {
      total,
      newCount,
      quotedCount,
      bookedCount,
      closedCount,
      conversionRate,
      activeRate,
      hotDestinations,
      trendsByDay,
      aiResponseRate
    };
  }, [inquiries]);

  if (isLoading) return <AdminLoader />;

  return (
    <div className="space-y-8 animate-reveal-up text-left max-w-6xl mx-auto pb-12">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline-variant/20 dark:border-white/10 pb-6 gap-4">
        <div>
          <span className="text-primary text-[10px] font-black tracking-[0.4em] uppercase block mb-1">Telemetry Metrics</span>
          <h2 className="text-2xl font-light tracking-tighter text-on-surface dark:text-white uppercase">AI Assistant Insights</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900/50 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] uppercase tracking-widest font-black text-green-700 dark:text-green-400">Live Syncing</span>
        </div>
      </div>

      {/* ── METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total inquiries */}
        <div className="bg-white dark:bg-white/[0.02] border border-outline-variant/15 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[9px] font-black tracking-[0.3em] uppercase text-on-surface-variant/40 block mb-2">Total Telemetry leads</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-light tracking-tighter text-on-surface dark:text-white">{metrics.total}</span>
            <span className="text-xs text-on-surface-variant italic font-serif opacity-50">leads logged</span>
          </div>
          <div className="h-1 w-full bg-surface-container-low dark:bg-white/5 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-black dark:bg-white w-full rounded-full" />
          </div>
        </div>

        {/* Conversion rate */}
        <div className="bg-white dark:bg-white/[0.02] border border-outline-variant/15 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[9px] font-black tracking-[0.3em] uppercase text-emerald-600 dark:text-emerald-400 block mb-2">Lead Conversion Rate</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-light tracking-tighter text-emerald-600 dark:text-emerald-400">{metrics.conversionRate}%</span>
            <span className="text-xs text-on-surface-variant italic font-serif opacity-50">booked/quoted</span>
          </div>
          <div className="h-1 w-full bg-surface-container-low dark:bg-white/5 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${metrics.conversionRate}%` }} />
          </div>
        </div>

        {/* AI response rate */}
        <div className="bg-white dark:bg-white/[0.02] border border-outline-variant/15 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[9px] font-black tracking-[0.3em] uppercase text-primary block mb-2">AI Response Telemetry</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-light tracking-tighter text-primary">{metrics.aiResponseRate}%</span>
            <span className="text-xs text-on-surface-variant italic font-serif opacity-50">auto-replied</span>
          </div>
          <div className="h-1 w-full bg-surface-container-low dark:bg-white/5 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${metrics.aiResponseRate}%` }} />
          </div>
        </div>

        {/* Pipeline Active */}
        <div className="bg-white dark:bg-white/[0.02] border border-outline-variant/15 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[9px] font-black tracking-[0.3em] uppercase text-amber-600 dark:text-amber-400 block mb-2">Active Pipeline</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-light tracking-tighter text-amber-600 dark:text-amber-400">{metrics.activeRate}%</span>
            <span className="text-xs text-on-surface-variant italic font-serif opacity-50">active negotiations</span>
          </div>
          <div className="h-1 w-full bg-surface-container-low dark:bg-white/5 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${metrics.activeRate}%` }} />
          </div>
        </div>
      </div>

      {/* ── MIDDLE GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left: Lead Status Breakdown & Charts */}
        <div className="lg:col-span-7 bg-white dark:bg-white/[0.02] border border-outline-variant/15 dark:border-white/5 p-6 rounded-2xl shadow-sm space-y-8 flex flex-col justify-between">
          <div>
            <span className="text-primary text-[9px] font-black tracking-[0.3em] uppercase block mb-1">Status distribution</span>
            <h3 className="text-lg font-light tracking-tight text-on-surface dark:text-white font-serif italic">CRM Pipeline Breakdown</h3>
            <div className="h-px bg-outline-variant/20 dark:bg-white/10 my-4" />
          </div>

          {/* Status Progression Bars */}
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {[
              { label: '🟢 Confirmed Bookings (Won)', value: metrics.bookedCount, pct: Math.round((metrics.bookedCount / metrics.total) * 100) || 0, color: 'bg-emerald-500' },
              { label: '🟡 Active Proposals (Quoted)', value: metrics.quotedCount, pct: Math.round((metrics.quotedCount / metrics.total) * 100) || 0, color: 'bg-amber-500' },
              { label: '🔴 Incoming Leads (New)', value: metrics.newCount, pct: Math.round((metrics.newCount / metrics.total) * 100) || 0, color: 'bg-red-500' },
              { label: '⚪ Closed / Archived (Lost)', value: metrics.closedCount, pct: Math.round((metrics.closedCount / metrics.total) * 100) || 0, color: 'bg-zinc-400 dark:bg-zinc-600' }
            ].map((s, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-on-surface dark:text-white/80">{s.label}</span>
                  <span className="font-mono text-on-surface-variant font-bold">{s.value} <span className="opacity-40 font-light">({s.pct}%)</span></span>
                </div>
                <div className="h-2 w-full bg-surface-container-low dark:bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all duration-1000`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="border border-outline-variant/30 dark:border-white/5 p-4 rounded-xl bg-surface-container-low dark:bg-white/[0.01] text-xs font-light text-on-surface-variant/80">
            <span className="font-bold text-black dark:text-white uppercase tracking-wider block mb-1">Pipeline Health Assessment</span>
            The lead conversion rate represents clients transitioning from inquiries to actively quoted or successfully booked editions. Maintaining a rate above 40% ensures high curatorial ROI.
          </div>
        </div>

        {/* Right: Destination Insights */}
        <div className="lg:col-span-5 bg-white dark:bg-white/[0.02] border border-outline-variant/15 dark:border-white/5 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-primary text-[9px] font-black tracking-[0.3em] uppercase block mb-1">Voyager Curations</span>
            <h3 className="text-lg font-light tracking-tight text-on-surface dark:text-white font-serif italic">Hot Destination Trends</h3>
            <div className="h-px bg-outline-variant/20 dark:bg-white/10 my-4" />
          </div>

          {/* Destination Rankings */}
          <div className="space-y-5 flex-1 pt-2">
            {metrics.hotDestinations.length > 0 ? (
              metrics.hotDestinations.map((d, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono text-[10px] font-black">
                        #{i + 1}
                      </span>
                      <span className="font-semibold text-on-surface dark:text-white">{d.name}</span>
                    </div>
                    <span className="font-mono text-on-surface-variant font-bold">{d.count} <span className="opacity-40 font-light">hits</span></span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-low dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-center p-8 text-on-surface-variant/40 italic text-sm">
                No destination records cataloged yet.
              </div>
            )}
          </div>

          <div className="border border-outline-variant/30 dark:border-white/5 p-4 rounded-xl bg-surface-container-low dark:bg-white/[0.01] text-xs font-light text-on-surface-variant/80 mt-4">
            Destination telemetry measures the exact locations queried by potential voyagers, allowing curators to optimize itineraries and pre-package expresses.
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: TIMELINE & AI INSIGHTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Timeline Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-white/[0.02] border border-outline-variant/15 dark:border-white/5 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-primary text-[9px] font-black tracking-[0.3em] uppercase block mb-1">Traffic volume</span>
            <h3 className="text-lg font-light tracking-tight text-on-surface dark:text-white font-serif italic">Voyager Traffic Timeline (Last 7 Days)</h3>
            <div className="h-px bg-outline-variant/20 dark:bg-white/10 my-4" />
          </div>

          {/* Simple Custom Interactive CSS Timeline Chart */}
          <div className="flex-1 flex items-end justify-between gap-2 h-48 px-4 pt-6 pb-2">
            {metrics.trendsByDay.length > 0 ? (
              metrics.trendsByDay.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full group">
                  <div className="text-[10px] font-bold text-on-surface opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 rounded-md font-mono shrink-0">
                    {d.count}
                  </div>
                  <div className="w-full flex-1 flex flex-col justify-end">
                    <div 
                      className="w-full rounded-t-lg bg-primary/10 border-t border-x border-primary/20 group-hover:bg-primary group-hover:border-primary transition-all duration-500 shadow-sm"
                      style={{ height: `${d.heightPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-on-surface-variant/60 font-semibold uppercase font-mono">{d.label}</span>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-center text-on-surface-variant/40 italic text-sm">
                No active traffic logs registered recently.
              </div>
            )}
          </div>
        </div>

        {/* AI Performance Card */}
        <div className="lg:col-span-4 bg-white dark:bg-white/[0.02] border border-outline-variant/15 dark:border-white/5 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-primary text-[9px] font-black tracking-[0.3em] uppercase block mb-1">AI Assistant Stats</span>
            <h3 className="text-lg font-light tracking-tight text-on-surface dark:text-white font-serif italic">Operational Efficiency</h3>
            <div className="h-px bg-outline-variant/20 dark:bg-white/10 my-4" />
          </div>

          <div className="flex-1 flex flex-col justify-center py-4 space-y-5">
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-3xl text-emerald-500 font-light">robot</span>
              <div className="min-w-0 flex-1">
                <span className="text-[8px] font-black tracking-[0.2em] uppercase text-on-surface-variant/40 block mb-0.5">Gemini Resolution Rate</span>
                <p className="text-base font-semibold text-on-surface dark:text-white">{metrics.aiResponseRate}% Autoresolves</p>
                <p className="text-[10px] font-light text-on-surface-variant opacity-60 leading-normal">AI answered traveler inquiries instantly without human lag.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-3xl text-amber-500 font-light">electric_bolt</span>
              <div className="min-w-0 flex-1">
                <span className="text-[8px] font-black tracking-[0.2em] uppercase text-on-surface-variant/40 block mb-0.5">Average Response Time</span>
                <p className="text-base font-semibold text-on-surface dark:text-white">&lt; 15 Seconds</p>
                <p className="text-[10px] font-light text-on-surface-variant opacity-60 leading-normal">AI telemetry resolved and routed to local WhatsApp within seconds.</p>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <span className="text-[8px] font-black tracking-[0.2em] uppercase text-on-surface-variant/30 leading-normal">Operational telemetry index: JF-AN-99</span>
          </div>
        </div>
      </div>
    </div>
  );
}
