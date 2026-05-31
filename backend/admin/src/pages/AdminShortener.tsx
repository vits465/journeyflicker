import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Tour } from '../lib/api';
import { useAdminAuth } from '../lib/adminAuth';

export default function AdminShortener() {
  const { canCRUD } = useAdminAuth();
  const queryClient = useQueryClient();

  // State
  const [selectedTourId, setSelectedTourId] = useState<string>('');
  const [targetDays, setTargetDays] = useState<number>(3);
  const [mode, setMode] = useState<'algo' | 'ai'>('algo');
  const [previewData, setPreviewData] = useState<Tour | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Load all tours
  const { data: toursData, isLoading: isLoadingTours } = useQuery({
    queryKey: ['tours', 1, ''],
    queryFn: () => api.listTours({ page: 1, limit: 100 }),
  });

  const toursList = (Array.isArray(toursData) ? toursData : toursData?.items) || [];
  
  // Filter out tours that are already very short (<= 3 days)
  const eligibleTours = toursList.filter(t => t.days > 3);

  // Selected tour details
  const activeTour = eligibleTours.find(t => t.id === selectedTourId);

  // Reset preview when options change
  useEffect(() => {
    setPreviewData(null);
    setStatusMessage(null);
  }, [selectedTourId, targetDays, mode]);

  // Mutation: Generate Preview
  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTourId) throw new Error("Please select a tour.");
      setStatusMessage({ type: 'info', text: 'Connecting to server and running compression...' });
      const res = await api.shortenTour(selectedTourId, targetDays, mode, true);
      return res.preview || res; // backend returns { preview: Tour }
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setStatusMessage(null);
    },
    onError: (err: any) => {
      console.error(err);
      const errMsg = err.message || "Failed to generate preview.";
      setStatusMessage({ 
        type: 'error', 
        text: errMsg.includes("GEMINI_API_KEY") 
          ? "Gemini API key not configured on server. Please add your GEMINI_API_KEY insettings or switch to 'Smart Algorithmic' mode." 
          : errMsg 
      });
      setPreviewData(null);
    }
  });

  // Mutation: Publish Tour
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTourId) throw new Error("Please select a tour.");
      setStatusMessage({ type: 'info', text: 'Saving tour to database and syncing files...' });
      return await api.shortenTour(selectedTourId, targetDays, mode, false);
    },
    onSuccess: (savedTour) => {
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      setStatusMessage({ 
        type: 'success', 
        text: `Successfully condensed and published "${savedTour.name}"! It is now live in your tours database and cache is invalidated.` 
      });
      // Clear inputs
      setPreviewData(null);
      setSelectedTourId('');
    },
    onError: (err: any) => {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || "Failed to save the itinerary to database." });
    }
  });

  const labelClasses = "block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5";
  const selectClasses = "w-full bg-surface-container-low text-on-surface border border-outline-variant/50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";
  
  return (
    <div className="h-full space-y-6 max-w-6xl mx-auto pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col gap-1.5 border-b border-outline-variant/20 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl">content_cut</span>
          Expedition Condenser
        </h2>
        <p className="text-xs text-on-surface-variant/80 font-medium">
          Elite curation tools to mathematically and intelligently condense longer voyages into premium 3-to-4 day highlights packages.
        </p>
      </div>

      {/* Main Panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column - Settings (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card: Configuration */}
          <div className="p-6 bg-surface-container rounded-2xl border border-outline-variant/30 space-y-5 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/20 pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">settings</span>
              Voyage Parameters
            </h3>

            {/* Tour selection */}
            <div>
              <label className={labelClasses}>Select Expedition *</label>
              {isLoadingTours ? (
                <div className="h-10 w-full bg-surface-container-low rounded-lg animate-pulse" />
              ) : (
                <select 
                  className={selectClasses} 
                  value={selectedTourId} 
                  onChange={e => setSelectedTourId(e.target.value)}
                >
                  <option value="">-- Choose longer voyage --</option>
                  {eligibleTours.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.days} Days, {t.region})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Selected Tour Summary Badge */}
            {activeTour && (
              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 space-y-2 transition-all duration-300">
                <div className="flex justify-between items-start gap-2">
                  <div className="font-bold text-xs">{activeTour.name}</div>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                    {activeTour.days} Days
                  </span>
                </div>
                <div className="text-[11px] text-on-surface-variant/80 line-clamp-2 leading-relaxed">
                  {activeTour.overviewDescription}
                </div>
                <div className="flex justify-between items-center text-[10px] text-on-surface-variant/50 pt-1 font-semibold uppercase tracking-wider">
                  <span>Price: {activeTour.price}</span>
                  <span>Region: {activeTour.region}</span>
                </div>
              </div>
            )}

            {/* Target Duration Selection */}
            <div>
              <label className={labelClasses}>Target Duration *</label>
              <div className="grid grid-cols-2 gap-3">
                {[3, 4].map(d => (
                  <button
                    key={d}
                    type="button"
                    disabled={!selectedTourId || (activeTour && d >= activeTour.days)}
                    onClick={() => setTargetDays(d)}
                    className={`py-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      targetDays === d 
                        ? 'bg-primary text-on-primary border-primary shadow-sm' 
                        : 'bg-surface-container-low border-outline-variant/50 text-on-surface-variant hover:bg-surface-container-low/80 disabled:opacity-30 disabled:cursor-not-allowed'
                    }`}
                  >
                    <span className="text-sm font-black">{d} Days</span>
                    <span className="text-[8px] opacity-75">{d === 3 ? 'Express Escape' : 'Curated Highlights'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode selection */}
            <div>
              <label className={labelClasses}>Curation Engine *</label>
              <div className="space-y-3">
                
                {/* Algorithmic */}
                <div 
                  onClick={() => setMode('algo')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-1 relative overflow-hidden ${
                    mode === 'algo' 
                      ? 'bg-surface border-primary shadow-sm' 
                      : 'bg-surface-container-low border-outline-variant/30 text-on-surface hover:border-outline-variant/70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-sm ${mode === 'algo' ? 'text-primary' : 'text-on-surface-variant/50'}`}>
                      analytics
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider">Smart Algorithmic</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant/70 leading-relaxed">
                    Deterministic day-merging. Combines activity blocks, inherits final accommodations, preserves departure day compulsorily, and adjusts price. 100% robust.
                  </p>
                </div>

                {/* AI */}
                <div 
                  onClick={() => setMode('ai')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-1 relative overflow-hidden ${
                    mode === 'ai' 
                      ? 'bg-surface border-primary shadow-sm' 
                      : 'bg-surface-container-low border-outline-variant/30 text-on-surface hover:border-outline-variant/70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-sm ${mode === 'ai' ? 'text-primary animate-pulse' : 'text-on-surface-variant/50'}`}>
                      psychology
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      Gemini AI Curation
                      <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide shrink-0 font-bold leading-none">
                        Premium
                      </span>
                    </span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant/70 leading-relaxed">
                    Uses Gemini 2.5 Flash to rewrite, condense, and organically polish the copy. Generates custom luxury titles, descriptions, and premium schedules from scratch.
                  </p>
                </div>

              </div>
            </div>

            {/* Status alerts */}
            {statusMessage && (
              <div className={`p-4 rounded-xl border text-[11px] leading-relaxed transition-all flex gap-2.5 ${
                statusMessage.type === 'error' 
                  ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400' 
                  : statusMessage.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400' 
                  : 'bg-primary/5 border-primary/20 text-on-surface/90 animate-pulse'
              }`}>
                <span className="material-symbols-outlined text-sm shrink-0">
                  {statusMessage.type === 'error' ? 'error' : statusMessage.type === 'success' ? 'check_circle' : 'info'}
                </span>
                <span className="font-medium">{statusMessage.text}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              type="button"
              disabled={!selectedTourId || previewMutation.isPending || publishMutation.isPending}
              onClick={() => previewMutation.mutate()}
              className="w-full py-3 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {previewMutation.isPending ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  Generating Preview...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Generate Live Preview
                </>
              )}
            </button>

          </div>
        </div>

        {/* Right column - Preview Area (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[500px]">
          
          {previewData ? (
            /* Live Preview Layout */
            <div className="flex-1 flex flex-col space-y-5 bg-surface rounded-2xl border border-outline-variant/30 p-6 transition-all duration-300 relative shadow-sm">
              
              {/* Preview Header */}
              <div className="flex justify-between items-start gap-4 border-b border-outline-variant/20 pb-4">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-widest text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                    Condensed Draft Preview
                  </span>
                  <h4 className="text-base font-bold text-on-surface mt-1">{previewData.name}</h4>
                  <div className="flex items-center gap-3 text-[10px] text-on-surface-variant/60 font-semibold tracking-wider uppercase">
                    <span>Days: {previewData.days}</span>
                    <span>&bull;</span>
                    <span>Price: {previewData.price}</span>
                    <span>&bull;</span>
                    <span>Category: {previewData.category}</span>
                  </div>
                </div>

                {canCRUD && (
                  <button
                    onClick={() => publishMutation.mutate()}
                    disabled={publishMutation.isPending}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {publishMutation.isPending ? 'sync' : 'publish'}
                    </span>
                    {publishMutation.isPending ? 'Publishing...' : 'Publish Tour'}
                  </button>
                )}
              </div>

              {/* Overview Narratives */}
              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 space-y-2.5">
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Overview</h5>
                  <p className="text-xs text-on-surface/90 italic leading-relaxed mt-0.5">{previewData.overviewDescription}</p>
                </div>
                <div className="pt-2.5 border-t border-outline-variant/20">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Extended Narrative</h5>
                  <p className="text-xs text-on-surface/80 leading-relaxed mt-0.5">{previewData.overviewExtended}</p>
                </div>
              </div>

              {/* Day Cards list */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 admin-sidebar-scroll">
                <h5 className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70 mb-2 border-b border-outline-variant/10 pb-1">
                  Itinerary Sequence
                </h5>
                {(previewData.itinerary || []).map((day, idx) => {
                  const isDeparture = idx === previewData.days - 1;
                  return (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-xl border space-y-2 transition-all relative ${
                        isDeparture 
                          ? 'bg-amber-500/5 border-amber-500/20' 
                          : 'bg-surface-container border-outline-variant/20'
                      }`}
                    >
                      {/* Day Header */}
                      <div className="flex justify-between items-center gap-2">
                        <h6 className="font-bold text-xs text-primary">{day.title}</h6>
                        {isDeparture && (
                          <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[10px]">flight_takeoff</span>
                            Departure day preserved
                          </span>
                        )}
                      </div>

                      {/* Day body text */}
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {day.description}
                      </p>

                      {/* Day meta footer */}
                      <div className="flex justify-between items-center text-[10px] text-on-surface-variant/40 pt-1 font-semibold uppercase tracking-wider">
                        <span>Hotel: {day.accommodation || 'N/A'}</span>
                        <span>Meals: {day.meals || 'N/A'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            /* Standby Placeholder Screen */
            <div className="flex-1 flex flex-col items-center justify-center bg-surface-container rounded-2xl border border-outline-variant/30 border-dashed p-12 text-center select-none shadow-inner min-h-[500px]">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <span className="material-symbols-outlined text-3xl">auto_awesome</span>
              </div>
              <h4 className="font-bold text-sm text-on-surface mb-1">Live Engine Standby</h4>
              <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed mb-6">
                Choose an expedition on the left panel, configure target days and mode, and hit "Generate Live Preview" to preview the results in real-time before saving.
              </p>
              <div className="grid grid-cols-2 gap-4 text-left w-full max-w-md border-t border-outline-variant/20 pt-6">
                <div className="p-3 bg-surface rounded-xl border border-outline-variant/20">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1">Algorithmic mode</div>
                  <span className="text-[9px] text-on-surface-variant/70 leading-relaxed block">Uses mathematical sequence blending to combine activities. Instant, 100% free.</span>
                </div>
                <div className="p-3 bg-surface rounded-xl border border-outline-variant/20">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1">Gemini AI Mode</div>
                  <span className="text-[9px] text-on-surface-variant/70 leading-relaxed block">Unlocks elite creative travel copywriting to organic, natural rewriting of the itinerary.</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
