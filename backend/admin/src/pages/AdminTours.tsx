import { useState, useEffect } from 'react';
import type { Tour } from '../lib/api';
import { api } from '../lib/api';
import { ImageUploader } from '../components/ImageUploader';
import { useAdminAuth } from '../lib/adminAuth';
import { Preloader } from '../components/Preloader';

const emptyForm: Partial<Tour> = {
  name: '', region: '', days: 7, price: '', category: 'Signature Series',
  heroImageUrl: '', overviewDescription: '', overviewExtended: '', overviewImageUrl: '',
  transport: '', guide: '', pickup: '', maxGuests: 8,
  visualArchive: [], itinerary: [], sightseeing: [], departureWindows: [],
};

const S = `
  .at-input{width:100%;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:13.5px;background:#fafafa;color:#111827;transition:all .2s;outline:none;}
  .at-input:focus{border-color:#111827;background:#fff;box-shadow:0 0 0 3px rgba(0,0,0,.06);}
  .at-input::placeholder{color:#9ca3af;}
  .at-label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:6px;}
  .at-section{background:#fff;border-radius:16px;padding:22px;border:1.5px solid #f0f0f0;box-shadow:0 1px 4px rgba(0,0,0,.05);}
  .at-sh{display:flex;align-items:center;gap:10px;margin-bottom:18px;padding-bottom:12px;}
  .at-sh.blue{border-bottom:2px solid #3b82f6;}
  .at-sh.green{border-bottom:2px solid #10b981;}
  .at-sh.violet{border-bottom:2px solid #7c3aed;}
  .at-sh.amber{border-bottom:2px solid #f59e0b;}
  .at-sh.rose{border-bottom:2px solid #f43f5e;}
  .at-sh.sky{border-bottom:2px solid #0ea5e9;}
  .at-si{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .at-si.blue{background:#dbeafe;color:#2563eb;}
  .at-si.green{background:#d1fae5;color:#059669;}
  .at-si.violet{background:#ede9fe;color:#7c3aed;}
  .at-si.amber{background:#fef3c7;color:#d97706;}
  .at-si.rose{background:#ffe4e6;color:#e11d48;}
  .at-si.sky{background:#e0f2fe;color:#0284c7;}
  .at-sub{background:#f9fafb;border-radius:12px;padding:16px;border:1.5px solid #f0f0f0;position:relative;}
  .at-sub-num{position:absolute;top:-10px;left:14px;background:#111827;color:#fff;border-radius:20px;font-size:9px;font-weight:900;padding:2px 10px;letter-spacing:.1em;text-transform:uppercase;}
  .at-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:10px;font-size:13px;font-weight:700;letter-spacing:.02em;transition:all .2s;border:none;cursor:pointer;}
  .at-btn.dark{background:#111827;color:#fff;}
  .at-btn.dark:hover{background:#1f2937;transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.2);}
  .at-btn.dark:disabled{opacity:.6;cursor:not-allowed;transform:none;}
  .at-btn.light{background:#f3f4f6;color:#374151;}
  .at-btn.light:hover{background:#e5e7eb;}
  .at-btn-add{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:700;transition:all .15s;border:1.5px dashed;cursor:pointer;margin-top:12px;}
  .at-card{display:flex;align-items:center;background:#fff;border-radius:14px;border:1.5px solid #f0f0f0;overflow:hidden;transition:all .2s;}
  .at-card:hover{border-color:#e5e7eb;box-shadow:0 4px 16px rgba(0,0,0,.08);transform:translateY(-1px);}
  .at-thumb{width:80px;height:80px;flex-shrink:0;background:#f3f4f6;overflow:hidden;}
  .at-thumb img{width:100%;height:100%;object-fit:cover;}
`;

export default function AdminTours() {
  const { canCRUD } = useAdminAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Tour>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTours();
    const iv = setInterval(loadTours, 5000);
    return () => clearInterval(iv);
  }, []);

  const loadTours = () =>
    api.listTours().then(d => { setTours(d); setLoading(false); }).catch(console.error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      editingId ? await api.updateTour(editingId, formData) : await api.createTour(formData);
      setFormData(emptyForm); setEditingId(null); loadTours();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleEdit = (t: Tour) => {
    setFormData(t); setEditingId(t.id);
    setTimeout(() => document.getElementById('ttop')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tour? This cannot be undone.')) return;
    try { await api.deleteTour(id); loadTours(); } catch (err) { console.error(err); }
  };

  const upd = (patch: Partial<Tour>) => setFormData(f => ({ ...f, ...patch }));

  const filtered = tours.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.region || '').toLowerCase().includes(search.toLowerCase())
  );

  const updItin = (i: number, patch: object) => {
    const u = [...(formData.itinerary || [])]; u[i] = { ...u[i], ...patch }; upd({ itinerary: u });
  };
  const updSight = (i: number, patch: object) => {
    const u = [...(formData.sightseeing || [])]; u[i] = { ...u[i], ...patch }; upd({ sightseeing: u });
  };

  return (
    <div className="space-y-5 w-full max-w-5xl mx-auto" id="ttop">
      <style>{S}</style>

      {!canCRUD && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-700 text-sm font-medium">
          <span className="material-symbols-outlined">visibility</span>
          Read-only access. Contact an editor to make changes.
        </div>
      )}

      {canCRUD && (
        <>
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-xl">{editingId ? 'edit_note' : 'tour'}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-on-surface">{editingId ? 'Edit Tour' : 'Create New Tour'}</h2>
              <p className="text-xs text-on-surface-variant">{editingId ? 'Update the tour details below.' : 'Design a new itinerary for your collection.'}</p>
            </div>
            {editingId && (
              <button onClick={() => { setEditingId(null); setFormData(emptyForm); }}
                className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-sm">close</span> Discard
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── Core Info ── */}
            <div className="at-section">
              <div className="at-sh blue">
                <div className="at-si blue"><span className="material-symbols-outlined text-base">flight</span></div>
                <span className="text-sm font-bold text-on-surface">Core Information</span>
              </div>
              <div className="mb-4">
                <label className="at-label">Tour Name <span className="text-rose-500">*</span></label>
                <input className="at-input" value={formData.name || ''} onChange={e => upd({ name: e.target.value })} placeholder="e.g., Japanese Zen & Craftsmanship" required />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="at-label">Region <span className="text-rose-500">*</span></label>
                  <input className="at-input" value={formData.region || ''} onChange={e => upd({ region: e.target.value })} placeholder="e.g., Japan" required />
                </div>
                <div>
                  <label className="at-label">Days</label>
                  <input type="number" className="at-input" value={formData.days || 7} onChange={e => upd({ days: parseInt(e.target.value) })} required />
                </div>
                <div>
                  <label className="at-label">Price <span className="text-rose-500">*</span></label>
                  <input className="at-input" value={formData.price || ''} onChange={e => upd({ price: e.target.value })} placeholder="e.g., $5,200" required />
                </div>
                <div>
                  <label className="at-label">Category</label>
                  <select className="at-input" value={formData.category || 'Signature Series'} onChange={e => upd({ category: e.target.value })}>
                    <option>Signature Series</option>
                    <option>Adventure Series</option>
                    <option>Cultural Heritage</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="at-label">Extended Description</label>
                <textarea className="at-input" style={{ resize: 'none' }} rows={3} value={formData.overviewExtended || ''} onChange={e => upd({ overviewExtended: e.target.value })} placeholder="Rich tour narrative for the overview section…" />
              </div>
            </div>

            {/* ── Quick Stats ── */}
            <div className="at-section">
              <div className="at-sh sky">
                <div className="at-si sky"><span className="material-symbols-outlined text-base">settings</span></div>
                <span className="text-sm font-bold text-on-surface">Tour Logistics</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Transport', key: 'transport', ph: 'e.g., Private Air' },
                  { label: 'Guide', key: 'guide', ph: 'e.g., Curator' },
                  { label: 'Pickup / Clearance', key: 'pickup', ph: 'e.g., VIP Access' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="at-label">{f.label}</label>
                    <input className="at-input" value={(formData as Record<string, unknown>)[f.key] as string || ''} onChange={e => upd({ [f.key]: e.target.value })} placeholder={f.ph} />
                  </div>
                ))}
                <div>
                  <label className="at-label">Max Guests</label>
                  <input type="number" className="at-input" value={formData.maxGuests || 8} onChange={e => upd({ maxGuests: parseInt(e.target.value) })} />
                </div>
              </div>
            </div>

            {/* ── Media ── */}
            <div className="at-section">
              <div className="at-sh violet">
                <div className="at-si violet"><span className="material-symbols-outlined text-base">photo_library</span></div>
                <span className="text-sm font-bold text-on-surface">Visual Media</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                <ImageUploader value={formData.heroImageUrl || ''} onChange={(v: string) => upd({ heroImageUrl: v })} label="Hero Cover Image" />
                <ImageUploader multiple value={formData.visualArchive || []} onChange={(v: string[]) => upd({ visualArchive: v })} label="Visual Archive (Gallery)" />
              </div>
              <div>
                <label className="at-label">Overview Section Image <span className="text-on-surface-variant/50 font-normal normal-case tracking-normal">(optional)</span></label>
                <ImageUploader value={formData.overviewImageUrl || ''} onChange={(v: string) => upd({ overviewImageUrl: v })} label="Overview Image" />
              </div>
            </div>

            {/* ── Itinerary ── */}
            <div className="at-section">
              <div className="at-sh green">
                <div className="at-si green"><span className="material-symbols-outlined text-base">route</span></div>
                <span className="text-sm font-bold text-on-surface flex-1">Itinerary (Day-by-Day)</span>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">{(formData.itinerary || []).length}</span>
              </div>
              <div className="space-y-5">
                {(formData.itinerary || []).map((day, i) => (
                  <div key={i} className="at-sub">
                    <span className="at-sub-num">Phase / Day {i + 1}</span>
                    <button type="button" onClick={() => upd({ itinerary: (formData.itinerary || []).filter((_, x) => x !== i) })}
                      className="absolute top-2 right-3 text-red-400 hover:text-red-600 transition-colors">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <input className="at-input" placeholder="Day Title (e.g. Day 1–2: Athens Arrival)" value={day.title || ''}
                        onChange={e => updItin(i, { title: e.target.value })} />
                      <input className="at-input" placeholder="Schedule: 09:00 Depart · 13:00 Lunch" value={day.schedule || ''}
                        onChange={e => updItin(i, { schedule: e.target.value })} />
                    </div>
                    <textarea className="at-input mt-3" style={{ resize: 'none' }} rows={2} placeholder="Day description…" value={day.description || ''}
                      onChange={e => updItin(i, { description: e.target.value })} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <input className="at-input" placeholder="Accommodation (e.g. Caldera Cave Suite)" value={day.accommodation || ''}
                        onChange={e => updItin(i, { accommodation: e.target.value })} />
                      <input className="at-input" placeholder="Meals Included (e.g. Breakfast, Dinner)" value={day.meals || ''}
                        onChange={e => updItin(i, { meals: e.target.value })} />
                    </div>
                    <div className="mt-3">
                      <ImageUploader value={day.imageUrl || ''} onChange={(v: string) => updItin(i, { imageUrl: v })} label="Day Photo (optional)" />
                    </div>
                  </div>
                ))}
              </div>
              <button type="button"
                onClick={() => upd({ itinerary: [...(formData.itinerary || []), { title: '', description: '', imageUrl: '', schedule: '', accommodation: '', meals: '' }] })}
                className="at-btn-add" style={{ borderColor: '#6ee7b7', color: '#065f46', background: '#ecfdf5' }}>
                <span className="material-symbols-outlined text-base">add_circle</span> Add Day
              </button>
            </div>

            {/* ── Sightseeing ── */}
            <div className="at-section">
              <div className="at-sh amber">
                <div className="at-si amber"><span className="material-symbols-outlined text-base">place</span></div>
                <span className="text-sm font-bold text-on-surface flex-1">Territory Landmarks</span>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">{(formData.sightseeing || []).length}</span>
              </div>
              <div className="space-y-4">
                {(formData.sightseeing || []).map((site, i) => (
                  <div key={i} className="at-sub">
                    <span className="at-sub-num">Landmark {i + 1}</span>
                    <button type="button" onClick={() => upd({ sightseeing: (formData.sightseeing || []).filter((_, x) => x !== i) })}
                      className="absolute top-2 right-3 text-red-400 hover:text-red-600 transition-colors">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 mb-3">
                      <input className="at-input" placeholder="Title" value={site.title || ''} onChange={e => updSight(i, { title: e.target.value })} />
                      <input className="at-input" placeholder="Icon (material symbol name)" value={site.icon || ''} onChange={e => updSight(i, { icon: e.target.value })} />
                    </div>
                    <textarea className="at-input mb-3" style={{ resize: 'none' }} rows={2} placeholder="Description…" value={site.description || ''} onChange={e => updSight(i, { description: e.target.value })} />
                    <ImageUploader value={site.imageUrl || ''} onChange={(v: string) => updSight(i, { imageUrl: v })} label="Landmark Image" />
                  </div>
                ))}
              </div>
              <button type="button"
                onClick={() => upd({ sightseeing: [...(formData.sightseeing || []), { title: '', description: '', icon: 'star', imageUrl: '' }] })}
                className="at-btn-add" style={{ borderColor: '#fcd34d', color: '#92400e', background: '#fffbeb' }}>
                <span className="material-symbols-outlined text-base">add_circle</span> Add Landmark
              </button>
            </div>

            {/* ── Departure Windows ── */}
            <div className="at-section">
              <div className="at-sh rose">
                <div className="at-si rose"><span className="material-symbols-outlined text-base">calendar_month</span></div>
                <span className="text-sm font-bold text-on-surface flex-1">Departure Windows</span>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">{(formData.departureWindows || []).length}</span>
              </div>
              <div className="space-y-2 mb-1">
                {(formData.departureWindows || []).map((win, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="material-symbols-outlined text-rose-400 text-base flex-shrink-0">flight_takeoff</span>
                    <input className="at-input flex-1" placeholder="e.g., May 15 – Jun 10" value={win}
                      onChange={e => { const u = [...(formData.departureWindows || [])]; u[i] = e.target.value; upd({ departureWindows: u }); }} />
                    <button type="button" onClick={() => upd({ departureWindows: (formData.departureWindows || []).filter((_, x) => x !== i) })}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors flex-shrink-0">
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => upd({ departureWindows: [...(formData.departureWindows || []), ''] })}
                className="at-btn-add" style={{ borderColor: '#fda4af', color: '#9f1239', background: '#fff1f2' }}>
                <span className="material-symbols-outlined text-base">add_circle</span> Add Window
              </button>
            </div>

            {/* ── Submit ── */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button type="submit" disabled={saving} className="at-btn dark">
                <span className="material-symbols-outlined text-base">{saving ? 'hourglass_top' : editingId ? 'save' : 'rocket_launch'}</span>
                {saving ? 'Saving…' : editingId ? 'Update Tour' : 'Publish Tour'}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setFormData(emptyForm); }} className="at-btn light">
                  <span className="material-symbols-outlined text-base">close</span> Cancel
                </button>
              )}
              <span className="text-xs text-on-surface-variant ml-auto hidden sm:block">
                {editingId ? '✏️ Editing existing tour' : '✨ Creating new tour'}
              </span>
            </div>
          </form>
        </>
      )}

      {/* ── List ── */}
      <div className="at-section">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-on-surface">All Tours</span>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-black text-white">{tours.length}</span>
          </div>
          <div className="relative flex-1 max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tours…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface-container-low border border-outline-variant/30 rounded-xl focus:outline-none focus:border-black focus:bg-white transition-all" />
          </div>
        </div>
        {loading ? <Preloader /> : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 block mb-3">flight</span>
            <p className="text-sm font-medium text-on-surface-variant">{search ? 'No matches.' : 'No tours yet.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(tour => (
              <div key={tour.id} className="at-card">
                <div className="at-thumb flex-shrink-0">
                  {tour.heroImageUrl
                    ? <img src={tour.heroImageUrl} alt={tour.name} />
                    : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-on-surface-variant/30 text-2xl">flight</span></div>}
                </div>
                <div className="flex-1 px-4 py-3 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-sm font-bold text-on-surface">{tour.name}</h4>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-green-50 text-green-700">{tour.days}d</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">{tour.category}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-2">{tour.region} · <span className="font-bold text-on-surface">{tour.price}</span></p>
                  <div className="flex gap-3 flex-wrap">
                    {tour.transport && <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant"><span className="material-symbols-outlined text-sm" style={{ color: '#0ea5e9' }}>flight</span>{tour.transport}</span>}
                    {tour.maxGuests && <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant"><span className="material-symbols-outlined text-sm" style={{ color: '#7c3aed' }}>group</span>Max {tour.maxGuests}</span>}
                    {(tour.itinerary?.length ?? 0) > 0 && <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant"><span className="material-symbols-outlined text-sm" style={{ color: '#10b981' }}>route</span>{tour.itinerary?.length} days</span>}
                    {(tour.sightseeing?.length ?? 0) > 0 && <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant"><span className="material-symbols-outlined text-sm" style={{ color: '#f59e0b' }}>place</span>{tour.sightseeing?.length} sites</span>}
                  </div>
                </div>
                {canCRUD && (
                  <div className="flex flex-col gap-1.5 px-3 flex-shrink-0">
                    <button onClick={() => handleEdit(tour)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors">
                      <span className="material-symbols-outlined text-sm">edit</span> Edit
                    </button>
                    <button onClick={() => handleDelete(tour.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors">
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
