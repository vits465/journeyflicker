import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { Visa } from '../lib/api';
import { api } from '../lib/api';
import { useAdminAuth } from '../lib/adminAuth';
import { ImageUploader } from '../components/ImageUploader';
import { Preloader } from '../components/Preloader';

const emptyForm: Partial<Visa> = {
  country: '', processing: '', difficulty: 'Moderate', fee: '',
  heroImageUrl: '', description: '', visaType: '',
  documents: [], requirements: [],
};

const inputCls = 'w-full px-3 py-2 border border-outline-variant/40 rounded-lg text-sm focus:outline-none focus:border-primary bg-surface-container-low text-on-surface transition-colors';
const labelCls = 'block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.15em] mb-1.5';

export default function AdminVisas() {
  const { canCRUD } = useAdminAuth();
  const location = useLocation();
  const [visas, setVisas] = useState<Visa[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Visa>>(emptyForm);
  const [newDoc, setNewDoc] = useState('');
  const [newReqLabel, setNewReqLabel] = useState('');
  const [newReqDetail, setNewReqDetail] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  useEffect(() => {
    loadVisas();
    const interval = setInterval(loadVisas, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handle deep-link editing via URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (editId && visas.length > 0) {
      const visa = visas.find(v => v.id === editId);
      if (visa) handleEdit(visa);
    }
  }, [location.search, visas]);

  const loadVisas = () =>
    api.listVisas().then(data => { setVisas(data || []); setLoading(false); }).catch(console.error);

  const upd = (patch: Partial<Visa>) => setFormData(prev => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      editingId ? await api.updateVisa(editingId, formData) : await api.createVisa(formData);
      setFormData(emptyForm); setEditingId(null); loadVisas();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (visa: Visa) => { setFormData({ ...visa }); setEditingId(visa.id); };
  const handleDelete = async (id: string) => {
    if (confirm('Delete this visa requirement?')) {
      try { 
        await api.deleteVisa(id); 
        loadVisas(); 
        if (selected.has(id)) {
          const newSet = new Set(selected);
          newSet.delete(id);
          setSelected(newSet);
        }
      } catch (err) { console.error(err); }
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selected.size} visas? This cannot be undone.`)) return;
    try {
      await Promise.all(Array.from(selected).map(id => api.deleteVisa(id)));
      loadVisas();
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

  // Document list helpers
  const addDoc = () => {
    if (!newDoc.trim()) return;
    upd({ documents: [...(formData.documents || []), newDoc.trim()] });
    setNewDoc('');
  };
  const removeDoc = (i: number) => upd({ documents: (formData.documents || []).filter((_, j) => j !== i) });

  // Requirements helpers
  const addReq = () => {
    if (!newReqLabel.trim() || !newReqDetail.trim()) return;
    upd({ requirements: [...(formData.requirements || []), { label: newReqLabel.trim(), detail: newReqDetail.trim() }] });
    setNewReqLabel(''); setNewReqDetail('');
  };
  const removeReq = (i: number) => upd({ requirements: (formData.requirements || []).filter((_, j) => j !== i) });

  const difficultyBadge = (d?: string) =>
    d === 'Easy' ? 'bg-green-50 text-green-700' : d === 'Moderate' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700';

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto pb-12">
      {!canCRUD && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs font-semibold">
          <span className="material-symbols-outlined text-base">visibility</span>
          Read-only access. Contact an editor to make changes.
        </div>
      )}

      {/* ── Form ── */}
      {canCRUD && (
        <div className="bg-surface rounded-2xl shadow-sm p-5 md:p-7 border border-outline-variant/30 space-y-6">
          <h2 className="text-lg font-semibold text-on-surface">
            {editingId ? '✏️ Edit' : '+ Create'} Visa Dossier
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Country *</label>
                <input type="text" value={formData.country || ''} onChange={e => upd({ country: e.target.value })}
                  className={inputCls} placeholder="e.g., Japan" required />
              </div>
              <div>
                <label className={labelCls}>Visa Type</label>
                <input type="text" value={formData.visaType || ''} onChange={e => upd({ visaType: e.target.value })}
                  className={inputCls} placeholder="e.g., Tourist Visa, E-Visa, On Arrival" />
              </div>
              <div>
                <label className={labelCls}>Processing Time *</label>
                <input type="text" value={formData.processing || ''} onChange={e => upd({ processing: e.target.value })}
                  className={inputCls} placeholder="e.g., 2–4 weeks" required />
              </div>
              <div>
                <label className={labelCls}>Estimated Fee *</label>
                <input type="text" value={formData.fee || ''} onChange={e => upd({ fee: e.target.value })}
                  className={inputCls} placeholder="e.g., $100–$150" required />
              </div>
              <div>
                <label className={labelCls}>Difficulty *</label>
                <select value={formData.difficulty || 'Moderate'} onChange={e => upd({ difficulty: e.target.value })} className={inputCls}>
                  <option>Easy</option>
                  <option>Moderate</option>
                  <option>Difficult</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                value={formData.description || ''}
                onChange={e => upd({ description: e.target.value })}
                className={inputCls} rows={3}
                placeholder="Brief overview of the visa process for this country..."
              />
            </div>

            {/* Hero Image */}
            <div className="pt-4 border-t border-outline-variant/10">
              <label className={labelCls}>Hero / Background Image</label>
              <p className="text-xs text-on-surface-variant mb-3 opacity-60">Shown as the card background image on the visa page.</p>
              <ImageUploader
                value={formData.heroImageUrl || ''}
                onChange={(v: string) => upd({ heroImageUrl: v })}
                label=""
              />
            </div>

            {/* Required Documents */}
            <div className="pt-4 border-t border-outline-variant/10">
              <label className={labelCls}>Required Documents</label>
              <div className="space-y-2 mb-3">
                {(formData.documents || []).map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-surface-container-low rounded-lg">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                    <span className="text-sm flex-1">{doc}</span>
                    <button type="button" onClick={() => removeDoc(i)} className="text-red-400 hover:text-red-600">
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDoc}
                  onChange={e => setNewDoc(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDoc())}
                  className={`${inputCls} flex-1`}
                  placeholder="e.g., Valid Passport (6+ months validity)"
                />
                <button type="button" onClick={addDoc} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:opacity-90 transition-colors whitespace-nowrap">
                  + Add
                </button>
              </div>
            </div>

            {/* Key Requirements */}
            <div className="pt-4 border-t border-outline-variant/10">
              <label className={labelCls}>Key Requirements (Label + Detail)</label>
              <div className="space-y-2 mb-3">
                {(formData.requirements || []).map((req, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-surface-container-low rounded-lg">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <span className="text-xs font-semibold">{req.label}</span>
                      <span className="text-xs text-on-surface-variant">{req.detail}</span>
                    </div>
                    <button type="button" onClick={() => removeReq(i)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={newReqLabel} onChange={e => setNewReqLabel(e.target.value)}
                  className={inputCls} placeholder="Label e.g., Min. Funds" />
                <input type="text" value={newReqDetail} onChange={e => setNewReqDetail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addReq())}
                  className={inputCls} placeholder="Detail e.g., €3,000 / month" />
              </div>
              <button type="button" onClick={addReq} className="mt-2 px-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs font-bold hover:bg-surface-container transition-colors">
                + Add Requirement
              </button>
            </div>

            {/* Submit */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-outline-variant/10">
              <button type="submit" className="px-6 py-2.5 bg-primary text-on-primary rounded-full text-xs font-bold tracking-widest uppercase hover:opacity-90 transition-colors shadow-md">
                {editingId ? 'Update' : 'Create'} Visa
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setFormData(emptyForm); }}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ── Visa List ── */}
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-on-surface">All Visa Dossiers</h2>
            <span className="text-xs text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded-full font-bold">{visas.length}</span>
          </div>
          {canCRUD && visas.length > 0 && (
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
        {loading ? <Preloader /> : visas.length === 0 ? (
          <div className="p-10 text-center text-sm text-on-surface-variant italic opacity-60">No visa dossiers yet. Add one above!</div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {visas.map(visa => (
              <div key={visa.id} className="flex items-center gap-4 p-4 hover:bg-surface-container-low/40 transition-colors group relative">
                {selectMode && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10" onClick={(e) => { e.stopPropagation(); toggleSelect(visa.id); }}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center border cursor-pointer transition-all ${selected.has(visa.id) ? 'bg-primary border-primary text-on-primary' : 'bg-surface border-outline-variant/50 hover:border-on-surface'}`}>
                      {selected.has(visa.id) && <span className="material-symbols-outlined text-xs">check</span>}
                    </div>
                  </div>
                )}
                {/* Thumbnail */}
                <div className={`flex-shrink-0 transition-all ${selectMode ? 'ml-8' : ''}`}>
                  {visa.heroImageUrl ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-outline-variant/20">
                      <img src={visa.heroImageUrl} alt={visa.country} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-surface-container-low flex items-center justify-center border border-outline-variant/20">
                      <span className="material-symbols-outlined text-xl text-on-surface-variant/40 font-light">public</span>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm truncate">{visa.country}</p>
                    {visa.visaType && <span className="text-[9px] text-on-surface-variant/50 font-bold tracking-widest uppercase">{visa.visaType}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <span>{visa.processing}</span>
                    <span>·</span>
                    <span>{visa.fee}</span>
                    {visa.documents && visa.documents.length > 0 && (
                      <><span>·</span><span>{visa.documents.length} docs</span></>
                    )}
                  </div>
                </div>
                {/* Badge */}
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold hidden sm:block ${difficultyBadge(visa.difficulty)}`}>
                  {visa.difficulty}
                </span>
                {/* Actions */}
                {canCRUD && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(visa)} className="w-8 h-8 rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary flex items-center justify-center transition-all">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button onClick={() => handleDelete(visa.id)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-500 hover:text-white text-red-500 flex items-center justify-center transition-all">
                      <span className="material-symbols-outlined text-sm">delete</span>
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
