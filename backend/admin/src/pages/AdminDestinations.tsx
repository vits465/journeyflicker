import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { Destination } from '../lib/api';
import { api } from '../lib/api';
import { ImageUploader } from '../components/ImageUploader';
import { useAdminAuth } from '../lib/adminAuth';
import { Preloader } from '../components/Preloader';
import { useOptimisticUpdate } from '../lib/hooks';

const emptyForm: Partial<Destination> = {
  name: '', region: '', description: '', essenceText: '',
  heroImageUrl: '', galleryImages: [], bestSeasonsTitle: '',
  bestSeasonsMonths: '', landmarks: [], seasonsHighlights: [],
};

const S = `
  .af-input{width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:13.5px;background:#fafafa;color:#111827;transition:all .2s;outline:none;}
  .dark .af-input{background:#1a1a1a;border-color:#333;color:#fff;}
  .af-input:focus{border-color:#111827;background:#fff;box-shadow:0 0 0 3px rgba(0,0,0,.06);}
  .dark .af-input:focus{border-color:#fff;background:#000;box-shadow:0 0 0 3px rgba(255,255,255,.06);}
  .af-input::placeholder{color:#9ca3af;}
  .af-label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:6px;}
  .af-section{background:#fff;border-radius:16px;padding:22px;border:1.5px solid #f0f0f0;box-shadow:0 1px 4px rgba(0,0,0,.05);}
  .dark .af-section{background:#1a1a1a;border-color:#333;box-shadow:none;}
  .af-sec-head{display:flex;align-items:center;gap:10px;margin-bottom:18px;padding-bottom:12px;}
  .af-sec-head.blue{border-bottom:2px solid #3b82f6;}
  .af-sec-head.violet{border-bottom:2px solid #7c3aed;}
  .af-sec-head.amber{border-bottom:2px solid #f59e0b;}
  .af-sec-head.emerald{border-bottom:2px solid #10b981;}
  .af-sec-icon{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .af-sec-icon.blue{background:#dbeafe;color:#2563eb;}
  .af-sec-icon.violet{background:#ede9fe;color:#7c3aed;}
  .af-sec-icon.amber{background:#fef3c7;color:#d97706;}
  .af-sec-icon.emerald{background:#d1fae5;color:#059669;}
  .af-sub{background:#f9fafb;border-radius:12px;padding:16px;border:1.5px solid #f0f0f0;position:relative;}
  .dark .af-sub{background:#222;border-color:#333;}
  .af-sub-num{position:absolute;top:-10px;left:14px;background:#111827;color:#fff;border-radius:20px;font-size:9px;font-weight:900;padding:2px 10px;letter-spacing:.1em;text-transform:uppercase;}
  .dark .af-sub-num{background:#fff;color:#000;}
  .af-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:10px;font-size:13px;font-weight:700;letter-spacing:.02em;transition:all .2s;border:none;cursor:pointer;}
  .af-btn.dark{background:#111827;color:#fff;}
  .dark .af-btn.dark{background:#fff;color:#000;}
  .af-btn.dark:hover{background:#1f2937;transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.2);}
  .af-btn.dark:disabled{opacity:.6;cursor:not-allowed;transform:none;}
  .af-btn.light{background:#f3f4f6;color:#374151;}
  .dark .af-btn.light{background:#333;color:#fff;}
  .af-btn.light:hover{background:#e5e7eb;}
  .af-btn-add{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:700;transition:all .15s;border:1.5px dashed;cursor:pointer;margin-top:12px;}
  .af-list-card{display:flex;align-items:center;background:#fff;border-radius:14px;border:1.5px solid #f0f0f0;overflow:hidden;transition:all .2s;}
  .dark .af-list-card{background:#1a1a1a;border-color:#333;}
  .af-list-card:hover{border-color:#e5e7eb;box-shadow:0 4px 16px rgba(0,0,0,.08);transform:translateY(-1px);}
  .af-thumb{width:80px;height:80px;flex-shrink:0;background:#f3f4f6;overflow:hidden;}
  .af-thumb img{width:100%;height:100%;object-fit:cover;}
`;
// ── Smart Destination Text Parser ──────────────────────────────────────────
function parseDestinationText(raw: string): Partial<Destination> {
  const text = raw;

  // Extract destination name from DESTINATION: or first all-caps heading
  const destMatch = text.match(/DESTINATION\s*[:\-]?\s*([A-Z][A-Z ]+)/i) ||
    text.match(/^([A-Z][A-Z ]{2,})\s*TOUR/m) ||
    text.match(/arrive in ([A-Za-z ]+)/i);
  const name = destMatch ? destMatch[1].trim().replace(/\bTOUR\b/i, '').trim() : '';

  // Region = same as name for destinations
  const region = name;

  // Description - use first substantial paragraph
  const paragraphs = raw.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 60);
  const description = paragraphs
    .find(p => !/QUOTATION|TRAVELING|Dear Sir|Greeting|Option|Hotel|Per Person|Day-|Package/i.test(p)) || '';

  // Essence text - pull from itinerary intro if available
  const essenceMatch = text.match(/(?:overview|about|discover)[:\-]?\s*([^\n]{40,200})/i);
  const essenceText = essenceMatch ? essenceMatch[1].trim() : '';

  // Best seasons - look for month mentions
  const monthsMatch = text.match(/(?:best time|season|month)[s]?[:\-]?[^\n]*([A-Z][a-z]+ (?:to|-) [A-Z][a-z]+)/i);
  const bestSeasonsMonths = monthsMatch ? monthsMatch[1] : '';

  // Extract landmarks from Day itinerary visits (Visit X, Y, Z)
  const visitMatches = [...text.matchAll(/[Vv]isit ([^.\n]+)/g)];
  const landmarks: Destination['landmarks'] = [];
  const seen = new Set<string>();
  visitMatches.forEach(m => {
    const places = m[1].split(/,|and/).map(p => p.trim()).filter(p => p.length > 3 && p.length < 60);
    places.forEach(place => {
      if (!seen.has(place) && landmarks.length < 6) {
        seen.add(place);
        landmarks.push({ title: place.replace(/^the /i, ''), category: 'Attraction', description: `A must-visit landmark in ${name}.`, imageUrl: '' });
      }
    });
  });

  // Season highlights from days - extract unique activities
  const seasonsHighlights: Destination['seasonsHighlights'] = [
    { season: 'Peak Season', description: `The best time to visit ${name} for sightseeing and cultural experiences.` },
    { season: 'Off-Peak', description: `Fewer crowds and lower prices while still enjoying the beauty of ${name}.` },
  ];

  return {
    name,
    region,
    description: description.substring(0, 500),
    essenceText,
    heroImageUrl: '',
    galleryImages: [],
    bestSeasonsTitle: `Best Time to Visit ${name}`,
    bestSeasonsMonths,
    landmarks,
    seasonsHighlights,
  };
}


export default function AdminDestinations() {
  const { canCRUD } = useAdminAuth();
  const location = useLocation();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Destination>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  const { data: optimisticDestinations, performOptimistic } = useOptimisticUpdate(destinations);

  useEffect(() => {
    loadDestinations();
    const iv = setInterval(loadDestinations, 5000);
    return () => clearInterval(iv);
  }, []);

  // Handle deep-link editing via URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (editId && destinations.length > 0) {
      const dest = destinations.find(d => d.id === editId);
      if (dest) handleEdit(dest);
    }
  }, [location.search, destinations]);

  const loadDestinations = () =>
    api.listDestinations().then((d) => { setDestinations(d || []); setLoading(false); }).catch(console.error);

  const filtered = optimisticDestinations.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.region || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      editingId ? await api.updateDestination(editingId, formData) : await api.createDestination(formData);
      setFormData(emptyForm); setEditingId(null); loadDestinations();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleEdit = (d: Destination) => {
    setFormData(d); setEditingId(d.id);
    setTimeout(() => document.getElementById('dtop')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this destination?')) return;
    const nextData = optimisticDestinations.filter(d => d.id !== id);
    try {
      await performOptimistic(nextData, api.deleteDestination(id));
      if (selected.has(id)) {
        const newSet = new Set(selected);
        newSet.delete(id);
        setSelected(newSet);
      }
    } catch (err) { console.error(err); }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selected.size} destinations?`)) return;
    const nextData = optimisticDestinations.filter(d => !selected.has(d.id));
    try {
      await performOptimistic(nextData, Promise.all(Array.from(selected).map(id => api.deleteDestination(id))));
      setSelected(new Set());
      setSelectMode(false);
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
  };

  const upd = (patch: Partial<Destination>) => setFormData(f => ({ ...f, ...patch }));

  return (
    <div className="space-y-5 w-full max-w-5xl mx-auto" id="dtop">
      <style>{S}</style>

      {!canCRUD && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-700 text-sm font-medium">
          <span className="material-symbols-outlined">visibility</span>
          Read-only access. Contact an editor to make changes.
        </div>
      )}

      {canCRUD && (
        <>
          {/* Import Modal */}
          {showImport && (
            <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
              <div className="dark:bg-[#111] dark:border dark:border-white/10" style={{ background:'#fff', borderRadius:20, padding:28, maxWidth:680, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36, height:36, background:'#1a1a2e', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span className="material-symbols-outlined" style={{ color:'#fff', fontSize:18 }}>content_paste</span>
                    </div>
                    <div>
                      <h3 className="dark:text-white" style={{ margin:0, fontSize:15, fontWeight:800, color:'#111' }}>Import from Document</h3>
                      <p style={{ margin:0, fontSize:11, color:'#6b7280' }}>Paste your Word/quotation text — destination fields will auto-fill</p>
                    </div>
                  </div>
                  <button onClick={() => setShowImport(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280', fontSize:22 }}>×</button>
                </div>
                <textarea
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="Paste your full tour quotation or destination document text here..."
                  className="af-input"
                  style={{ width:'100%', height:260, padding:14, fontSize:12.5, fontFamily:'monospace', resize:'vertical', outline:'none', boxSizing:'border-box' }}
                />
                <div style={{ display:'flex', gap:10, marginTop:14, justifyContent:'flex-end' }}>
                  <button onClick={() => setShowImport(false)}
                    style={{ padding:'10px 20px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#f9fafb', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!importText.trim()) return;
                      const parsed = parseDestinationText(importText);
                      setFormData(f => ({ ...f, ...parsed }));
                      setImportText('');
                      setShowImport(false);
                      document.getElementById('dtop')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{ padding:'10px 22px', borderRadius:10, border:'none', background:'#111827', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize:16 }}>auto_awesome</span>
                    Auto-Fill Fields
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form Header */}
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-xl">{editingId ? 'edit_location' : 'add_location_alt'}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-on-surface dark:text-white">{editingId ? 'Edit Destination' : 'Create New Destination'}</h2>
              <p className="text-xs text-on-surface-variant">{editingId ? 'Update the details below.' : 'Add a new destination to your collection.'}</p>
            </div>
            <button onClick={() => setShowImport(true)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
              <span className="material-symbols-outlined" style={{ fontSize:15 }}>content_paste</span>
              Import from Doc
            </button>
            {editingId && (
              <button onClick={() => { setEditingId(null); setFormData(emptyForm); }}
                className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-sm">close</span> Discard
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Core Info */}
            <div className="af-section">
              <div className="af-sec-head blue">
                <div className="af-sec-icon blue"><span className="material-symbols-outlined text-base">public</span></div>
                <span className="text-sm font-bold text-on-surface dark:text-white">Core Information</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="af-label">Destination Name <span className="text-rose-500">*</span></label>
                  <input className="af-input" value={formData.name || ''} onChange={e => upd({ name: e.target.value })} placeholder="e.g., Kyoto, Japan" required />
                </div>
                <div>
                  <label className="af-label">Region <span className="text-rose-500">*</span></label>
                  <input className="af-input" value={formData.region || ''} onChange={e => upd({ region: e.target.value })} placeholder="e.g., Asia" required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="af-label">Description</label>
                  <textarea className="af-input" style={{ resize: 'none' }} rows={4} value={formData.description || ''} onChange={e => upd({ description: e.target.value })} placeholder="Destination philosophy & overview…" />
                </div>
                <div>
                  <label className="af-label">Essence Quote</label>
                  <textarea className="af-input" style={{ resize: 'none' }} rows={4} value={formData.essenceText || ''} onChange={e => upd({ essenceText: e.target.value })} placeholder="A poetic sidebar quote…" />
                </div>
              </div>
            </div>

            {/* Media */}
            <div className="af-section">
              <div className="af-sec-head violet">
                <div className="af-sec-icon violet"><span className="material-symbols-outlined text-base">photo_library</span></div>
                <span className="text-sm font-bold text-on-surface dark:text-white">Visual Media</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ImageUploader value={formData.heroImageUrl || ''} onChange={(v: string) => upd({ heroImageUrl: v })} label="Hero Cover Image" />
                <ImageUploader multiple value={formData.galleryImages || []} onChange={(v: string[]) => upd({ galleryImages: v })} label="Gallery Images" />
              </div>
            </div>

            {/* Seasons */}
            <div className="af-section">
              <div className="af-sec-head amber">
                <div className="af-sec-icon amber"><span className="material-symbols-outlined text-base">wb_sunny</span></div>
                <span className="text-sm font-bold text-on-surface dark:text-white">Seasonal Rhythms</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="af-label">Best Seasons Title</label>
                  <input className="af-input" value={formData.bestSeasonsTitle || ''} onChange={e => upd({ bestSeasonsTitle: e.target.value })} placeholder="e.g., Optimal Months" />
                </div>
                <div>
                  <label className="af-label">Best Months</label>
                  <input className="af-input" value={formData.bestSeasonsMonths || ''} onChange={e => upd({ bestSeasonsMonths: e.target.value })} placeholder="e.g., April – June" />
                </div>
              </div>
              <div className="mt-5">
                <p className="af-label mb-3">Season Highlights</p>
                <div className="space-y-4">
                  {(formData.seasonsHighlights || []).map((s, i) => (
                    <div key={i} className="af-sub">
                      <span className="af-sub-num">Season {i + 1}</span>
                      <button type="button" onClick={() => upd({ seasonsHighlights: (formData.seasonsHighlights || []).filter((_, x) => x !== i) })}
                        className="absolute top-2 right-3 text-red-400 hover:text-red-600 transition-colors">
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        <input className="af-input" placeholder="Season name (e.g., Spring)" value={s.season || ''}
                          onChange={e => { const u = [...(formData.seasonsHighlights||[])]; u[i]={...s,season:e.target.value}; upd({seasonsHighlights:u}); }} />
                        <textarea className="af-input" style={{resize:'none'}} rows={2} placeholder="What makes this season special…" value={s.description || ''}
                          onChange={e => { const u = [...(formData.seasonsHighlights||[])]; u[i]={...s,description:e.target.value}; upd({seasonsHighlights:u}); }} />
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => upd({ seasonsHighlights: [...(formData.seasonsHighlights||[]), { season:'', description:'' }] })}
                  className="af-btn-add" style={{borderColor:'#fcd34d',color:'#92400e',background:'#fffbeb'}}>
                  <span className="material-symbols-outlined text-base">add_circle</span> Add Season
                </button>
              </div>
            </div>

            {/* Landmarks */}
            <div className="af-section">
              <div className="af-sec-head emerald">
                <div className="af-sec-icon emerald"><span className="material-symbols-outlined text-base">place</span></div>
                <span className="text-sm font-bold text-on-surface dark:text-white flex-1">Iconic Landmarks</span>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-surface-container dark:bg-white/10 text-on-surface-variant dark:text-white/60">{(formData.landmarks||[]).length}</span>
              </div>
              <div className="space-y-4">
                {(formData.landmarks || []).map((lm, i) => (
                  <div key={i} className="af-sub">
                    <span className="af-sub-num">Landmark {i + 1}</span>
                    <button type="button" onClick={() => upd({ landmarks: (formData.landmarks||[]).filter((_,x)=>x!==i) })}
                      className="absolute top-2 right-3 text-red-400 hover:text-red-600 transition-colors">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 mb-3">
                      <input className="af-input" placeholder="Landmark title" value={lm.title||''}
                        onChange={e=>{ const u=[...(formData.landmarks||[])]; u[i]={...lm,title:e.target.value}; upd({landmarks:u}); }} />
                      <input className="af-input" placeholder="Category (e.g., Temple)" value={lm.category||''}
                        onChange={e=>{ const u=[...(formData.landmarks||[])]; u[i]={...lm,category:e.target.value}; upd({landmarks:u}); }} />
                    </div>
                    <textarea className="af-input mb-3" style={{resize:'none'}} rows={2} placeholder="Description…" value={lm.description||''}
                      onChange={e=>{ const u=[...(formData.landmarks||[])]; u[i]={...lm,description:e.target.value}; upd({landmarks:u}); }} />
                    <ImageUploader value={lm.imageUrl||''}
                      onChange={(v:string)=>{ const u=[...(formData.landmarks||[])]; u[i]={...lm,imageUrl:v}; upd({landmarks:u}); }}
                      label="Landmark Image" />
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => upd({ landmarks: [...(formData.landmarks||[]), { title:'', category:'', description:'', imageUrl:'' }] })}
                className="af-btn-add" style={{borderColor:'#6ee7b7',color:'#065f46',background:'#ecfdf5'}}>
                <span className="material-symbols-outlined text-base">add_circle</span> Add Landmark
              </button>
            </div>

            {/* Submit */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button type="submit" disabled={saving} className="af-btn dark">
                <span className="material-symbols-outlined text-base">{saving ? 'hourglass_top' : editingId ? 'save' : 'rocket_launch'}</span>
                {saving ? 'Saving…' : editingId ? 'Update Destination' : 'Publish Destination'}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setFormData(emptyForm); }} className="af-btn light">
                  <span className="material-symbols-outlined text-base">close</span> Cancel
                </button>
              )}
            </div>
          </form>
        </>
      )}

      {/* List */}
      <div className="af-section">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-on-surface dark:text-white">All Destinations</span>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black">{optimisticDestinations.length}</span>
          </div>
          <div className="relative flex-1 max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface-container-low dark:bg-white/5 border border-outline-variant/30 dark:border-white/10 rounded-xl focus:outline-none focus:border-black dark:focus:border-white focus:bg-white transition-all dark:text-white" />
          </div>
          {canCRUD && destinations.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectMode(!selectMode);
                  if (selectMode) setSelected(new Set());
                }}
                className={`px-3 py-1.5 flex items-center gap-1 rounded-lg text-xs font-bold uppercase transition-colors ${selectMode ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-surface-container dark:bg-white/5 border border-outline-variant/30 dark:border-white/10 text-on-surface dark:text-white/60'}`}
              >
                <span className="material-symbols-outlined text-sm">checklist</span>
                {selectMode ? 'Cancel' : 'Select'}
              </button>
              {selectMode && selected.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 flex items-center gap-1 rounded-lg text-xs font-bold uppercase bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Delete ({selected.size})
                </button>
              )}
            </div>
          )}
        </div>
        {loading ? <Preloader /> : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 block mb-3">travel_explore</span>
            <p className="text-sm font-medium text-on-surface-variant">{search ? 'No matches.' : 'No destinations yet.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(dest => (
              <div key={dest.id} className="af-list-card relative">
                {selectMode && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10" onClick={(e) => { e.stopPropagation(); toggleSelect(dest.id); }}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center border cursor-pointer transition-all ${selected.has(dest.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-black border-outline-variant/50 dark:border-white/20 hover:border-black dark:hover:border-white'}`}>
                      {selected.has(dest.id) && <span className="material-symbols-outlined text-xs">check</span>}
                    </div>
                  </div>
                )}
                <div className={`af-thumb flex-shrink-0 transition-all ${selectMode ? 'ml-10' : ''}`}>
                  {dest.heroImageUrl ? <img src={dest.heroImageUrl} alt={dest.name} />
                    : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-on-surface-variant/30 dark:text-white/10 text-2xl">image</span></div>}
                </div>
                <div className="flex-1 px-4 py-3 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-sm font-bold text-on-surface dark:text-white">{dest.name}</h4>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">{dest.region}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant dark:text-white/40 line-clamp-1 mb-2">{dest.description || 'No description.'}</p>
                  <div className="flex gap-3 flex-wrap">
                    {(dest.landmarks?.length ?? 0) > 0 && <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant dark:text-white/30"><span className="material-symbols-outlined text-sm" style={{color:'#10b981'}}>place</span>{dest.landmarks?.length} landmarks</span>}
                    {(dest.galleryImages?.length ?? 0) > 0 && <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant dark:text-white/30"><span className="material-symbols-outlined text-sm" style={{color:'#7c3aed'}}>photo_library</span>{dest.galleryImages?.length} photos</span>}
                    {dest.bestSeasonsMonths && <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant dark:text-white/30"><span className="material-symbols-outlined text-sm" style={{color:'#f59e0b'}}>wb_sunny</span>{dest.bestSeasonsMonths}</span>}
                  </div>
                </div>
                {canCRUD && (
                  <div className="flex flex-col gap-1.5 px-3 flex-shrink-0">
                    <button onClick={() => handleEdit(dest)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-bold transition-colors">
                      <span className="material-symbols-outlined text-sm">edit</span> Edit
                    </button>
                    <button onClick={() => handleDelete(dest.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold transition-colors">
                      <span className="material-symbols-outlined text-sm">delete</span> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
