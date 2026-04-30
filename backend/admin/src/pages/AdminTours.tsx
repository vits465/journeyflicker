import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { Tour } from '../lib/api';
import { api } from '../lib/api';
import { ImageUploader } from '../components/ImageUploader';
import { useAdminAuth } from '../lib/adminAuth';
import { Preloader } from '../components/Preloader';
import { useOptimisticUpdate } from '../lib/hooks';

const emptyForm: Partial<Tour> = {
  name: '', region: '', days: 7, price: '', category: 'Signature Series',
  heroImageUrl: '', overviewDescription: '', overviewExtended: '', overviewImageUrl: '',
  transport: '', guide: '', pickup: '', maxGuests: 8,
  visualArchive: [], itinerary: [], sightseeing: [], departureWindows: [],
};

const S = `
  .at-input{width:100%;padding:10px 14px;border:1.5px solid var(--color-outline-variant);border-radius:10px;font-size:13.5px;background:var(--color-surface-container-low);color:var(--color-on-surface);transition:all .2s;outline:none;}
  .at-input:focus{border-color:var(--color-primary);background:var(--color-surface);box-shadow:0 0 0 3px var(--color-primary-fixed-dim);}
  .at-input::placeholder{color:var(--color-on-surface-variant);opacity:0.5;}
  .at-label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--color-on-surface-variant);margin-bottom:6px;}
  .at-section{background:var(--color-surface);border-radius:16px;padding:22px;border:1.5px solid var(--color-outline-variant);box-shadow:0 1px 4px rgba(0,0,0,.05);}
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
  .at-sub{background:var(--color-surface-container-low);border-radius:12px;padding:16px;border:1.5px solid var(--color-outline-variant);position:relative;}
  .at-sub-num{position:absolute;top:-10px;left:14px;background:var(--color-on-surface);color:var(--color-surface);border-radius:20px;font-size:9px;font-weight:900;padding:2px 10px;letter-spacing:.1em;text-transform:uppercase;}
  .at-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:10px;font-size:13px;font-weight:700;letter-spacing:.02em;transition:all .2s;border:none;cursor:pointer;}
  .at-btn.dark{background:var(--color-on-surface);color:var(--color-surface);}
  .at-btn.dark:hover{opacity:0.9;transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.2);}
  .at-btn.dark:disabled{opacity:.6;cursor:not-allowed;transform:none;}
  .at-btn.light{background:var(--color-surface-container);color:var(--color-on-surface-variant);}
  .at-btn.light:hover{background:var(--color-surface-container-low);}
  .at-btn-add{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:700;transition:all .15s;border:1.5px dashed;cursor:pointer;margin-top:12px;}
  .at-card{display:flex;align-items:center;background:var(--color-surface);border-radius:14px;border:1.5px solid var(--color-outline-variant);overflow:hidden;transition:all .2s;}
  .at-card:hover{border-color:var(--color-on-surface-variant);box-shadow:0 4px 16px rgba(0,0,0,.08);transform:translateY(-1px);}
  .at-thumb{width:80px;height:80px;flex-shrink:0;background:var(--color-surface-container-low);overflow:hidden;}
  .at-thumb img{width:100%;height:100%;object-fit:cover;}
`;

// ── Smart Word/Quotation Text Parser ──────────────────────────────────────────
function parseQuotationText(raw: string): Partial<Tour> {
  // Normalize newlines
  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim() + '\n';

  // Extract tour name
  const destMatch = text.match(/DESTINATION\s*[:\-]?\s*([^\n]+)/i);
  const name = destMatch ? destMatch[1].trim() : '';
  const region = name;

  // Extract days/nights
  const daysMatch = text.match(/(\d+)\s*Night[s]?\s*(\d+)\s*Day[s]?/i) ||
    text.match(/(\d+)\s*Day[s]?/i);
  const days = daysMatch ? parseInt(daysMatch[2] || daysMatch[1]) : 7;

  // Extract price
  const priceMatch = text.match(/USD[.\s]*(\d+[,\d]*)/i) || text.match(/Price\s*[:\-]?\s*([^\n]+)/i);
  const price = priceMatch ? (priceMatch[1].startsWith('$') ? priceMatch[1] : `$${priceMatch[1]}`) : '';

  const sightseeing: Tour['sightseeing'] = [];
  const seenLandmarks = new Set<string>();

  // Extract itinerary
  const dayMatches = [...text.matchAll(/Day\s*(\d+)\s*[:\-]?\s*([^\n]*)\n([^]*?)(?=Day\s*\d+|Above Package|Package Includes|Package Excludes|Logistics|$)/gi)];
  const itinerary = dayMatches.slice(0, 25).map(m => {
    const dayNum = m[1];
    const title = m[2].trim();
    const content = m[3].trim();
    
    const accMatch = content.match(/Accommodation\s*[:\-]\s*([^\n]*)/i);
    const schMatch = content.match(/Schedule\s*[:\-]\s*([^\n]*)/i);
    const accommodation = accMatch ? accMatch[1].trim() : '';
    const schedule = schMatch ? schMatch[1].trim() : '';

    // Deep Scan for Landmarks within the day
    const dayBullets = content.match(/(?:^|\n)\s*[•\-\d.]+\s*([^\n]+)\n([^]*?)(?=\n\s*[•\-\d.]+\s*|Day\s*\d+|Accommodation|Schedule|$)/gi) || [];
    dayBullets.forEach(b => {
      const bMatch = b.match(/(?:^|\n)\s*[•\-\d.]+\s*([^\n]+)\n?([^]*)/i);
      if (bMatch) {
        const lName = bMatch[1].trim();
        const lDesc = bMatch[2].trim();
        if (lName.length > 3 && !seenLandmarks.has(lName.toLowerCase())) {
          seenLandmarks.add(lName.toLowerCase());
          sightseeing.push({
            title: lName,
            description: lDesc || `A featured landmark in the ${lName} region.`,
            icon: /Beach/i.test(lName) ? 'beach_access' : /Jail|Museum|Heritage/i.test(lName) ? 'museum' : 'star',
            imageUrl: '',
          });
        }
      }
    });

    const cleanDesc = content
      .replace(/Accommodation\s*[:\-]\s*[^\n]*/gi, '')
      .replace(/Schedule\s*[:\-]\s*[^\n]*/gi, '')
      .replace(/(?:^|\n)\s*[•\-\d.]+\s*([^\n]+)\n([^]*?)(?=\n\s*[•\-\d.]+\s*|Day\s*\d+|$)/gi, '')
      .replace(/\([BLD,\s/-]+\)/gi, '')
      .trim();

    const mealsMatch = content.match(/\(([BLD,\s/-]+)\)/i);
    const meals = mealsMatch ? mealsMatch[1]
      .replace(/B/g, 'Breakfast').replace(/L/g, 'Lunch').replace(/D/g, 'Dinner')
      .replace(/[\/-]/g, ', ') : '';

    return {
      title: `Day ${dayNum}${title ? ': ' + title : ''}`,
      description: cleanDesc || content.split('\n')[0], // Fallback to first line if everything was landmarks
      meals,
      accommodation,
      schedule,
      imageUrl: '',
    };
  });

  const overviewMatch = text.match(/OVERVIEW\s*[:\-]?\s*([^]*?)(?=Day\s*\d+|Above Package|Package Includes|Logistics|$)/i);
  const overviewExtended = overviewMatch ? overviewMatch[1].trim() : '';

  // Also scan Package Includes for global highlights
  const includesMatch = text.match(/Package Includes\s*[:\-]?\s*([^]*?)(?=Package Excludes|Cancellation|Logistics|$)/i);
  if (includesMatch) {
    const bullets = includesMatch[1].match(/(?:^|\n)\s*[•\-\d.]+\s*([^\n]+)/gm) || [];
    bullets.forEach(b => {
      const t = b.replace(/^[\s•\-\d.]+/, '').trim();
      if (t.length > 3 && !seenLandmarks.has(t.toLowerCase())) {
        seenLandmarks.add(t.toLowerCase());
        sightseeing.push({ title: t, description: t, icon: 'verified', imageUrl: '' });
      }
    });
  }

  const transport = text.match(/Transport\s*[:\-]?\s*([^\n]+)/i)?.[1] || 
                   (/flight|private transfer|ferry/i.test(text) ? 'Private Transfers & Ferry' : '');
  const guide = text.match(/Guide\s*[:\-]?\s*([^\n]+)/i)?.[1] || '';
  const pickup = text.match(/Arrive in\s*([^\n]+)/i)?.[1] || (text.match(/Airport\s*Dropping/i) ? 'Airport Transfer' : '');

  return {
    name, region, days, price,
    category: 'Signature Expedition',
    rating: 4.8,
    transport, guide, pickup,
    overviewDescription: name ? `A curated ${days}-day journey through ${region}.` : '',
    overviewExtended: overviewExtended || `An expertly crafted itinerary covering the highlights, culture, and natural beauty of ${region}.`,
    itinerary: itinerary.length > 0 ? itinerary : [],
    sightseeing: sightseeing.slice(0, 12), // Keep up to 12 top landmarks
    visualArchive: [], departureWindows: [], maxGuests: 8, heroImageUrl: '',
  };
}

export default function AdminTours() {
  const { canCRUD } = useAdminAuth();
  const location = useLocation();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Tour>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  const { data: optimisticTours, performOptimistic } = useOptimisticUpdate(tours);

  useEffect(() => {
    loadTours();
    const iv = setInterval(loadTours, 5000);
    return () => clearInterval(iv);
  }, []);

  // Handle deep-link editing via URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (editId && tours.length > 0) {
      const tour = tours.find(t => t.id === editId);
      if (tour) handleEdit(tour);
    }
  }, [location.search, tours]);

  const loadTours = () =>
    api.listTours().then(d => { setTours(d || []); setLoading(false); }).catch(console.error);

  const filtered = optimisticTours.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.region || '').toLowerCase().includes(search.toLowerCase())
  );

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
  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selected.size} tours?`)) return;
    const nextData = optimisticTours.filter(t => !selected.has(t.id));
    try {
      await performOptimistic(nextData, Promise.all(Array.from(selected).map(id => api.deleteTour(id))));
      setTours(nextData);
      setSelected(new Set());
      setSelectMode(false);
    } catch (err) {
      console.error('Bulk delete failed:', err);
      loadTours();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tour?')) return;
    const nextData = optimisticTours.filter(t => t.id !== id);
    try {
      await performOptimistic(nextData, api.deleteTour(id));
      // Also update the base tours list to prevent the interval from bringing it back
      setTours(nextData);
      if (selected.has(id)) {
        const newSet = new Set(selected);
        newSet.delete(id);
        setSelected(newSet);
      }
    } catch (err) { 
      console.error(err);
      // Re-fetch to ensure we have the real state if something failed
      loadTours();
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
  };

  const upd = (patch: Partial<Tour>) => setFormData(f => ({ ...f, ...patch }));

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
          {/* Import Modal */}
          {showImport && (
            <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
              <div className="bg-surface border border-outline-variant shadow-2xl" style={{ borderRadius:20, padding:28, maxWidth:680, width:'100%' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36, height:36, background:'var(--color-on-surface)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span className="material-symbols-outlined" style={{ color:'var(--color-surface)', fontSize:18 }}>content_paste</span>
                    </div>
                    <div>
                      <h3 className="text-on-surface" style={{ margin:0, fontSize:15, fontWeight:800 }}>Import from Document</h3>
                      <p className="text-on-surface-variant" style={{ margin:0, fontSize:11 }}>Paste your Word/quotation text below — fields will auto-fill</p>
                    </div>
                  </div>
                  <button onClick={() => setShowImport(false)} className="text-on-surface-variant hover:text-on-surface transition-colors" style={{ background:'none', border:'none', cursor:'pointer', fontSize:22 }}>×</button>
                </div>
                <textarea
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="Paste your full tour quotation or Word document text here..."
                  className="at-input"
                  style={{ width:'100%', height:260, padding:14, fontSize:12.5, fontFamily:'monospace', resize:'vertical', outline:'none', boxSizing:'border-box' }}
                />
                <div style={{ display:'flex', gap:10, marginTop:14, justifyContent:'flex-end' }}>
                  <button onClick={() => setShowImport(false)}
                    className="bg-surface-container text-on-surface-variant hover:bg-surface-container-low transition-colors"
                    style={{ padding:'10px 20px', borderRadius:10, border:'1.5px solid var(--color-outline-variant)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!importText.trim()) return;
                      const parsed = parseQuotationText(importText);
                      setFormData(f => ({ ...f, ...parsed }));
                      setImportText('');
                      setShowImport(false);
                      document.getElementById('ttop')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-primary text-on-primary hover:opacity-90 transition-colors"
                    style={{ padding:'10px 22px', borderRadius:10, border:'none', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize:16 }}>auto_awesome</span>
                    Auto-Fill Fields
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-xl">{editingId ? 'edit_note' : 'tour'}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-on-surface dark:text-white">{editingId ? 'Edit Tour' : 'Create New Tour'}</h2>
              <p className="text-xs text-on-surface-variant">{editingId ? 'Update the tour details below.' : 'Design a new itinerary for your collection.'}</p>
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

            {/* ── Core Info ── */}
            <div className="at-section">
              <div className="at-sh blue">
                <div className="at-si blue"><span className="material-symbols-outlined text-base">flight</span></div>
                <span className="text-sm font-bold text-on-surface dark:text-white">Core Information</span>
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
                <span className="text-sm font-bold text-on-surface dark:text-white">Tour Logistics</span>
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
                <span className="text-sm font-bold text-on-surface dark:text-white">Visual Media</span>
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
                <span className="text-sm font-bold text-on-surface dark:text-white flex-1">Itinerary (Day-by-Day)</span>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-surface-container dark:bg-white/10 text-on-surface-variant dark:text-white/60">{(formData.itinerary || []).length}</span>
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
                <span className="text-sm font-bold text-on-surface dark:text-white flex-1">Territory Landmarks</span>
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
                <span className="text-sm font-bold text-on-surface dark:text-white flex-1">Departure Windows</span>
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
            <span className="text-sm font-bold text-on-surface dark:text-white">All Tours</span>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black">{optimisticTours.length}</span>
          </div>
          <div className="relative flex-1 max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tours…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface-container-low dark:bg-white/5 border border-outline-variant/30 dark:border-white/10 rounded-xl focus:outline-none focus:border-black dark:focus:border-white focus:bg-white transition-all dark:text-white" />
          </div>
          {canCRUD && tours.length > 0 && (
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
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 block mb-3">flight</span>
            <p className="text-sm font-medium text-on-surface-variant">{search ? 'No matches.' : 'No tours yet.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(tour => (
              <div key={tour.id} className="at-card relative">
                {selectMode && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10" onClick={(e) => { e.stopPropagation(); toggleSelect(tour.id); }}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center border cursor-pointer transition-all ${selected.has(tour.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-black border-outline-variant/50 dark:border-white/20 hover:border-black dark:hover:border-white'}`}>
                      {selected.has(tour.id) && <span className="material-symbols-outlined text-xs">check</span>}
                    </div>
                  </div>
                )}
                <div className={`at-thumb flex-shrink-0 transition-all ${selectMode ? 'ml-10' : ''}`}>
                  {tour.heroImageUrl
                    ? <img src={tour.heroImageUrl} alt={tour.name} />
                    : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-on-surface-variant/30 dark:text-white/10 text-2xl">flight</span></div>}
                </div>
                <div className="flex-1 px-4 py-3 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-sm font-bold text-on-surface dark:text-white">{tour.name}</h4>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">{tour.days}d</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container dark:bg-white/10 text-on-surface-variant dark:text-white/40">{tour.category}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant dark:text-white/40 mb-2">{tour.region} · <span className="font-bold text-on-surface dark:text-white/60">{tour.price}</span></p>
                  <div className="flex gap-3 flex-wrap">
                    {tour.transport && <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant"><span className="material-symbols-outlined text-sm" style={{ color: '#0ea5e9' }}>flight</span>{tour.transport}</span>}
                    {tour.maxGuests && <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant"><span className="material-symbols-outlined text-sm" style={{ color: '#7c3aed' }}>group</span>Max {tour.maxGuests}</span>}
                    {(tour.itinerary?.length ?? 0) > 0 && <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant dark:text-white/30"><span className="material-symbols-outlined text-sm" style={{ color: '#10b981' }}>route</span>{tour.itinerary?.length} days</span>}
                    {(tour.sightseeing?.length ?? 0) > 0 && <span className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant dark:text-white/30"><span className="material-symbols-outlined text-sm" style={{ color: '#f59e0b' }}>place</span>{tour.sightseeing?.length} sites</span>}
                  </div>
                </div>
                {canCRUD && (
                  <div className="flex flex-col gap-1.5 px-3 flex-shrink-0">
                    <button onClick={() => handleEdit(tour)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-bold transition-colors">
                      <span className="material-symbols-outlined text-sm">edit</span> Edit
                    </button>
                    <button onClick={() => handleDelete(tour.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold transition-colors">
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
