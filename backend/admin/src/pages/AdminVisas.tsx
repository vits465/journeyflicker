import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { Visa } from '../lib/api';
import { api, uploadImage } from '../lib/api';
import { useAdminAuth } from '../lib/adminAuth';
import { ImageUploader } from '../components/ImageUploader';
import { Preloader } from '../components/Preloader';

const emptyForm: Partial<Visa> = {
  country: '', processing: '', difficulty: 'Moderate', fee: '',
  heroImageUrl: '', description: '', visaType: '',
  documents: [], requirements: [],
};

// ── Smart Visa Document Parser ──────────────────────────────────────────────
function parseVisaText(raw: string): Partial<Visa> {
  const text = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00A0/g, ' ') 
    .trim() + '\n';
  
  const country = text.match(/(?:COUNTRY|DESTINATION|FOR)\s*[:\-]?\s*([^\n]+)/i)?.[1].trim() || '';
  const visaType = text.match(/(?:VISA TYPE|CATEGORY)\s*[:\-]?\s*([^\n]+)/i)?.[1].trim() || '';
  const processing = text.match(/(?:PROCESSING|DURATION|TIME)\s*[:\-]?\s*([^\n]+)/i)?.[1].trim() || '';
  const fee = text.match(/(?:FEE|PRICE|COST)\s*[:\-]?\s*([^\n]+)/i)?.[1].trim() || '';
  const description = text.match(/OVERVIEW\s*[:\-]?\s*([^]*?)(?=DOCUMENTS|REQUIREMENTS|$) /i)?.[1].trim() || '';

  const documents: string[] = [];
  const docsMatch = text.match(/(?:DOCUMENTS|REQUIRED DOCUMENTS|CHECKLIST)\s*[:\-]?\s*([^]*?)(?=REQUIREMENTS|FEE|PROCESSING|COST|$)/i);
  if (docsMatch) {
    const bullets = docsMatch[1].match(/(?:^|\n)\s*[•\-\d.]+\s*([^\n]+)/gm) || [];
    bullets.forEach(b => {
      const t = b.replace(/^[\s•\-\d.]+/, '').trim();
      if (t.length > 2) documents.push(t);
    });
  }

  const requirements: Visa['requirements'] = [];
  const reqsMatch = text.match(/(?:REQUIREMENTS|KEY REQUIREMENTS|CRITERIA)\s*[:\-]?\s*([^]*?)(?=DOCUMENTS|FEE|PROCESSING|COST|$)/i);
  if (reqsMatch) {
    const lines = reqsMatch[1].split('\n').filter(l => l.trim().length > 3);
    lines.forEach(line => {
      const parts = line.split(/[:\-]/);
      if (parts.length >= 2) {
        requirements.push({ 
          label: parts[0].replace(/^[\s•\-\d.]+/, '').trim(), 
          detail: parts.slice(1).join(':').trim() 
        });
      } else {
         requirements.push({ label: 'Requirement', detail: line.replace(/^[\s•\-\d.]+/, '').trim() });
      }
    });
  }

  return { country, visaType, processing, fee, description, documents, requirements };
}

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
  const [isDocUploading, setIsDocUploading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const docInputRef = useRef<HTMLInputElement>(null);

  // Handle cross-page import from dashboard
  useEffect(() => {
    const state = location.state as { importText?: string };
    if (state?.importText) {
      const parsed = parseVisaText(state.importText);
      setFormData(prev => ({ ...prev, ...parsed }));
      // Clear state to prevent re-importing on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
      // Locally filter immediately to prevent "back back" behavior
      setVisas(prev => prev.filter(v => v.id !== id));
      try { 
        await api.deleteVisa(id); 
        // Optional: wait a bit before refreshing to let KV propagate
        setTimeout(loadVisas, 1000);
        if (selected.has(id)) {
          const newSet = new Set(selected);
          newSet.delete(id);
          setSelected(newSet);
        }
      } catch (err) { 
        console.error(err);
        loadVisas(); // Revert on failure
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selected.size} visas? This cannot be undone.`)) return;
    // Filter locally first
    setVisas(prev => prev.filter(v => !selected.has(v.id)));
    try {
      await Promise.all(Array.from(selected).map(id => api.deleteVisa(id)));
      setTimeout(loadVisas, 1000);
      setSelected(new Set());
      setSelectMode(false);
    } catch (err) {
      console.error('Bulk delete failed:', err);
      loadVisas();
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

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsDocUploading(true);
    try {
      const url = await uploadImage(file);
      upd({ documents: [...(formData.documents || []), `${file.name}|${url}`] });
    } catch (err) {
      console.error('Doc upload failed:', err);
      alert('Upload failed.');
    } finally {
      setIsDocUploading(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
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
    <div className="space-y-6 w-full max-w-4xl mx-auto pb-12" id="vtop">
      {!canCRUD && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs font-semibold">
          <span className="material-symbols-outlined text-base">visibility</span>
          Read-only access. Contact an editor to make changes.
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div className="bg-surface border border-outline-variant shadow-2xl" style={{ borderRadius:20, padding:28, maxWidth:680, width:'100%' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, background:'var(--color-on-surface)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span className="material-symbols-outlined" style={{ color:'var(--color-surface)', fontSize:18 }}>description</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface mb-1">Import Visa Dossier</h3>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed uppercase tracking-widest font-bold opacity-60">Upload .docx or paste visa requirements.</p>
                </div>
              </div>
              <button onClick={() => setShowImport(false)} className="text-on-surface-variant hover:text-on-surface transition-colors" style={{ background:'none', border:'none', cursor:'pointer', fontSize:22 }}>×</button>
            </div>
            
            <DocxUploader 
              onParsed={(text) => setImportText(text)} 
              label="Upload Word Document (.docx)"
              className="mb-4"
            />

            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              className="w-full h-48 px-4 py-3 border-2 border-outline-variant/30 rounded-2xl text-[11px] font-mono focus:border-primary transition-all bg-surface-container-low"
              placeholder="Paste raw visa text here..."
            />

            <div style={{ display:'flex', gap:10, marginTop:18, justifyContent:'flex-end' }}>
              <button onClick={() => setShowImport(false)} className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold">Cancel</button>
              <button
                onClick={() => {
                  if (!importText.trim()) return;
                  const parsed = parseVisaText(importText);
                  setFormData(f => ({ ...f, ...parsed }));
                  setImportText('');
                  setShowImport(false);
                  document.getElementById('vtop')?.scrollIntoView({ behavior:'smooth' });
                }}
                className="px-6 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"
              >
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                Auto-Fill Visa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-xl">description</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-on-surface">Visa Intelligence</h2>
            <p className="text-xs text-on-surface-variant">Manage global mobility dossiers and entry requirements.</p>
          </div>
        </div>
        <button onClick={() => setShowImport(true)} className="px-4 py-2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:scale-105 transition-all active:scale-95">
          <span className="material-symbols-outlined text-sm">upload_file</span>
          Import Doc
        </button>
      </div>

      {/* ── Form ── */}
      {canCRUD && (
        <div className="bg-surface rounded-2xl shadow-sm p-5 md:p-7 border border-outline-variant/30 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-widest opacity-60">
              {editingId ? '✏️ Edit' : '+ Create'} Visa Dossier
            </h2>
            {editingId && (
              <button onClick={() => { setEditingId(null); setFormData(emptyForm); }} className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Discard Changes</button>
            )}
          </div>
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
                {(formData.documents || []).map((doc, i) => {
                  const [name, url] = doc.includes('|') ? doc.split('|') : [doc, null];
                  return (
                    <div key={i} className="flex items-center gap-2 p-2 bg-surface-container-low rounded-lg">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="text-sm truncate">{name}</span>
                        {url && (
                          <a href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[10px] font-bold uppercase shrink-0 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">open_in_new</span> View
                          </a>
                        )}
                      </div>
                      <button type="button" onClick={() => removeDoc(i)} className="text-red-400 hover:text-red-600 shrink-0">
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  );
                })}
              </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={newDoc}
                      onChange={e => setNewDoc(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDoc())}
                      className={`${inputCls} flex-1`}
                      placeholder="e.g., Valid Passport (6+ months validity)"
                    />
                    <button type="button" onClick={addDoc} className="px-4 py-2 bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg text-xs font-bold hover:bg-surface-container transition-colors whitespace-nowrap">
                      + Add
                    </button>
                  </div>
                  <div className="shrink-0 flex gap-2">
                    <input type="file" ref={docInputRef} onChange={handleDocUpload} className="hidden" accept=".pdf,.doc,.docx,image/*" />
                    <button 
                      type="button" 
                      onClick={() => docInputRef.current?.click()}
                      disabled={isDocUploading}
                      className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:opacity-90 transition-colors whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">{isDocUploading ? 'hourglass_empty' : 'upload_file'}</span>
                      {isDocUploading ? 'Uploading...' : 'Upload Doc'}
                    </button>
                  </div>
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
