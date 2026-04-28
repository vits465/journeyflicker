import { useState, useEffect } from 'react';
import type { Destination } from '../lib/api';
import { api } from '../lib/api';
import { ImageUploader } from '../components/ImageUploader';
import { useAdminAuth } from '../lib/adminAuth';
import { Preloader } from '../components/Preloader';

const emptyForm: Partial<Destination> = {
  name: '', region: '', description: '', essenceText: '',
  heroImageUrl: '', galleryImages: [], bestSeasonsTitle: '',
  bestSeasonsMonths: '', landmarks: [], seasonsHighlights: [],
};

const S = `
  .af-input{width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:13.5px;background:#fafafa;color:#111827;transition:all .2s;outline:none;}
  .af-input:focus{border-color:#111827;background:#fff;box-shadow:0 0 0 3px rgba(0,0,0,.06);}
  .af-input::placeholder{color:#9ca3af;}
  .af-label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:6px;}
  .af-section{background:#fff;border-radius:16px;padding:22px;border:1.5px solid #f0f0f0;box-shadow:0 1px 4px rgba(0,0,0,.05);}
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
  .af-sub-num{position:absolute;top:-10px;left:14px;background:#111827;color:#fff;border-radius:20px;font-size:9px;font-weight:900;padding:2px 10px;letter-spacing:.1em;text-transform:uppercase;}
  .af-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:10px;font-size:13px;font-weight:700;letter-spacing:.02em;transition:all .2s;border:none;cursor:pointer;}
  .af-btn.dark{background:#111827;color:#fff;}
  .af-btn.dark:hover{background:#1f2937;transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.2);}
  .af-btn.dark:disabled{opacity:.6;cursor:not-allowed;transform:none;}
  .af-btn.light{background:#f3f4f6;color:#374151;}
  .af-btn.light:hover{background:#e5e7eb;}
  .af-btn-add{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:700;transition:all .15s;border:1.5px dashed;cursor:pointer;margin-top:12px;}
  .af-list-card{display:flex;align-items:center;background:#fff;border-radius:14px;border:1.5px solid #f0f0f0;overflow:hidden;transition:all .2s;}
  .af-list-card:hover{border-color:#e5e7eb;box-shadow:0 4px 16px rgba(0,0,0,.08);transform:translateY(-1px);}
  .af-thumb{width:80px;height:80px;flex-shrink:0;background:#f3f4f6;overflow:hidden;}
  .af-thumb img{width:100%;height:100%;object-fit:cover;}
`;

export default function AdminDestinations() {
  const { canCRUD } = useAdminAuth();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Destination>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  useEffect(() => {
    loadDestinations();
    const iv = setInterval(loadDestinations, 5000);
    return () => clearInterval(iv);
  }, []);

  const loadDestinations = () =>
    api.listDestinations().then((d) => { setDestinations(d); setLoading(false); }).catch(console.error);

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
    if (!confirm('Delete this destination? This cannot be undone.')) return;
    try { 
      await api.deleteDestination(id); 
      loadDestinations(); 
      if (selected.has(id)) {
        const newSet = new Set(selected);
        newSet.delete(id);
        setSelected(newSet);
      }
    } catch (err) { console.error(err); }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selected.size} destinations? This cannot be undone.`)) return;
    try {
      await Promise.all(Array.from(selected).map(id => api.deleteDestination(id)));
      loadDestinations();
      setSelected(new Set());
      setSelectMode(false);
    } catch (err) {
      console.error('Bulk delete failed:', err);
      alert('Some items failed to delete.');
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
  };

  const upd = (patch: Partial<Destination>) => setFormData(f => ({ ...f, ...patch }));

  const filtered = destinations.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.region || '').toLowerCase().includes(search.toLowerCase())
  );

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
          {/* Form Header */}
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-xl">{editingId ? 'edit_location' : 'add_location_alt'}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-on-surface">{editingId ? 'Edit Destination' : 'Create New Destination'}</h2>
              <p className="text-xs text-on-surface-variant">{editingId ? 'Update the details below.' : 'Add a new destination to your collection.'}</p>
            </div>
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
                <span className="text-sm font-bold text-on-surface">Core Information</span>
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
                <span className="text-sm font-bold text-on-surface">Visual Media</span>
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
                <span className="text-sm font-bold text-on-surface">Seasonal Rhythms</span>
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
                <span className="text-sm font-bold text-on-surface flex-1">Iconic Landmarks</span>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">{(formData.landmarks||[]).length}</span>
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
            <span className="text-sm font-bold text-on-surface">All Destinations</span>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-black text-white">{destinations.length}</span>
          </div>
          <div className="relative flex-1 max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface-container-low border border-outline-variant/30 rounded-xl focus:outline-none focus:border-black focus:bg-white transition-all" />
          </div>
          {canCRUD && destinations.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectMode(!selectMode);
                  if (selectMode) setSelected(new Set());
                }}
                className={`px-3 py-1.5 flex items-center gap-1 rounded-lg text-xs font-bold uppercase transition-colors ${selectMode ? 'bg-blue-100 text-blue-700' : 'bg-surface-container border border-outline-variant/30 text-on-surface'}`}
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
                    <div className={`w-5 h-5 rounded flex items-center justify-center border cursor-pointer transition-all ${selected.has(dest.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-outline-variant/50 hover:border-black'}`}>
                      {selected.has(dest.id) && <span className="material-symbols-outlined text-xs">check</span>}
                    </div>
                  </div>
                )}
                <div className={`af-thumb flex-shrink-0 transition-all ${selectMode ? 'ml-10' : ''}`}>
                  {dest.heroImageUrl ? <img src={dest.heroImageUrl} alt={dest.name} />
                    : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-on-surface-variant/30 text-2xl">image</span></div>}
                </div>
                <div className="flex-1 px-4 py-3 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-sm font-bold text-on-surface">{dest.name}</h4>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{dest.region}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant line-clamp-1 mb-2">{dest.description || 'No description.'}</p>
                  <div className="flex gap-3 flex-wrap">
                    {(dest.landmarks?.length ?? 0) > 0 && <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant"><span className="material-symbols-outlined text-sm" style={{color:'#10b981'}}>place</span>{dest.landmarks?.length} landmarks</span>}
                    {(dest.galleryImages?.length ?? 0) > 0 && <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant"><span className="material-symbols-outlined text-sm" style={{color:'#7c3aed'}}>photo_library</span>{dest.galleryImages?.length} photos</span>}
                    {dest.bestSeasonsMonths && <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant"><span className="material-symbols-outlined text-sm" style={{color:'#f59e0b'}}>wb_sunny</span>{dest.bestSeasonsMonths}</span>}
                  </div>
                </div>
                {canCRUD && (
                  <div className="flex flex-col gap-1.5 px-3 flex-shrink-0">
                    <button onClick={() => handleEdit(dest)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors">
                      <span className="material-symbols-outlined text-sm">edit</span> Edit
                    </button>
                    <button onClick={() => handleDelete(dest.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors">
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
