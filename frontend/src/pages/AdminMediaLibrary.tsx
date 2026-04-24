import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

const DUMMY_MEDIA = [
  { id: '1', url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80', name: 'paris-eiffel.jpg', size: '2.4 MB', type: 'image/jpeg', date: 'Oct 12, 2026', folder: 'Destinations' },
  { id: '2', url: 'https://images.unsplash.com/photo-1525874684015-58379d421a52?auto=format&fit=crop&q=80', name: 'bali-resort.jpg', size: '3.1 MB', type: 'image/jpeg', date: 'Oct 10, 2026', folder: 'Tours' },
  { id: '3', url: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&q=80', name: 'venice-canal.jpg', size: '1.8 MB', type: 'image/jpeg', date: 'Oct 08, 2026', folder: 'Destinations' },
  { id: '4', url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&q=80', name: 'swiss-alps.jpg', size: '4.2 MB', type: 'image/jpeg', date: 'Sep 29, 2026', folder: 'Tours' },
  { id: '5', url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&q=80', name: 'bali-temple.jpg', size: '2.9 MB', type: 'image/jpeg', date: 'Sep 25, 2026', folder: 'Destinations' },
  { id: '6', url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80', name: 'hero-bg-main.jpg', size: '5.5 MB', type: 'image/jpeg', date: 'Sep 15, 2026', folder: 'General' },
];

const FOLDERS = ['All', 'Destinations', 'Tours', 'General'];

export default function AdminMediaLibrary() {
  const { canEdit } = useOutletContext<{ canEdit: boolean }>();
  const [activeFolder, setActiveFolder] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMedia = DUMMY_MEDIA.filter(m => 
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
              className="pl-9 pr-4 py-2 bg-white border border-outline-variant/30 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black w-64 shadow-sm"
            />
          </div>
          {canEdit && (
            <button className="bg-black text-white px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition flex items-center gap-2 shadow-md">
              <span className="material-symbols-outlined text-sm">upload</span>
              Upload
            </button>
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
                ? 'bg-black text-white shadow-md' 
                : 'bg-white border border-outline-variant/30 text-on-surface hover:bg-surface-container-low'
            }`}
          >
            {folder}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white rounded-2xl border border-outline-variant/30 shadow-sm p-6">
        {filteredMedia.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-3 opacity-20">image_not_supported</span>
            <p className="text-sm">No media files found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredMedia.map(media => (
              <div key={media.id} className="group relative rounded-xl overflow-hidden border border-outline-variant/20 bg-surface-container-lowest cursor-pointer aspect-square flex flex-col hover:shadow-md transition-shadow">
                <div className="flex-1 overflow-hidden bg-gray-100">
                  <img src={media.url} alt={media.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-2 border-t border-outline-variant/10">
                  <p className="text-[10px] font-medium truncate text-on-surface">{media.name}</p>
                  <p className="text-[9px] text-on-surface-variant flex justify-between mt-0.5">
                    <span>{media.size}</span>
                    <span>{media.folder}</span>
                  </p>
                </div>
                {/* Actions Overlay */}
                {canEdit && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-7 h-7 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-black hover:bg-black hover:text-white transition-colors shadow-sm" title="Copy URL">
                      <span className="material-symbols-outlined text-xs">link</span>
                    </button>
                    <button className="w-7 h-7 bg-red-500/90 backdrop-blur rounded-lg flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-sm" title="Delete">
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
