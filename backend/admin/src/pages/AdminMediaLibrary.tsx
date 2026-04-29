import { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, uploadImage } from '../lib/api';
import type { Media } from '../lib/api';

const FOLDERS = ['All', 'Destinations', 'Tours', 'General'];

export default function AdminMediaLibrary() {
  const { canEdit } = useOutletContext<{ canEdit: boolean }>();
  const [activeFolder, setActiveFolder] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaFiles, setMediaFiles] = useState<Media[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      setIsLoading(true);
      const data = await api.listMedia();
      setMediaFiles(data);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const url = await uploadImage(file);
        return await api.createMedia({
          url,
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
          type: file.type,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          folder: activeFolder === 'All' ? 'General' : activeFolder
        });
      });
      
      const uploadedMedia = await Promise.all(uploadPromises);
      setMediaFiles(prev => [...uploadedMedia, ...prev]);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Some files may not have uploaded properly. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this media? This will remove it from the library (but not from tours/destinations using the URL).")) return;
    try {
      await api.deleteMedia(id);
      setMediaFiles(prev => prev.filter(m => m.id !== id));
      if (selected.has(id)) {
        const newSet = new Set(selected);
        newSet.delete(id);
        setSelected(newSet);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Delete failed.');
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selected.size} items?`)) return;
    try {
      await Promise.all(Array.from(selected).map(id => api.deleteMedia(id)));
      setMediaFiles(prev => prev.filter(m => !selected.has(m.id)));
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

  const handleCopyUrl = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    alert('URL copied to clipboard!');
  };

  const filteredMedia = mediaFiles.filter(m => 
    (activeFolder === 'All' || m.folder === activeFolder) &&
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-semibold text-on-surface tracking-tight">Media Library</h2>
          <p className="text-on-surface-variant text-sm mt-1">Manage, upload, and reuse assets across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input 
              type="text" 
              placeholder="Search files..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64 shadow-sm text-on-surface"
            />
          </div>
          {canEdit && (
            <>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
                multiple 
              />
              <button 
                onClick={handleUploadClick}
                disabled={isUploading}
                className="bg-on-surface text-surface px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase hover:opacity-90 transition flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">{isUploading ? 'hourglass_empty' : 'upload'}</span>
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Folders */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar flex-shrink-0">
        {FOLDERS.map(folder => (
          <button
            key={folder}
            onClick={() => setActiveFolder(folder)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-colors ${
              activeFolder === folder 
                ? 'bg-on-surface text-surface shadow-md' 
                : 'bg-surface border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            {folder}
          </button>
        ))}
        {canEdit && mediaFiles.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                setSelectMode(!selectMode);
                if (selectMode) setSelected(new Set());
              }}
              className={`px-3 py-1.5 flex items-center gap-1 rounded-full text-xs font-bold uppercase transition-colors ${selectMode ? 'bg-blue-100 text-blue-700' : 'bg-surface-container border border-outline-variant/30 text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-sm">checklist</span>
              {selectMode ? 'Cancel' : 'Select'}
            </button>
            {selectMode && selected.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 flex items-center gap-1 rounded-full text-xs font-bold uppercase bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Delete ({selected.size})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-6">
        {!canEdit && (
          <div className="mb-6 p-4 bg-surface-container-low border border-primary/20 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">info</span>
            <p className="text-xs text-on-surface-variant font-medium">You are in <span className="font-bold text-on-surface">Read-Only Mode</span>. Upload and deletion privileges are restricted to Editor accounts.</p>
          </div>
        )}
        
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-3 animate-spin">refresh</span>
            <p className="text-sm">Loading media...</p>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-3 opacity-20">image_not_supported</span>
            <p className="text-sm">No media files found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredMedia.map(media => (
              <div key={media.id} className="group relative rounded-xl overflow-hidden border border-outline-variant/20 bg-surface-container-low cursor-pointer aspect-square flex flex-col hover:shadow-md transition-all">
                <div className="flex-1 overflow-hidden bg-surface-container">
                  <img src={media.url} alt={media.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-2 border-t border-outline-variant/10">
                  <p className="text-[10px] font-medium truncate text-on-surface">{media.name}</p>
                  <p className="text-[9px] text-on-surface-variant flex justify-between mt-0.5">
                    <span>{media.size}</span>
                    <span>{media.folder}</span>
                  </p>
                </div>
                {/* Selection Overlay */}
                {selectMode && (
                  <div className="absolute top-2 left-2 z-10" onClick={(e) => { e.stopPropagation(); toggleSelect(media.id); }}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${selected.has(media.id) ? 'bg-primary border-primary text-on-primary' : 'bg-surface/90 backdrop-blur border-outline-variant/50 hover:border-on-surface'}`}>
                      {selected.has(media.id) && <span className="material-symbols-outlined text-xs">check</span>}
                    </div>
                  </div>
                )}
                {/* Actions Overlay */}
                {canEdit && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleCopyUrl(e, media.url)}
                      className="w-7 h-7 bg-surface/90 backdrop-blur rounded-lg flex items-center justify-center text-on-surface hover:bg-on-surface hover:text-surface transition-colors shadow-sm" title="Copy URL"
                    >
                      <span className="material-symbols-outlined text-xs">link</span>
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, media.id)}
                      className="w-7 h-7 bg-red-500/90 backdrop-blur rounded-lg flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-sm" title="Delete"
                    >
                      <span className="material-symbols-outlined text-xs">delete</span>
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
