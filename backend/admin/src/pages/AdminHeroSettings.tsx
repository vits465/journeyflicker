import { useState, useEffect, useRef } from 'react';
import type { Destination, Tour } from '../lib/api';
import { api, uploadImage } from '../lib/api';
import { useAllHeroSettings } from '../lib/heroSettings';
import { Preloader } from '../components/Preloader';

type Tab = 'home' | 'tours' | 'destinations' | 'visa';

const tabs: { id: Tab; label: string; icon: string; description: string; type: 'destination' | 'tour' | 'single' }[] = [
  { id: 'home', label: 'Home Page', icon: 'home', description: 'Hero slider on the landing page (uses Destinations)', type: 'destination' },
  { id: 'destinations', label: 'Destinations', icon: 'location_on', description: 'Hero slider on the Destinations listing page', type: 'destination' },
  { id: 'tours', label: 'Tours', icon: 'flight', description: 'Hero slider on the Tours listing page', type: 'tour' },
  { id: 'visa', label: 'Visa Page', icon: 'public', description: 'Exclusive cinematic hero banner for the Visa Intelligence page', type: 'single' },
];

export default function AdminHeroSettings() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const { settings, save } = useAllHeroSettings();

  // Local draft state
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    Promise.all([api.listDestinations(), api.listTours()])
      .then(([d, t]) => { setDestinations(d || []); setTours(t || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const currentTab = tabs.find(t => t.id === activeTab)!;
  const items = currentTab.type === 'destination' ? destinations : tours;
  const selectedIds: string[] = (currentTab.type === 'single') ? [] : (draft[activeTab as keyof typeof draft] as string[] ?? []);
  const MAX_SLIDES = 7;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  function toggleItem(id: string) {
    if (activeTab === 'visa') return;
    const current = draft[activeTab as 'home'|'tours'|'destinations'] ?? [];
    const updated = current.includes(id)
      ? current.filter(i => i !== id)
      : current.length < MAX_SLIDES ? [...current, id] : current;
    setDraft(prev => ({ ...prev, [activeTab]: updated }));
    setSaved(false);
  }

  function moveUp(id: string) {
    if (activeTab === 'visa') return;
    const arr = [...(draft[activeTab as 'home'|'tours'|'destinations'] ?? [])];
    const idx = arr.indexOf(id);
    if (idx <= 0) return;
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    setDraft(prev => ({ ...prev, [activeTab]: arr }));
    setSaved(false);
  }

  function moveDown(id: string) {
    if (activeTab === 'visa') return;
    const arr = [...(draft[activeTab as 'home'|'tours'|'destinations'] ?? [])];
    const idx = arr.indexOf(id);
    if (idx < 0 || idx >= arr.length - 1) return;
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    setDraft(prev => ({ ...prev, [activeTab]: arr }));
    setSaved(false);
  }

  function removeItem(id: string) {
    if (activeTab === 'visa') return;
    setDraft(prev => ({ ...prev, [activeTab]: (prev[activeTab as 'home'|'tours'|'destinations'] ?? []).filter(i => i !== id) }));
    setSaved(false);
  }

  function resetToDefault() {
    if (activeTab === 'visa') {
      setDraft(prev => ({ ...prev, visaBanner: '' }));
    } else {
      setDraft(prev => ({ ...prev, [activeTab]: [] }));
    }
    setSaved(false);
  }

  function saveChanges() {
    save(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  // Helper to get item name/image
  function getItem(id: string) {
    if (currentTab.type === 'destination') {
      const d = destinations.find(x => x.id === id);
      return d ? { name: d.name, tag: d.region, img: d.heroImageUrl } : null;
    } else {
      const t = tours.find(x => x.id === id);
      return t ? { name: t.name, tag: `${t.days} Days · ${t.category}`, img: t.heroImageUrl } : null;
    }
  }

  async function handleVisaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const url = await uploadImage(file);
      setDraft(prev => ({ ...prev, visaBanner: url }));
      setSaved(false);
    } catch (err) {
      alert("Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">

      {/* ── HEADER ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-light tracking-tighter mb-1">Hero Slide Manager</h1>
        <p className="text-sm text-on-surface-variant opacity-70">
          Select and order which items appear in each page's hero slider. Changes apply instantly to the public site.
        </p>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-2 mb-6 border-b border-outline-variant/20 pb-4 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id ? 'bg-black text-white shadow-md' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}>
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB DESCRIPTION ── */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-xl">info</span>
        <p className="text-sm text-on-surface font-light">
          <strong className="font-semibold">{currentTab.description}</strong>
          {' '}— Select up to {MAX_SLIDES} items. Unchecking all uses the first {MAX_SLIDES} entries by default.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── LEFT: Item Picker ── */}
        <div className="lg:col-span-3">
          <div className="bg-surface dark:bg-white/5 rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Available {currentTab.type === 'destination' ? 'Destinations' : currentTab.type === 'tour' ? 'Tours' : 'Hero Image'}
                {currentTab.type !== 'single' && (
                  <span className="ml-2 text-[10px] font-black tracking-widest uppercase text-on-surface-variant/40">
                    ({selectedIds.length}/{MAX_SLIDES} selected)
                  </span>
                )}
              </h3>
            </div>

            {currentTab.type === 'single' ? (
              <div className="p-8 text-center space-y-6">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleVisaUpload} />
                <div 
                  className="w-full relative h-64 bg-surface-container-low border-2 border-dashed border-outline-variant/30 rounded-2xl flex flex-col items-center justify-center hover:bg-surface-container cursor-pointer transition-colors overflow-hidden group"
                  onClick={() => !uploadingImage && fileInputRef.current?.click()}
                >
                  {draft.visaBanner ? (
                    <>
                      <img src={draft.visaBanner} alt="Visa Banner" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                      <div className="relative z-10 bg-black/60 backdrop-blur text-white px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">Change Image</div>
                    </>
                  ) : uploadingImage ? (
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <span className="material-symbols-outlined animate-spin">cyclone</span> Uploading...
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">add_photo_alternate</span>
                      <p className="text-sm font-semibold text-on-surface">Click to Upload Banner</p>
                      <p className="text-xs text-on-surface-variant italic">High-res landscape recommended</p>
                    </>
                  )}
                </div>
              </div>
            ) : loading ? (
              <Preloader />
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-sm text-on-surface-variant opacity-50 italic">
                No {currentTab.type === 'destination' ? 'destinations' : 'tours'} found. Add some first.
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10 max-h-[500px] overflow-y-auto">
                {items.map(item => {
                  const isSelected = selectedIds.includes(item.id);
                  const atLimit = !isSelected && selectedIds.length >= MAX_SLIDES;
                  const imgUrl = 'heroImageUrl' in item ? item.heroImageUrl : undefined;
                  const tag = 'region' in item
                    ? (item as Destination).region
                    : `${(item as Tour).days} Days · ${(item as Tour).category}`;

  return (
                    <label key={item.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors group ${
                        isSelected ? 'bg-primary/5' : atLimit ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface-container-low/60'
                      }`}>
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-surface-container-low border border-outline-variant/10">
                        {imgUrl
                          ? <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-on-surface-variant/20">
                              <span className="material-symbols-outlined text-xl">image</span>
                            </div>
                        }
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-[10px] text-on-surface-variant/50 font-black tracking-widest uppercase">{tag}</p>
                      </div>
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={atLimit}
                        onChange={() => !atLimit && toggleItem(item.id)}
                        className="w-5 h-5 rounded-md border-outline-variant accent-black cursor-pointer shrink-0"
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Slide Order ── */}
        {currentTab.type !== 'single' && (
        <div className="lg:col-span-2">
          <div className="bg-surface dark:bg-white/5 rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden sticky top-4">
            <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Slide Order</h3>
              {selectedIds.length > 0 && (
                <button onClick={resetToDefault}
                  className="text-[10px] text-on-surface-variant hover:text-red-500 font-bold tracking-wider uppercase transition-colors">
                  Reset
                </button>
              )}
            </div>

            {selectedIds.length === 0 ? (
              <div className="p-6 text-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/20 block mb-2">slideshow</span>
                <p className="text-xs text-on-surface-variant/50 italic leading-relaxed">
                  No items selected.<br/>The first {MAX_SLIDES} entries will be used automatically.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10 max-h-[460px] overflow-y-auto">
                {selectedIds.map((id, idx) => {
                  const info = getItem(id);
                  if (!info) return null;
                  return (
                    <div key={id} className="flex items-center gap-3 px-4 py-3 group hover:bg-surface-container-low/40 transition-colors">
                      {/* Index badge */}
                      <span className="w-6 h-6 rounded-full bg-black text-white text-[9px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      {/* Thumbnail */}
                      <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-surface-container-low">
                        {info.img
                          ? <img src={info.img} alt={info.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-surface-container" />
                        }
                      </div>
                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{info.name}</p>
                        <p className="text-[9px] text-on-surface-variant/40 tracking-wider uppercase">{info.tag}</p>
                      </div>
                      {/* Controls */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveUp(id)} disabled={idx === 0}
                          className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-surface-container-low disabled:opacity-20 transition-all">
                          <span className="material-symbols-outlined text-sm font-light">keyboard_arrow_up</span>
                        </button>
                        <button onClick={() => moveDown(id)} disabled={idx === selectedIds.length - 1}
                          className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-surface-container-low disabled:opacity-20 transition-all">
                          <span className="material-symbols-outlined text-sm font-light">keyboard_arrow_down</span>
                        </button>
                        <button onClick={() => removeItem(id)}
                          className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
                          <span className="material-symbols-outlined text-sm font-light">close</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Preview thumbnail strip */}
            {selectedIds.length > 0 && (
              <div className="px-4 py-3 border-t border-outline-variant/10 flex gap-1.5 overflow-x-auto">
                {selectedIds.map((id, i) => {
                  const info = getItem(id);
                  return (
                    <div key={id} className={`shrink-0 w-10 h-8 rounded-md overflow-hidden border-2 ${i === 0 ? 'border-black' : 'border-transparent'}`}>
                      {info?.img
                        ? <img src={info.img} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-surface-container" />
                      }
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── SAVE BUTTON ── */}
          <button onClick={saveChanges}
            className={`w-full mt-3 py-3 rounded-xl text-sm font-black tracking-[0.3em] uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-md ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-black text-white hover:bg-primary'
            }`}>
            <span className="material-symbols-outlined text-base">{saved ? 'check_circle' : 'save'}</span>
            {saved ? 'Saved! Live on Site' : 'Save & Publish'}
          </button>

          {saved && (
            <p className="text-center text-xs text-green-600 font-semibold mt-2 animate-reveal-up">
              ✓ Hero slider updated in real-time
            </p>
          )}
        </div>
        )}

        {currentTab.type === 'single' && (
        <div className="lg:col-span-2">
            <div className="bg-surface dark:bg-white/5 rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden p-6 text-center sticky top-4">
                <span className="material-symbols-outlined text-4xl mb-4 text-on-surface-variant/40">public</span>
                <h3 className="text-lg font-semibold mb-2">Live Preview Available</h3>
                <p className="text-sm text-on-surface-variant/70 leading-relaxed italic mb-6">
                  Uploading an image will instantly preview it on the left panel. Press Save & Publish below to push it to the public website!
                </p>

                {/* ── SAVE BUTTON ── */}
                <button onClick={saveChanges}
                  className={`w-full py-3 rounded-xl text-sm font-black tracking-[0.3em] uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-md ${
                    saved
                      ? 'bg-green-500 text-white'
                      : 'bg-black text-white hover:bg-primary'
                  }`}>
                  <span className="material-symbols-outlined text-base">{saved ? 'check_circle' : 'save'}</span>
                  {saved ? 'Saved! Live on Site' : 'Save & Publish'}
                </button>
            </div>
        </div>
        )}
      </div>
    </div>
  );
}
