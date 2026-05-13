import React, { useState, useEffect } from 'react';
import { uploadImage, api } from '../lib/api';
import type { Media } from '../lib/api';

interface ImageUploaderProps {
  multiple?: boolean;
  value: string | string[];
  onChange: (val: any) => void;
  label?: string;
}

// ── Media Library Picker Modal ────────────────────────────────────────────────
function MediaPickerModal({
  multiple,
  onSelect,
  onClose,
}: {
  multiple?: boolean;
  onSelect: (urls: string[]) => void;
  onClose: () => void;
}) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.listMedia()
      .then(res => setMedia(res.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = media.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (url: string) => {
    if (!multiple) {
      onSelect([url]);
      return;
    }
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const confirm = () => {
    onSelect(Array.from(selected));
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-surface dark:bg-surface-container rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-outline-variant/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-on-surface">Media Library</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {multiple ? 'Click images to select, then confirm' : 'Click an image to use it'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface-container-low text-on-surface w-44"
              />
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <span className="material-symbols-outlined text-3xl animate-spin mb-2">refresh</span>
              <p className="text-sm">Loading library...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-30">image_not_supported</span>
              <p className="text-sm font-medium">No images in the library yet.</p>
              <p className="text-xs mt-1">Go to Media Library and upload some images first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {filtered.map(m => {
                const isSelected = selected.has(m.url);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggle(m.url)}
                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      isSelected ? 'border-primary scale-95 shadow-lg' : 'border-transparent hover:border-outline-variant'
                    }`}
                  >
                    <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-2xl">check_circle</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                      <p className="text-[9px] text-white truncate font-medium">{m.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer for multi-select */}
        {multiple && selected.size > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-outline-variant/10 bg-surface-container flex-shrink-0">
            <span className="text-sm text-on-surface-variant font-medium">{selected.size} image{selected.size > 1 ? 's' : ''} selected</span>
            <button
              onClick={confirm}
              className="bg-primary text-on-primary px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase hover:opacity-90 transition"
            >
              Add to Form
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Single Image Thumbnail (handles broken URLs gracefully) ───────────────────
function ImageThumb({ url, onRemove }: { url: string; onRemove: () => void }) {
  const [broken, setBroken] = useState(false);

  return (
    <div className={`relative w-24 h-24 rounded-xl border overflow-hidden group shadow-sm flex-shrink-0 ${
      broken ? 'border-red-300 bg-red-50' : 'border-outline-variant bg-surface-container-lowest'
    }`}>
      {broken ? (
        // Broken image — show clear error state with always-visible delete
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-1">
          <span className="material-symbols-outlined text-red-400 text-2xl">broken_image</span>
          <p className="text-[8px] text-red-500 text-center font-medium leading-tight">Broken URL</p>
        </div>
      ) : (
        <img
          src={url}
          alt="Uploaded"
          className="w-full h-full object-cover"
          onError={() => setBroken(true)}
        />
      )}
      {/* Delete button — always visible on broken images, hover-only on valid images */}
      <button
        type="button"
        onClick={onRemove}
        title="Remove image"
        className={`absolute flex items-center justify-center text-white bg-red-600/90 transition-opacity ${
          broken
            ? 'inset-x-0 bottom-0 h-7 opacity-100' // always visible strip at bottom for broken
            : 'inset-0 opacity-0 group-hover:opacity-100' // full overlay on hover for valid
        }`}
      >
        <span className="material-symbols-outlined text-lg">delete</span>
      </button>
    </div>
  );
}

// ── Main ImageUploader Component ──────────────────────────────────────────────
export function ImageUploader({ multiple, value, onChange, label = 'Upload Images' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
      const files = Array.from(e.target.files);
      
      // Upload each file AND register in Media Library
      const uploadOne = async (file: File): Promise<string> => {
        const url = await uploadImage(file);
        // Auto-save to Media Library so it can be reused across forms
        try {
          await api.createMedia({
            url,
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
            type: file.type,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            folder: 'General',
          });
        } catch {
          // Don't fail the upload if media library save fails
          console.warn('Could not register image in Media Library, but upload succeeded.');
        }
        return url;
      };

      if (multiple) {
        const urls = await Promise.all(files.map(uploadOne));
        onChange([...(Array.isArray(value) ? value : []), ...urls]);
      } else {
        const url = await uploadOne(files[0]);
        onChange(url);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed. Ensure the server is running and file size is reasonable.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handlePickFromLibrary = (urls: string[]) => {
    if (multiple) {
      const existing = Array.isArray(value) ? value : [];
      const merged = [...existing, ...urls.filter(u => !existing.includes(u))];
      onChange(merged);
    } else {
      onChange(urls[0] || '');
    }
    setShowPicker(false);
  };

  const removeImage = (urlToRemove: string) => {
    if (multiple && Array.isArray(value)) {
      onChange(value.filter(url => url !== urlToRemove));
    } else {
      onChange('');
    }
  };

  const images = multiple
    ? (Array.isArray(value) ? value : [])
    : (value && typeof value === 'string' ? [value] : []);

  return (
    <>
      {showPicker && (
        <MediaPickerModal
          multiple={multiple}
          onSelect={handlePickFromLibrary}
          onClose={() => setShowPicker(false)}
        />
      )}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-on-surface">{label}</label>

        <div className="flex flex-wrap gap-3 items-start">
          {/* Thumbnails */}
          {images.map((url, i) => (
            <ImageThumb key={i} url={url} onRemove={() => removeImage(url)} />
          ))}

          {/* Action buttons — always visible so user can replace or add */}
          {(!images.length || multiple) && (
            <div className="flex flex-col gap-2">
              <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-outline-variant cursor-pointer hover:border-black hover:text-black transition-colors text-on-surface-variant bg-surface-container-low text-xs font-medium ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <span className="material-symbols-outlined text-base">{uploading ? 'hourglass_empty' : 'upload'}</span>
                {uploading ? 'Uploading...' : 'Upload New'}
                <input type="file" className="hidden" multiple={multiple} accept="image/*" onChange={handleUpload} />
              </label>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-outline-variant/60 cursor-pointer hover:border-primary hover:text-primary transition-colors text-on-surface-variant bg-surface text-xs font-medium"
              >
                <span className="material-symbols-outlined text-base">photo_library</span>
                Pick from Library
              </button>
            </div>
          )}

          {/* For single-image fields that already have an image: show replace/change buttons too */}
          {images.length > 0 && !multiple && (
            <div className="flex flex-col gap-2">
              <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-outline-variant cursor-pointer hover:border-black hover:text-black transition-colors text-on-surface-variant bg-surface-container-low text-xs font-medium ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <span className="material-symbols-outlined text-base">{uploading ? 'hourglass_empty' : 'swap_horiz'}</span>
                {uploading ? 'Uploading...' : 'Replace'}
                <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
              </label>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-outline-variant/60 cursor-pointer hover:border-primary hover:text-primary transition-colors text-on-surface-variant bg-surface text-xs font-medium"
              >
                <span className="material-symbols-outlined text-base">photo_library</span>
                Pick from Library
              </button>
            </div>
          )}
        </div>

        {images.length === 0 && !multiple && (
          <div className="text-xs text-on-surface-variant italic">No image selected.</div>
        )}
      </div>
    </>
  );
}

