import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Tour } from '../lib/api';
import { api } from '../lib/api';
import { ImageUploader } from '../components/ImageUploader';
import { useAdminAuth } from '../lib/adminAuth';
import { DocxUploader } from '../components/DocxUploader';
import { SplitViewLayout } from '../components/layout/SplitViewLayout';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { Tabs, Tab } from '../components/ui/Tabs';

const emptyForm: Partial<Tour> = {
  name: '', region: '', days: 7, price: '', category: 'Signature Series', rating: 4.8,
  heroImageUrl: '', overviewDescription: '', overviewExtended: '', overviewImageUrl: '',
  transport: '', guide: '', pickup: '', maxGuests: 8,
  visualArchive: [], itinerary: [], sightseeing: [], departureWindows: [],
};

// ── Smart Word/Quotation Text Parser ──────────────────────────────────────────
function parseQuotationText(raw: string): Partial<Tour> {
  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\u00A0/g, ' ').trim() + '\n';
  const destMatch = text.match(/DESTINATION\s*[:\-]?\s*([^\n]+)/i);
  const name = destMatch ? destMatch[1].trim() : '';
  const region = name;
  const daysMatch = text.match(/(\d+)\s*Night[s]?\s*(\d+)\s*Day[s]?/i) || text.match(/(\d+)\s*Day[s]?/i);
  const days = daysMatch ? parseInt(daysMatch[2] || daysMatch[1]) : 7;
  const priceMatch = text.match(/USD[.\s]*(\d+[,\d]*)/i) || text.match(/Price\s*[:\-]?\s*([^\n]+)/i);
  const price = priceMatch ? (priceMatch[1].startsWith('$') ? priceMatch[1] : `$${priceMatch[1]}`) : '';
  const sightseeing: Tour['sightseeing'] = [];
  const seenLandmarks = new Set<string>();

  const dayMatches = [...text.matchAll(/(?:^|\n)Day\s*(\d+)\s*[:\-]?\s*([^\n]*)\n([^]*?)(?=(?:\nDay\s*\d+)|Above Package|Package Includes|Package Excludes|Logistics|$)/gi)];
  const itinerary = dayMatches.slice(0, 31).map(m => {
    const dayNum = m[1];
    const fullFirstLine = m[2].trim();
    const restOfContent = m[3].trim();
    
    let title = fullFirstLine;
    let descriptionPrefix = '';
    
    if (fullFirstLine.length > 60 || fullFirstLine.includes('.') || fullFirstLine.includes('  ')) {
      const splitPoint = fullFirstLine.match(/[:\-.]\s| {2,}/);
      if (splitPoint && splitPoint.index !== undefined) {
        title = fullFirstLine.substring(0, splitPoint.index).trim();
        descriptionPrefix = fullFirstLine.substring(splitPoint.index + splitPoint[0].length).trim() + '\n';
      } else if (fullFirstLine.length > 40) {
        title = fullFirstLine.substring(0, 40).trim() + '...';
        descriptionPrefix = fullFirstLine + '\n';
      }
    }

    const content = descriptionPrefix + restOfContent;
    const accMatch = content.match(/Accommodation\s*[:\-]\s*([^\n]*)/i);
    const schMatch = content.match(/Schedule\s*[:\-]\s*([^\n]*)/i);
    const accommodation = accMatch ? accMatch[1].trim() : '';
    const schedule = schMatch ? schMatch[1].trim() : '';

    const dayBullets = content.match(/(?:^|\n)\s*[•\-\d.]+\s*([^\n]+)\n([^]*?)(?=\n\s*[•\-\d.]+\s*|Day\s*\d+|Accommodation|Schedule|$)/gi) || [];
    dayBullets.forEach((b: string) => {
      const bMatch = b.match(/(?:^|\n)\s*[•\-\d.]+\s*([^\n]+)\n?([^]*)/i);
      if (bMatch) {
        const lName = bMatch[1].trim();
        const lDesc = bMatch[2].trim();
        if (lName.length > 3 && !seenLandmarks.has(lName.toLowerCase())) {
          seenLandmarks.add(lName.toLowerCase());
          sightseeing.push({ title: lName, description: lDesc || `A featured landmark in the ${lName} region.`, icon: /Beach/i.test(lName) ? 'beach_access' : /Jail|Museum|Heritage/i.test(lName) ? 'museum' : 'star', imageUrl: '' });
        }
      }
    });

    const cleanDesc = content.replace(/Accommodation\s*[:\-]\s*[^\n]*/gi, '').replace(/Schedule\s*[:\-]\s*[^\n]*/gi, '').trim();
    const mealsMatch = content.match(/\(([BLD,\s/-]+)\)/i);
    const meals = mealsMatch ? mealsMatch[1].replace(/B/g, 'Breakfast').replace(/L/g, 'Lunch').replace(/D/g, 'Dinner').replace(/[\/-]/g, ', ') : '';

    return { title: `Day ${dayNum}${title ? ': ' + title : ''}`, description: cleanDesc || content, meals, accommodation, schedule, imageUrl: '' };
  });

  const overviewMatch = text.match(/OVERVIEW\s*[:\-]?\s*([^]*?)(?=Day\s*\d+|Above Package|Package Includes|Logistics|$)/i);
  const overviewExtended = overviewMatch ? overviewMatch[1].trim() : '';

  const includesMatch = text.match(/Package Includes\s*[:\-]?\s*([^]*?)(?=Package Excludes|Cancellation|Logistics|$)/i);
  if (includesMatch) {
    const bullets = includesMatch[1].match(/(?:^|\n)\s*[•\-\d.]+\s*([^\n]+)/gm) || [];
    bullets.forEach((b: string) => {
      const t = b.replace(/^[\s•\-\d.]+/, '').trim();
      if (t.length > 3 && !seenLandmarks.has(t.toLowerCase())) {
        seenLandmarks.add(t.toLowerCase());
        sightseeing.push({ title: t, description: t, icon: 'verified', imageUrl: '' });
      }
    });
  }

  const transport = text.match(/Transport\s*[:\-]?\s*([^\n]+)/i)?.[1] || (/flight|private transfer|ferry/i.test(text) ? 'Private Transfers & Ferry' : '');
  const guide = text.match(/Guide\s*[:\-]?\s*([^\n]+)/i)?.[1] || '';
  const pickup = text.match(/Arrive in\s*([^\n]+)/i)?.[1] || (text.match(/Airport\s*Dropping/i) ? 'Airport Transfer' : '');

  return {
    name, region, days, price, category: 'Signature Expedition', rating: 4.8, transport, guide, pickup,
    overviewDescription: name ? `A curated ${days}-day journey through ${region}.` : '',
    overviewExtended: overviewExtended || `An expertly crafted itinerary covering the highlights, culture, and natural beauty of ${region}.`,
    itinerary: itinerary.length > 0 ? itinerary : [], sightseeing: sightseeing.slice(0, 12),
    visualArchive: [], departureWindows: [], maxGuests: 8, heroImageUrl: '',
  };
}

export default function AdminTours() {
  const { canCRUD } = useAdminAuth();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 20;

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Tour>>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tours', page, search],
    queryFn: () => api.listTours({ page, limit, search }),
    placeholderData: (prev) => prev,
  });

  const tours = (Array.isArray(data) ? data : data?.items) || [];
  const total = Array.isArray(data) ? data.length : (data?.total || 0);
  const pages = Array.isArray(data) ? 1 : (data?.pages || 1);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Tour>) => editingId ? api.updateTour(editingId, data) : api.createTour(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      setDrawerOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTour(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tours'] })
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (editId) {
      api.getTour(editId).then(t => {
        setFormData(t);
        setEditingId(t.id);
        setDrawerOpen(true);
      });
    }
  }, [location.search]);

  useEffect(() => {
    const state = location.state as { importText?: string };
    if (state?.importText) {
      setImportText(state.importText);
      setShowImport(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCreate = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setDrawerOpen(true);
  };

  const handleEdit = (t: Tour) => {
    setFormData(t);
    setEditingId(t.id);
    setDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this tour?')) {
      deleteMutation.mutate(id);
    }
  };

  const upd = (patch: Partial<Tour>) => setFormData(f => ({ ...f, ...patch }));
  const updItin = (i: number, patch: any) => {
    const u = [...(formData.itinerary || [])]; u[i] = { ...u[i], ...patch }; upd({ itinerary: u });
  };
  const updSight = (i: number, patch: any) => {
    const u = [...(formData.sightseeing || [])]; u[i] = { ...u[i], ...patch }; upd({ sightseeing: u });
  };
  const updWin = (i: number, patch: any) => {
    const u = [...(formData.departureWindows || [])]; u[i] = { ...u[i], ...patch }; upd({ departureWindows: u });
  };

  const columns: Column<Tour>[] = [
    {
      key: 'name',
      header: 'Tour Details',
      render: (t) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-surface-container-low overflow-hidden shrink-0">
            {t.heroImageUrl ? (
              <img src={t.heroImageUrl} alt={t.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <span className="material-symbols-outlined text-primary">flight</span>
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold text-on-surface">{t.name}</div>
            <div className="text-xs text-on-surface-variant flex items-center gap-2 mt-0.5">
              <span>{t.region}</span>
              <span>&bull;</span>
              <span className="font-medium text-primary">{t.days} Days</span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (t) => (
        <div className="flex flex-col gap-1">
          <span className="px-2.5 py-1 rounded-full bg-surface-container text-[10px] font-bold uppercase tracking-wider text-on-surface-variant w-fit">
            {t.category}
          </span>
          <div className="flex gap-2 text-[10px] text-on-surface-variant/60 ml-1">
             <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">route</span>{t.itinerary?.length || 0}</span>
             <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">place</span>{t.sightseeing?.length || 0}</span>
          </div>
        </div>
      )
    },
    {
      key: 'price',
      header: 'Price',
      render: (t) => (
        <div className="flex flex-col">
          <span className="font-bold text-on-surface">{t.price}</span>
          <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold">
            <span className="material-symbols-outlined text-[12px] fill-amber-600">star</span>
            {t.rating || 4.8}
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      header: '',
      render: (t) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {canCRUD && (
            <>
              <button onClick={() => handleEdit(t)} className="w-8 h-8 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors">
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
              <button onClick={() => handleDelete(t.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors">
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const actions = (
    <div className="flex items-center gap-2">
      <button onClick={() => setShowImport(true)} className="px-4 py-2 bg-surface-container border border-outline-variant/30 text-on-surface rounded-lg text-sm font-semibold hover:bg-surface-container-low transition-colors flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">content_paste</span> Import Doc
      </button>
      {canCRUD && (
        <button onClick={handleCreate} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span> New Tour
        </button>
      )}
    </div>
  );

  const tableContent = (
    <div className="h-full flex flex-col">
      <DataTable
        columns={columns}
        data={tours}
        isLoading={isLoading}
        onRowClick={(t) => handleEdit(t)}
        search={{ placeholder: "Search tours...", value: search, onChange: setSearch }}
      />
      {pages > 1 && (
        <div className="flex items-center justify-between p-4 bg-surface border-t border-outline-variant/30 mt-auto rounded-b-xl">
          <span className="text-sm text-on-surface-variant">Showing page {page} of {pages} ({total} total)</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border border-outline-variant/30 text-sm disabled:opacity-50 hover:bg-surface-container">Prev</button>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border border-outline-variant/30 text-sm disabled:opacity-50 hover:bg-surface-container">Next</button>
          </div>
        </div>
      )}
    </div>
  );

  const formSectionClasses = "space-y-4";
  const labelClasses = "block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5";
  const inputClasses = "w-full bg-surface-container-low text-on-surface border border-outline-variant/50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50";

  const drawerContent = (
    <form id="tour-form" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="h-full flex flex-col -m-6">
      <Tabs>
        <Tab label="General Info">
          <div className={formSectionClasses}>
            <div>
              <label className={labelClasses}>Tour Name *</label>
              <input required className={inputClasses} value={formData.name || ''} onChange={e => upd({ name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Region *</label>
                <input required className={inputClasses} value={formData.region || ''} onChange={e => upd({ region: e.target.value })} />
              </div>
              <div>
                <label className={labelClasses}>Category</label>
                <select className={inputClasses} value={formData.category || ''} onChange={e => upd({ category: e.target.value })}>
                  <option>Signature Series</option><option>Adventure Series</option><option>Cultural Heritage</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClasses}>Days *</label>
                <input type="number" required className={inputClasses} value={formData.days || 7} onChange={e => upd({ days: parseInt(e.target.value) })} />
              </div>
              <div>
                <label className={labelClasses}>Price *</label>
                <input required className={inputClasses} value={formData.price || ''} onChange={e => upd({ price: e.target.value })} />
              </div>
              <div>
                <label className={labelClasses}>Rating</label>
                <input type="number" step="0.1" max="5" min="0" className={inputClasses} value={formData.rating || 4.8} onChange={e => upd({ rating: parseFloat(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Overview (Short Summary)</label>
              <textarea rows={2} className={inputClasses} value={formData.overviewDescription || ''} onChange={e => upd({ overviewDescription: e.target.value })} placeholder="One or two sentences summarizing the tour." />
            </div>
            <div>
              <label className={labelClasses}>Extended Narrative (About the Tour)</label>
              <textarea rows={4} className={inputClasses} value={formData.overviewExtended || ''} onChange={e => upd({ overviewExtended: e.target.value })} />
            </div>
          </div>
        </Tab>
        <Tab label="Logistics">
          <div className={formSectionClasses}>
             <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClasses}>Transport Type</label><input className={inputClasses} value={formData.transport || ''} onChange={e => upd({ transport: e.target.value })} placeholder="e.g. Private SUV & SUV" /></div>
                <div><label className={labelClasses}>Guide Service</label><input className={inputClasses} value={formData.guide || ''} onChange={e => upd({ guide: e.target.value })} placeholder="e.g. Professional Naturalist" /></div>
                <div><label className={labelClasses}>Pickup / Transfers</label><input className={inputClasses} value={formData.pickup || ''} onChange={e => upd({ pickup: e.target.value })} placeholder="e.g. Airport Arrival" /></div>
                <div><label className={labelClasses}>Max Group Size</label><input type="number" className={inputClasses} value={formData.maxGuests || 8} onChange={e => upd({ maxGuests: parseInt(e.target.value) })} /></div>
             </div>

             <div className="pt-4 border-t border-outline-variant/30">
                <label className={labelClasses}>Availability / Departure Windows</label>
                <div className="space-y-3 mt-2">
                  {(formData.departureWindows || []).map((win, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-surface-container rounded-xl border border-outline-variant/20">
                      <input placeholder="Range (e.g. Jan-Mar)" className={inputClasses} value={win.range || ''} onChange={e => updWin(idx, { range: e.target.value })} />
                      <input placeholder="Label (e.g. High Season)" className={inputClasses} value={win.label || ''} onChange={e => updWin(idx, { label: e.target.value })} />
                      <button type="button" onClick={() => upd({ departureWindows: (formData.departureWindows || []).filter((_, i) => i !== idx) })} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><span className="material-symbols-outlined text-sm">delete</span></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => upd({ departureWindows: [...(formData.departureWindows || []), { range: '', label: '' }] })} className="w-full py-2 border border-dashed border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant hover:border-primary hover:text-primary transition-all">
                    + Add Departure Window
                  </button>
                </div>
             </div>
          </div>
        </Tab>
        <Tab label="Media">
          <div className={formSectionClasses}>
            <ImageUploader label="Hero Cover Image" value={formData.heroImageUrl || ''} onChange={(v: string) => upd({ heroImageUrl: v })} />
            <ImageUploader label="Overview Section Image (optional)" value={formData.overviewImageUrl || ''} onChange={(v: string) => upd({ overviewImageUrl: v })} />
            <ImageUploader label="Visual Archive (Gallery)" multiple value={formData.visualArchive || []} onChange={(v: string[]) => upd({ visualArchive: v })} />
          </div>
        </Tab>
        <Tab label="Itinerary">
          <div className={formSectionClasses}>
            {(formData.itinerary || []).map((day, i) => (
              <div key={i} className="p-4 bg-surface-container rounded-xl border border-outline-variant/30 relative space-y-3">
                <button type="button" onClick={() => upd({ itinerary: (formData.itinerary || []).filter((_, x) => x !== i) })} className="absolute top-3 right-3 text-red-500 hover:text-red-700"><span className="material-symbols-outlined text-sm">close</span></button>
                <h4 className="text-sm font-bold">Day {i + 1}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputClasses} placeholder="Title" value={day.title || ''} onChange={e => updItin(i, { title: e.target.value })} />
                  <input className={inputClasses} placeholder="Schedule" value={day.schedule || ''} onChange={e => updItin(i, { schedule: e.target.value })} />
                </div>
                <textarea className={inputClasses} rows={2} placeholder="Description" value={day.description || ''} onChange={e => updItin(i, { description: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputClasses} placeholder="Accommodation" value={day.accommodation || ''} onChange={e => updItin(i, { accommodation: e.target.value })} />
                  <input className={inputClasses} placeholder="Meals" value={day.meals || ''} onChange={e => updItin(i, { meals: e.target.value })} />
                </div>
                <div className="mt-2">
                  <ImageUploader 
                    label={`Day ${i + 1} Image`} 
                    value={day.imageUrl || ''} 
                    onChange={(v: string) => updItin(i, { imageUrl: v })} 
                  />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => upd({ itinerary: [...(formData.itinerary || []), { title: '', description: '', imageUrl: '', schedule: '', accommodation: '', meals: '' }] })} className="w-full py-2 bg-primary/10 text-primary rounded-lg font-bold text-sm hover:bg-primary/20">
              + Add Day
            </button>
          </div>
        </Tab>
        <Tab label="Sightseeing">
          <div className={formSectionClasses}>
            {(formData.sightseeing || []).map((site, i) => (
              <div key={i} className="p-4 bg-surface-container rounded-xl border border-outline-variant/30 relative space-y-3">
                <button type="button" onClick={() => upd({ sightseeing: (formData.sightseeing || []).filter((_, x) => x !== i) })} className="absolute top-3 right-3 text-red-500 hover:text-red-700"><span className="material-symbols-outlined text-sm">close</span></button>
                <h4 className="text-sm font-bold">Landmark {i + 1}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputClasses} placeholder="Title" value={site.title || ''} onChange={e => updSight(i, { title: e.target.value })} />
                  <input className={inputClasses} placeholder="Icon" value={site.icon || ''} onChange={e => updSight(i, { icon: e.target.value })} />
                </div>
                <textarea className={inputClasses} rows={2} placeholder="Description" value={site.description || ''} onChange={e => updSight(i, { description: e.target.value })} />
                <div className="mt-2">
                  <ImageUploader 
                    label="Landmark Image" 
                    value={site.imageUrl || ''} 
                    onChange={(v: string) => updSight(i, { imageUrl: v })} 
                  />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => upd({ sightseeing: [...(formData.sightseeing || []), { title: '', description: '', icon: 'star', imageUrl: '' }] })} className="w-full py-2 bg-amber-100 text-amber-700 rounded-lg font-bold text-sm hover:bg-amber-200">
              + Add Landmark
            </button>
          </div>
        </Tab>
      </Tabs>
    </form>
  );

  const drawerActions = (
    <div className="flex gap-2">
      <button form="tour-form" type="submit" disabled={saveMutation.isPending} className="px-4 py-1.5 bg-primary text-on-primary rounded-lg text-sm font-bold shadow-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">{saveMutation.isPending ? 'sync' : 'save'}</span> {saveMutation.isPending ? 'Saving...' : 'Save'}
      </button>
    </div>
  );

  return (
    <>
      <SplitViewLayout
        title="Tours"
        actions={actions}
        tableContent={tableContent}
        drawerContent={drawerContent}
        isDrawerOpen={isDrawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
        drawerTitle={editingId ? 'Edit Tour' : 'Create Tour'}
        drawerActions={drawerActions}
        drawerWidth="w-[700px] max-w-[95vw]"
      />

      {showImport && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-2xl rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-on-surface mb-2">Import Tour Data</h3>
            <p className="text-sm text-on-surface-variant mb-6">Upload a DOCX or paste raw itinerary text to automatically fill the tour builder fields.</p>
            <div className="mb-4">
              <DocxUploader onParsed={setImportText} label="Upload DOCX File" />
            </div>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} className={`${inputClasses} h-48 font-mono text-xs`} placeholder="Paste itinerary text..." />
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowImport(false)} className="px-4 py-2 font-semibold text-sm hover:bg-surface-container rounded-lg">Cancel</button>
              <button onClick={() => {
                const parsed = parseQuotationText(importText);
                setFormData(f => ({ ...f, ...parsed }));
                setShowImport(false);
                setImportText('');
                setDrawerOpen(true);
              }} className="px-4 py-2 bg-primary text-on-primary font-semibold text-sm rounded-lg hover:opacity-90">Auto-Fill Form</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
