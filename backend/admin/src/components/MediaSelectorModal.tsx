import React, { useState, useEffect, useRef } from 'react';
import { api, type Media } from '../lib/api';

interface MediaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export function MediaSelectorModal({ isOpen, onClose, onSelect }: MediaSelectorModalProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('All');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const folders = ['All', 'Destinations', 'Tours', 'Visas', 'General', 'Cloudinary'];

  const loadMedia = async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const res = await api.listMedia({
        folder: folder === 'All' ? undefined : folder,
        search: search || undefined,
        page,
        limit: 18,
        sortBy: 'createdAt',
        sortDir: 'desc'
      });
      setMedia(res.items);
      setPages(res.pages);
    } catch (err) {
      console.error('Failed to load media in modal', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen, folder, page]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isOpen) {
        setPage(1);
        loadMedia();
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const activeFolder = folder === 'All' ? 'General' : folder;
      const res = await api.uploadMediaFiles(files, activeFolder);
      if (res.uploaded && res.uploaded.length > 0) {
        // Automatically select the newly uploaded file URL
        onSelect(res.uploaded[0].url);
      } else {
        alert('Upload failed or file was ignored.');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="bg-surface border border-outline-variant/30 w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-on-surface">
        {/* Header */}
        <div className="p-5 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container/50">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl font-bold">photo_library</span>
            <h2 className="text-lg font-black uppercase tracking-wider">Select Asset from Studio</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-outline-variant/10 flex flex-col sm:flex-row gap-3 bg-surface">
          <input 
            type="text" 
            placeholder="Search assets..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary bg-surface-container-low text-on-surface transition-colors"
          />
          <select 
            value={folder} 
            onChange={e => { setFolder(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary bg-surface-container-low text-on-surface transition-colors"
          >
            {folders.map(f => <option key={f} value={f}>{f} folder</option>)}
          </select>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            className="hidden" 
            accept="image/*" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary-hover shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
          >
            <span className="material-symbols-outlined text-sm font-bold">cloud_upload</span>
            {uploading ? 'Uploading...' : 'Upload & Use'}
          </button>
        </div>

        {/* Media Grid */}
        <div className="flex-1 p-6 overflow-y-auto bg-surface-container-lowest custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center flex-col gap-3 opacity-55">
              <span className="material-symbols-outlined text-4xl animate-spin text-primary">sync</span>
              <p className="text-sm font-bold">Scanning Asset Vault...</p>
            </div>
          ) : media.length === 0 ? (
            <div className="h-full flex items-center justify-center flex-col gap-2 opacity-50">
              <span className="material-symbols-outlined text-5xl">folder_open</span>
              <p className="text-sm font-bold">No assets found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {media.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => onSelect(m.url)}
                  className="group relative cursor-pointer border border-outline-variant/10 hover:border-primary/50 bg-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="aspect-[4/3] bg-surface-container-low flex items-center justify-center overflow-hidden border-b border-outline-variant/5">
                    <img 
                      src={m.url} 
                      alt={m.name} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] font-bold truncate text-on-surface-variant group-hover:text-primary transition-colors">{m.name}</p>
                    <p className="text-[8px] opacity-60 mt-0.5">{m.folder}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        {pages > 1 && (
          <div className="p-4 border-t border-outline-variant/10 bg-surface flex items-center justify-center gap-4">
            <button 
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-outline-variant/20 hover:bg-surface-container rounded-xl text-xs font-bold disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="text-xs font-black">Page {page} of {pages}</span>
            <button 
              disabled={page >= pages}
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              className="px-3 py-1.5 border border-outline-variant/20 hover:bg-surface-container rounded-xl text-xs font-bold disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
