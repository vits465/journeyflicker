import React, { useState } from 'react';
import { uploadImage } from '../lib/api';

interface ImageUploaderProps {
  multiple?: boolean;
  value: string | string[];
  onChange: (val: any) => void;
  label?: string;
}

export function ImageUploader({ multiple, value, onChange, label = 'Upload Images' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    
    try {
      if (multiple) {
        const urls = await Promise.all(Array.from(e.target.files).map(f => uploadImage(f)));
        onChange([...(Array.isArray(value) ? value : []), ...urls]);
      } else {
        const url = await uploadImage(e.target.files[0]);
        onChange(url);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed. Ensure the server is running and file size is reasonable.');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input so same file can be uploaded again if removed
    }
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
    <div className="space-y-4">
      <label className="block text-sm font-medium text-on-surface">{label}</label>
      <div className="flex flex-wrap gap-4 items-center">
        {images.map((url, i) => (
          <div key={i} className="relative w-24 h-24 rounded border border-outline-variant overflow-hidden group shadow-sm bg-surface-container-lowest flex-shrink-0">
            <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
            <button 
              type="button" 
              onClick={() => removeImage(url)}
              className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <span className="material-symbols-outlined text-xl">delete</span>
            </button>
          </div>
        ))}
        {(!images.length || multiple) && (
          <label className={`w-24 h-24 rounded border border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer hover:border-black hover:text-black transition-colors text-on-surface-variant flex-shrink-0 bg-surface-container-low ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <span className="material-symbols-outlined mb-1 text-2xl">{uploading ? 'hourglass_empty' : 'add_photo_alternate'}</span>
            <span className="text-[10px] font-medium tracking-widest uppercase">{uploading ? 'Wait...' : 'Upload'}</span>
            <input type="file" className="hidden" multiple={multiple} accept="image/*" onChange={handleUpload} />
          </label>
        )}
      </div>
      {(images.length === 0 && !multiple) && (
         <div className="text-xs text-on-surface-variant italic">No image uploaded.</div>
      )}
    </div>
  );
}
