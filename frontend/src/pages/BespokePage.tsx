import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { SEO } from '../components/SEO';

type VibeType = 'Retreat' | 'Sanctum' | 'Odyssey' | 'Culinary';
type PaceType = 'Zen' | 'Balanced' | 'Active';

interface CurationData {
  vibe: VibeType | '';
  pace: PaceType | '';
  month: string;
  budget: string;
  guests: number;
  name: string;
  email: string;
  notes: string;
}

const initialData: CurationData = {
  vibe: '',
  pace: '',
  month: 'October',
  budget: '$10,000 – $25,000',
  guests: 2,
  name: '',
  email: '',
  notes: '',
};

const VIBES = [
  {
    key: 'Retreat' as VibeType,
    title: 'The Retreat',
    desc: 'Ultra-private beachfront sanctuaries, overwater bungalows, and architectural design gems.',
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
    icon: 'hotel',
  },
  {
    key: 'Sanctum' as VibeType,
    title: 'The Sanctum',
    desc: 'Ancient shrines, remote mountain monasteries, and deep cultural heritage paths.',
    img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop',
    icon: 'temple_buddhist',
  },
  {
    key: 'Odyssey' as VibeType,
    title: 'The Odyssey',
    desc: 'Saharan desert camps, raw glacier hiking, and remote wilderness accessed by invitation only.',
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop',
    icon: 'terrain',
  },
  {
    key: 'Culinary' as VibeType,
    title: 'The Culinary',
    desc: 'Michelin-adjacent itineraries woven into local organic vineyards and private chef estates.',
    img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop',
    icon: 'restaurant',
  },
];

const PACES = [
  {
    key: 'Zen' as PaceType,
    title: 'Zen Rest',
    desc: 'Slow-calibrated timelines, multi-day stays, and dedicated windows for sensory silence.',
    icon: 'spa',
  },
  {
    key: 'Balanced' as PaceType,
    title: 'Balanced Flow',
    desc: 'The classic rhythm. Strategic sightseeing blended with unstructured, curious exploration.',
    icon: 'explore',
  },
  {
    key: 'Active' as PaceType,
    title: 'Active Venture',
    desc: 'High-intensity departures. Heli-transfers, dynamic mountain trekking, and coastal sailing.',
    icon: 'sailing',
  },
];

const BUDGET_TIERS = [
  '$5,000 – $10,000',
  '$10,000 – $25,000',
  '$25,000 – $50,000',
  '$50,000+',
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function BespokePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<CurationData>(initialData);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const updateField = (fields: Partial<CurationData>) => {
    setData(prev => ({ ...prev, ...fields }));
  };

  const nextStep = () => {
    if (step === 1 && !data.vibe) {
      toast.error('Select a travel format first.');
      return;
    }
    if (step === 2 && !data.pace) {
      toast.error('Select an expedition pace.');
      return;
    }
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name || !data.email) {
      toast.error('Identity details are required.');
      return;
    }
    
    setLoading(true);

    // Compile the questionnaire selections into a stunning markdown dossier block
    const compiledMessage = `
# BESPOKE CURATION DOSSIER
A luxury travel curation requested by the client.

## 1. Travel Aesthetics & Mood
- **Visual Format/Vibe**: ${data.vibe} (${VIBES.find(v => v.key === data.vibe)?.title})
- **Expedition Pace**: ${data.pace} (${PACES.find(p => p.key === data.pace)?.title})

## 2. Logistics & Group Specs
- **Month of Departure**: ${data.month}
- **Approximate Budget**: ${data.budget}
- **Number of Guests**: ${data.guests} Guest(s)

## 3. Custom Client Notes
${data.notes.trim() ? `"${data.notes.trim()}"` : 'No additional constraints provided.'}
    `.trim();

    try {
      await api.createContact({
        name: data.name,
        email: data.email,
        type: 'Bespoke Curation Strategy',
        message: compiledMessage,
      });
      setCompleted(true);
    } catch (err) {
      console.error(err);
      toast.error('Transmission failed. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white relative flex flex-col justify-between">
      <SEO pageId="contact" />
      
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/20 via-black to-neutral-900/10 pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-28 pb-20 flex-1 flex flex-col justify-center">
        
        {/* Step Indicator Header */}
        {!completed && (
          <header className="mb-8 text-center animate-reveal-up">
            <span className="text-[9px] font-black tracking-[0.6em] text-primary uppercase block mb-3">Expedition Inception Wizard</span>
            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className="flex-1 h-1 rounded-full relative bg-neutral-800 overflow-hidden">
                  <div className={`absolute inset-y-0 left-0 bg-white transition-all duration-500 ${s <= step ? 'w-full' : 'w-0'}`} />
                </div>
              ))}
            </div>
            <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-3">Step {step} of 4</p>
          </header>
        )}

        {completed ? (
          /* SUCCESS STATE CARD */
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-2xl backdrop-blur-md animate-reveal-up">
            <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center mx-auto mb-6 shadow-xl shadow-white/5">
              <span className="material-symbols-outlined text-3xl font-light">verified</span>
            </div>
            <h2 className="text-3xl font-light font-serif italic mb-3">Dossier Registered.</h2>
            <p className="text-neutral-400 text-sm font-light leading-relaxed mb-6">
              Our travel curations strategy team has locked in your preferences. A curator will compile your visual route and reach out within 24 hours.
            </p>
            <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 text-left mb-8 max-w-sm mx-auto">
              <span className="text-[8px] font-black uppercase text-primary tracking-widest block mb-1">Dossier specs</span>
              <p className="text-xs text-neutral-400"><strong>Aesthetic Vibe:</strong> {data.vibe}</p>
              <p className="text-xs text-neutral-400"><strong>Expedition Pace:</strong> {data.pace}</p>
              <p className="text-xs text-neutral-400"><strong>Budget Tier:</strong> {data.budget}</p>
            </div>
            <button onClick={() => navigate('/')} className="px-8 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-neutral-200 transition-all shadow-md">
              Return Home
            </button>
          </div>
        ) : (
          /* MULTI-STEP FORM WRAPPER */
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md min-h-[460px] flex flex-col justify-between">
            
            {/* ── STEP 1: MOOD CURATION ── */}
            {step === 1 && (
              <div className="animate-reveal-up">
                <h1 className="text-3xl sm:text-4xl font-light tracking-tighter mb-2 italic font-serif">Select Your Travel Aesthetic.</h1>
                <p className="text-neutral-400 text-sm font-light mb-8 max-w-xl">Every expedition has a primary narrative structure. Choose the format that matches your sensory goals.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {VIBES.map(v => (
                    <div key={v.key}
                      onClick={() => updateField({ vibe: v.key })}
                      className={`group relative overflow-hidden rounded-2xl border transition-all duration-500 cursor-pointer h-40 ${
                        data.vibe === v.key ? 'border-white ring-2 ring-white/10 shadow-2xl scale-[1.02]' : 'border-neutral-800/60 opacity-60 hover:opacity-100 hover:border-neutral-700'
                      }`}>
                      <img src={v.img} alt={v.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4s]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      <div className="absolute inset-0 flex flex-col justify-end p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="material-symbols-outlined text-sm font-light text-primary">{v.icon}</span>
                          <h3 className="text-base font-semibold">{v.title}</h3>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-light leading-relaxed line-clamp-2">{v.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 2: EXPEDITION PACE ── */}
            {step === 2 && (
              <div className="animate-reveal-up">
                <h1 className="text-3xl sm:text-4xl font-light tracking-tighter mb-2 italic font-serif">Determine Your Pace.</h1>
                <p className="text-neutral-400 text-sm font-light mb-8 max-w-xl">Balance is absolute. Calibrate the density of landmarks vs. rest windows.</p>
                
                <div className="flex flex-col gap-4">
                  {PACES.map(p => (
                    <div key={p.key}
                      onClick={() => updateField({ pace: p.key })}
                      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer p-5 flex items-center gap-5 ${
                        data.pace === p.key ? 'border-white bg-white/[0.04] shadow-2xl scale-[1.01]' : 'border-neutral-800/60 opacity-60 hover:opacity-100 hover:border-neutral-800'
                      }`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                        data.pace === p.key ? 'bg-white text-black border-white' : 'bg-neutral-800/30 text-neutral-400 border-neutral-800'
                      }`}>
                        <span className="material-symbols-outlined font-light text-xl">{p.icon}</span>
                      </div>
                      <div className="text-left">
                        <h3 className="text-base font-semibold mb-0.5">{p.title}</h3>
                        <p className="text-xs text-neutral-400 font-light leading-relaxed">{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 3: TIMELINE & GROUP DETAILS ── */}
            {step === 3 && (
              <div className="animate-reveal-up">
                <h1 className="text-3xl sm:text-4xl font-light tracking-tighter mb-2 italic font-serif">Calibrate Logistics.</h1>
                <p className="text-neutral-400 text-sm font-light mb-8 max-w-xl">Select your timeline and group variables to match your customized strategy.</p>
                
                <div className="space-y-6">
                  {/* Month Selection */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-neutral-500">Target Month of Departure</label>
                    <div className="relative">
                      <select value={data.month} onChange={e => updateField({ month: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:border-white focus:ring-1 focus:ring-white transition-all appearance-none cursor-pointer outline-none">
                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-base">expand_more</span>
                    </div>
                  </div>

                  {/* Budget Selector */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-neutral-500">Approximate Budget Tier (USD)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {BUDGET_TIERS.map(b => (
                        <button key={b} type="button" onClick={() => updateField({ budget: b })}
                          className={`px-3 py-3 border rounded-xl text-xs font-semibold tracking-tight transition-all duration-300 ${
                            data.budget === b ? 'bg-white text-black border-white' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}>
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Guest Counter */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-neutral-500">Number of Guests</label>
                    <div className="flex items-center gap-4 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 w-fit">
                      <button type="button" onClick={() => updateField({ guests: Math.max(1, data.guests - 1) })}
                        className="w-8 h-8 rounded-lg hover:bg-neutral-900 border border-neutral-800 flex items-center justify-center text-lg font-bold">-</button>
                      <span className="text-sm font-semibold w-6 text-center">{data.guests}</span>
                      <button type="button" onClick={() => updateField({ guests: Math.min(10, data.guests + 1) })}
                        className="w-8 h-8 rounded-lg hover:bg-neutral-900 border border-neutral-800 flex items-center justify-center text-lg font-bold">+</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4: CONTACT & NOTES ── */}
            {step === 4 && (
              <div className="animate-reveal-up">
                <h1 className="text-3xl sm:text-4xl font-light tracking-tighter mb-2 italic font-serif">Authorize Curation.</h1>
                <p className="text-neutral-400 text-sm font-light mb-8 max-w-xl">Provide your identity details to confirm travel dossier registration.</p>
                
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-neutral-500">Full Name</label>
                      <input type="text" placeholder="Full Name" required value={data.name} onChange={e => updateField({ name: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:border-white focus:ring-1 focus:ring-white transition-all outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-neutral-500">Email Address</label>
                      <input type="email" placeholder="email@example.com" required value={data.email} onChange={e => updateField({ email: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:border-white focus:ring-1 focus:ring-white transition-all outline-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-neutral-500">Additional Instructions (Optional)</label>
                    <textarea rows={3} placeholder="Dietary restrictions, private depart preferences, specific landing targets..." value={data.notes} onChange={e => updateField({ notes: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:border-white focus:ring-1 focus:ring-white transition-all outline-none resize-none" />
                  </div>
                </form>
              </div>
            )}

            {/* BUTTON NAVIGATION BAR */}
            <footer className="flex justify-between items-center border-t border-neutral-800/80 pt-6 mt-8">
              {step > 1 ? (
                <button onClick={prevStep} className="px-6 py-2.5 rounded-xl text-neutral-400 hover:text-white transition-colors text-[9px] font-black uppercase tracking-[0.4em] flex items-center gap-1 cursor-pointer">
                  <span className="material-symbols-outlined text-sm font-light">chevron_left</span> Back
                </button>
              ) : (
                <div />
              )}
              
              {step < 4 ? (
                <button onClick={nextStep} className="px-8 py-3 bg-white text-black hover:bg-neutral-200 rounded-xl text-[9px] font-black uppercase tracking-[0.4em] flex items-center gap-1 cursor-pointer shadow-md shadow-white/5 active:scale-95 transition-all">
                  Next <span className="material-symbols-outlined text-sm font-light">chevron_right</span>
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-white text-black hover:bg-neutral-200 rounded-xl text-[9px] font-black uppercase tracking-[0.4em] flex items-center gap-2 cursor-pointer shadow-md shadow-white/5 active:scale-95 transition-all disabled:opacity-50">
                  {loading ? (
                    <><span className="material-symbols-outlined text-sm font-light animate-spin">progress_activity</span> Syncing...</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm font-light">send</span> Lock Curation</>
                  )}
                </button>
              )}
            </footer>

          </div>
        )}

      </div>
    </main>
  );
}
