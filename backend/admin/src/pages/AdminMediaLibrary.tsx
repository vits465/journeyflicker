import { useState, useRef, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, type Media } from '../lib/api';

const FOLDERS = ['All', 'Destinations', 'Tours', 'Visas', 'General', 'Cloudinary'];
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Added' },
  { value: 'name',      label: 'Name' },
  { value: 'sizeBytes', label: 'Size' },
];

function copyToClipboard(text: string, setCopied: (v: string) => void) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(text);
    setTimeout(() => setCopied(''), 2000);
  });
}

export default function AdminMediaLibrary() {
  const { canEdit } = useOutletContext<{ canEdit: boolean }>();
  const [media, setMedia]           = useState<Media[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  
  // Navigation & Filtering
  const [activeTab, setActiveTab]   = useState<'All' | 'Unused'>('All');
  const [folder, setFolder]         = useState('All');
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy]         = useState('createdAt');
  const [sortDir, setSortDir]       = useState<'asc'|'desc'>('desc');
  const [viewMode, setViewMode]     = useState<'grid'|'list'>('grid');
  
  // Selection
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [moveFolder, setMoveFolder] = useState('');
  
  // Modals / Feedback
  const [toast, setToast]           = useState<string>('');
  const [dupeWarnings, setDupeWarnings] = useState<{ name: string; existingName: string }[]>([]);
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null);
  const [copied, setCopied]         = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadMedia = useCallback(async (resetPage = false) => {
    try {
      if (resetPage) setPage(1);
      setLoading(true);
      const p = resetPage ? 1 : page;
      
      if (activeTab === 'Unused') {
        const res = await api.detectUnusedMedia();
        let filtered = res.items;
        if (folder !== 'All') filtered = filtered.filter(m => m.folder === folder);
        if (debouncedSearch) filtered = filtered.filter(m => m.name.toLowerCase().includes(debouncedSearch.toLowerCase()));
        setMedia(filtered);
        setTotal(filtered.length);
        setPages(1);
      } else {
        const res = await api.listMedia({ folder, search: debouncedSearch, sortBy, sortDir, page: p, limit: 48 });
        setMedia(res.items);
        setTotal(res.total);
        setPages(res.pages);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load media');
    } finally { setLoading(false); }
  }, [folder, debouncedSearch, sortBy, sortDir, page, activeTab]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => { loadMedia(true); setSelected(new Set()); }, [folder, debouncedSearch, sortBy, sortDir, activeTab]);
  useEffect(() => { loadMedia(); }, [page]);

  const handleUploadFiles = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    setUploadProgress({ done: 0, total: files.length });
    const dupWarns: typeof dupeWarnings = [];
    try {
      const result = await api.uploadMediaFiles(files, folder === 'All' ? 'General' : folder);
      result.uploaded.forEach(u => {
        if (u.duplicateWarning) dupWarns.push({ name: u.name, existingName: u.duplicateWarning.existingName });
      });
      setUploadProgress({ done: result.summary.succeeded, total: result.summary.total });
      showToast(result.summary.failed > 0 ? `⚠ ${result.summary.succeeded}/${result.summary.total} uploaded. ${result.summary.failed} failed.` : `✓ ${result.summary.succeeded} file(s) uploaded successfully!`);
      if (dupWarns.length) setDupeWarnings(dupWarns);
      await loadMedia(true);
    } catch { showToast('Upload failed'); } finally {
      setUploading(false); setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAll = async () => {
    if (!media.length) return;
    if (!confirm(`Are you sure you want to permanently delete ALL ${media.length} file(s) in this view? This cannot be undone.`)) return;
    try {
      await api.bulkDeleteMedia(media.map(m => m.id));
      showToast(`Permanently deleted ${media.length} files`);
      setSelected(new Set());
      loadMedia(true);
    } catch { showToast('Delete failed'); }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (!canEdit) return;
    handleUploadFiles(Array.from(e.dataTransfer.files));
  };

  const handleBulkAction = async (action: 'delete' | 'move') => {
    if (!selected.size) return;
    try {
      if (action === 'delete') {
        if (!confirm(`Are you sure you want to permanently delete ${selected.size} file(s)? This cannot be undone.`)) return;
        await api.bulkDeleteMedia(Array.from(selected));
        showToast(`Permanently deleted ${selected.size} files`);
      } else if (action === 'move') {
        if (!moveFolder) return;
        await api.bulkMoveMedia(Array.from(selected), moveFolder);
        showToast(`Moved ${selected.size} files to ${moveFolder}`);
        setMoveFolder('');
      }
      setSelected(new Set());
      loadMedia(true);
    } catch { showToast('Action failed'); }
  };

  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const toggleSelectAll = () => {
    if (selected.size === media.length) setSelected(new Set());
    else setSelected(new Set(media.map(m => m.id)));
  };

  return (
    <div className="h-[calc(100vh-6rem)] -m-4 flex bg-surface-container-lowest text-on-surface font-sans" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {/* Global Drag Overlay */}
      {isDragging && canEdit && (
        <div className="absolute inset-0 z-[500] bg-primary/20 backdrop-blur-sm border-4 border-dashed border-primary m-4 rounded-3xl flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-8xl text-primary animate-bounce">cloud_upload</span>
          <h2 className="text-4xl font-black text-primary mt-4 tracking-tight shadow-sm">Drop files to upload</h2>
          <p className="text-primary/80 font-medium mt-2">Files will be added to {folder === 'All' ? 'General' : folder}</p>
        </div>
      )}

      {toast && (
        <div className="fixed top-5 right-5 z-[300] px-6 py-3 rounded-2xl shadow-2xl text-sm font-bold text-white bg-gray-900 border border-white/10 flex items-center gap-2 animate-in slide-in-from-top-5">
          <span className="material-symbols-outlined text-base text-primary">info</span> {toast}
        </div>
      )}

      {/* Sidebar Layout */}
      <aside className="w-64 border-r border-outline-variant/20 bg-surface/50 backdrop-blur-xl hidden md:flex flex-col h-full flex-shrink-0">
        <div className="p-6">
          <h2 className="text-2xl font-black tracking-tight bg-gradient-to-br from-primary to-indigo-500 bg-clip-text text-transparent">Digital Asset Studio</h2>
        </div>
        <nav className="flex-1 px-4 space-y-8 overflow-y-auto pb-6">
          <div>
            <div className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-widest mb-3 px-2">Library</div>
            <div className="space-y-1">
              {[
                { id: 'All', icon: 'auto_awesome_mosaic', label: 'All Media' },
                { id: 'Unused', icon: 'find_in_page', label: 'Unused Assets' },
              ].map(t => (
                <button key={t.id} onClick={() => { setActiveTab(t.id as any); setFolder('All'); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === t.id ? 'bg-primary text-on-primary shadow-md shadow-primary/20' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
                  <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <div className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-widest mb-3 px-2">Folders</div>
            <div className="space-y-1">
              {FOLDERS.filter(f => f !== 'All').map(f => (
                <button key={f} onClick={() => { setActiveTab('All'); setFolder(f); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${folder === f && activeTab === 'All' ? 'bg-surface-container-high text-on-surface font-bold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
                  <span className="material-symbols-outlined text-[18px] opacity-70">folder</span>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </nav>
        
        {/* Upload Button in Sidebar */}
        {canEdit && (
          <div className="p-4 border-t border-outline-variant/20">
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" multiple onChange={e => handleUploadFiles(Array.from(e.target.files || []))} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold tracking-wide hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">{uploading ? 'hourglass_empty' : 'upload'}</span>
              {uploading ? 'Uploading...' : 'Upload Files'}
            </button>
            <button onClick={async () => {
                showToast('Syncing Cloudinary...');
                try { const res = await api.syncCloudinary(); showToast(`Synced ${res.count} items.`); loadMedia(true); } 
                catch { showToast('Sync failed'); }
              }} className="w-full flex items-center justify-center gap-2 py-2 mt-2 rounded-xl border border-outline-variant/30 text-on-surface-variant text-xs font-semibold hover:bg-surface-container transition-all">
              <span className="material-symbols-outlined text-[14px]">cloud_sync</span> Sync Cloudinary
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header Bar */}
        <header className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between bg-surface/30 backdrop-blur-md z-10">
          <div className="flex items-center gap-4 flex-1">
             <div className="relative group flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors">search</span>
                <input type="text" placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-on-surface transition-all placeholder:text-on-surface-variant/40" />
             </div>
          </div>

          <div className="flex items-center gap-3 ml-4">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="py-2.5 px-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              className="w-10 h-10 flex items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface-container-low hover:bg-surface-container-high transition-colors text-on-surface">
              <span className="material-symbols-outlined text-lg">{sortDir === 'desc' ? 'sort' : 'sort_by_alpha'}</span>
            </button>
            <div className="flex rounded-2xl border border-outline-variant/20 bg-surface-container-low p-1">
              {(['grid', 'list'] as const).map(v => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${viewMode === v ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
                  <span className="material-symbols-outlined text-[18px]">{v === 'grid' ? 'grid_view' : 'view_list'}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Upload Progress Bar */}
        {uploadProgress && (
          <div className="absolute top-[73px] left-0 right-0 z-20 h-1 bg-surface-container-low">
            <div className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-300 ease-out" style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }} />
          </div>
        )}

        {/* Status / Title Bar */}
        <div className="px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            {activeTab === 'All' ? folder : activeTab}
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-xs font-black text-on-surface-variant">{total}</span>
          </h3>
          
          <div className="flex items-center gap-4">
            {media.length > 0 && (
              <button onClick={handleDeleteAll} className="text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full">
                <span className="material-symbols-outlined text-[16px]">delete_forever</span> Delete All
              </button>
            )}
            <button onClick={toggleSelectAll} className="text-xs font-bold uppercase tracking-wider text-primary hover:text-indigo-600 transition-colors">
              {selected.size === media.length && media.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        {/* Media Grid / List */}
        <div className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar">
          {loading ? (
             viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-2xl bg-surface-container-high/50 animate-pulse border border-outline-variant/10" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl bg-surface-container-high/50 animate-pulse border border-outline-variant/10" />
                ))}
              </div>
            )
          ) : media.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center mb-6 border-8 border-surface-container-low">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">photo_library</span>
              </div>
              <h3 className="text-xl font-black text-on-surface mb-2">Nothing here yet</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Upload assets to fill up your library and use them across your platform.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {media.map(m => (
                <div key={m.id} className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 ${selected.has(m.id) ? 'ring-4 ring-primary/50' : 'border border-outline-variant/20'}`} onClick={() => toggleSelect(m.id)}>
                  {m.type?.startsWith('image/') ? (
                    <img src={m.url} alt={m.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full bg-surface-container-low flex flex-col items-center justify-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-50">{m.type?.includes('pdf') ? 'picture_as_pdf' : 'description'}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">{m.type?.split('/')[1] || 'FILE'}</span>
                    </div>
                  )}
                  
                  {/* Scrim Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent transition-opacity duration-300 ${selected.has(m.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                  
                  {/* Checkbox */}
                  <div className={`absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${selected.has(m.id) ? 'bg-primary border-primary text-white scale-100' : 'bg-black/20 border-white/40 text-transparent scale-0 group-hover:scale-100 backdrop-blur-md'}`}>
                    <span className="material-symbols-outlined text-[14px] font-black">check</span>
                  </div>

                  {/* Actions Top Right */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                    <button onClick={(e) => { e.stopPropagation(); setPreviewMedia(m); }} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/40 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); copyToClipboard(m.url, setCopied); }} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/40 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">{copied === m.url ? 'check' : 'link'}</span>
                    </button>
                  </div>

                  {/* Bottom Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white text-xs font-bold truncate drop-shadow-md">{m.name}</p>
                    <p className="text-white/70 text-[10px] font-medium mt-0.5">{m.size} • {m.folder}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {media.map(m => (
                <div key={m.id} className={`group flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all duration-200 border ${selected.has(m.id) ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-surface border-outline-variant/10 hover:border-outline-variant/30 hover:shadow-md'}`} onClick={() => toggleSelect(m.id)}>
                  <div className={`w-6 h-6 rounded-full flex flex-shrink-0 items-center justify-center border-2 transition-colors ${selected.has(m.id) ? 'bg-primary border-primary text-white' : 'border-outline-variant/40 text-transparent group-hover:border-primary/50'}`}>
                    <span className="material-symbols-outlined text-[14px] font-black">check</span>
                  </div>
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container flex-shrink-0">
                    {m.type?.startsWith('image/') ? (
                      <img src={m.url} alt={m.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant"><span className="material-symbols-outlined text-xl">description</span></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{m.name}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 font-medium">{m.size} • {m.folder} • {m.date}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                    <button onClick={(e) => { e.stopPropagation(); setPreviewMedia(m); }} className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-highest text-on-surface flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); copyToClipboard(m.url, setCopied); }} className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-highest text-on-surface flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-[16px]">{copied === m.url ? 'check' : 'link'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-outline-variant/10">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-10 h-10 flex items-center justify-center rounded-full border border-outline-variant/30 text-on-surface disabled:opacity-30 hover:bg-surface-container-low transition-colors"><span className="material-symbols-outlined">chevron_left</span></button>
              <span className="text-sm font-bold text-on-surface-variant bg-surface-container-low px-4 py-1.5 rounded-full">Page {page} of {pages}</span>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="w-10 h-10 flex items-center justify-center rounded-full border border-outline-variant/30 text-on-surface disabled:opacity-30 hover:bg-surface-container-low transition-colors"><span className="material-symbols-outlined">chevron_right</span></button>
            </div>
          )}
        </div>

        {/* Floating Action Bar */}
        <div className={`fixed bottom-8 left-1/2 md:ml-32 -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${selected.size > 0 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95 pointer-events-none'}`}>
          <div className="bg-gray-900/95 backdrop-blur-xl p-2 pr-4 rounded-full shadow-2xl flex items-center gap-4 border border-white/10 ring-1 ring-black/5">
            <div className="bg-primary/20 text-primary-light px-4 py-2 rounded-full text-sm font-black tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {selected.size} SELECTED
            </div>
            
            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <select value={moveFolder} onChange={e => { setMoveFolder(e.target.value); if(e.target.value) setTimeout(() => handleBulkAction('move'), 0); }} className="px-4 py-2 rounded-full text-sm font-bold text-white bg-white/10 hover:bg-white/20 transition-colors focus:outline-none appearance-none cursor-pointer">
                <option value="" className="text-black">Move to...</option>
                {FOLDERS.filter(f => f !== 'All').map(f => <option key={f} value={f} className="text-black">{f}</option>)}
              </select>
              <button onClick={() => handleBulkAction('delete')} className="px-4 py-2 rounded-full text-sm font-bold text-white bg-red-500/80 hover:bg-red-500 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">delete_forever</span> Delete
              </button>
            </div>
            
            <button onClick={() => setSelected(new Set())} className="ml-2 w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>
      </main>

      {/* Lightbox Preview */}
      {previewMedia && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/90 backdrop-blur-lg p-4" onClick={() => setPreviewMedia(null)}>
          <div className="relative max-w-6xl w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
            <button className="absolute top-4 right-4 text-white/50 hover:text-white p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all" onClick={() => setPreviewMedia(null)}>
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
            {previewMedia.type?.startsWith('image/') ? (
              <img src={previewMedia.url} alt={previewMedia.name} className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl drop-shadow-2xl" onClick={e => e.stopPropagation()} />
            ) : (
              <div className="w-80 h-80 bg-surface/10 border border-white/10 rounded-3xl flex flex-col items-center justify-center shadow-2xl" onClick={e => e.stopPropagation()}>
                 <span className="material-symbols-outlined text-8xl text-white/50 mb-6">description</span>
                 <p className="text-white font-bold text-lg px-6 text-center truncate w-full">{previewMedia.name}</p>
                 <button onClick={() => window.open(previewMedia.url, '_blank')} className="mt-6 px-6 py-2.5 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors">Open File</button>
              </div>
            )}
            <div className="absolute bottom-8 bg-gray-900/90 text-white px-6 py-3 rounded-full text-sm font-bold flex items-center gap-4 shadow-2xl border border-white/10 backdrop-blur-md" onClick={e => e.stopPropagation()}>
              <span className="truncate max-w-[200px] sm:max-w-md">{previewMedia.name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              <span className="text-white/70">{previewMedia.size}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              <span className="text-white/70">{previewMedia.folder}</span>
              <button onClick={() => copyToClipboard(previewMedia.url, setCopied)} className="ml-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center text-primary-light">
                <span className="material-symbols-outlined text-[16px]">{copied === previewMedia.url ? 'check' : 'content_copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
