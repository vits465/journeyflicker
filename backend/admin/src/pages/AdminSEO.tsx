import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

const PAGES = [
  { id: 'home', name: 'Homepage', path: '/', title: 'JourneyFlicker | Digital Curator of Luxury Travel', desc: 'Experience the world\'s most evocative territories through our curated luxury travel itineraries.' },
  { id: 'destinations', name: 'Destinations', path: '/destinations', title: 'Luxury Destinations | JourneyFlicker', desc: 'Explore our handpicked selection of premium global destinations.' },
  { id: 'tours', name: 'Tours & Journeys', path: '/tours', title: 'Curated Tours | JourneyFlicker', desc: 'Browse our exclusive, meticulously planned travel experiences and guided tours.' },
  { id: 'about', name: 'About Us', path: '/about', title: 'About JourneyFlicker', desc: 'Learn about our philosophy as digital curators of luxury travel.' },
];

export default function AdminSEO() {
  const { canEdit } = useOutletContext<{ canEdit: boolean }>();
  const [activePage, setActivePage] = useState(PAGES[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!canEdit) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('SEO Metadata updated successfully.');
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-on-surface tracking-tight">Global SEO Manager</h2>
        <p className="text-on-surface-variant text-sm mt-1">Manage search engine optimization tags and social sharing metadata across static pages.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Page List Sidebar */}
        <div className="bg-white rounded-2xl border border-outline-variant/30 p-4 shadow-sm h-fit">
          <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-4 px-2">Static Pages</h3>
          <div className="space-y-1">
            {PAGES.map(page => (
              <button
                key={page.id}
                onClick={() => setActivePage(page)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activePage.id === page.id ? 'bg-black text-white shadow-md' : 'text-on-surface hover:bg-surface-container-low'
                }`}
              >
                {page.name}
              </button>
            ))}
          </div>
          <div className="mt-6 px-2">
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-xs text-blue-800 flex gap-2">
              <span className="material-symbols-outlined text-base text-blue-500">info</span>
              <span>Dynamic pages (individual tours/destinations) inherit SEO from their specific database entries.</span>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8 border-b border-outline-variant/20 pb-4">
              <div>
                <h3 className="text-xl font-bold text-on-surface">{activePage.name}</h3>
                <p className="text-xs text-on-surface-variant font-mono mt-1">Path: {activePage.path}</p>
              </div>
              {canEdit && (
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-black text-white px-6 py-2 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition flex items-center gap-2 shadow-md"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Meta Title</label>
                <input
                  type="text"
                  defaultValue={activePage.title}
                  disabled={!canEdit}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-sm focus:ring-2 focus:ring-black focus:outline-none disabled:opacity-50"
                />
                <div className="flex justify-between mt-1 text-[10px] text-on-surface-variant">
                  <span>Recommended: 50-60 characters</span>
                  <span>{activePage.title.length} / 60</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Meta Description</label>
                <textarea
                  rows={3}
                  defaultValue={activePage.desc}
                  disabled={!canEdit}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-sm focus:ring-2 focus:ring-black focus:outline-none disabled:opacity-50 resize-none"
                />
                <div className="flex justify-between mt-1 text-[10px] text-on-surface-variant">
                  <span>Recommended: 150-160 characters</span>
                  <span>{activePage.desc.length} / 160</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Social Sharing Image (OpenGraph)</label>
                <div className="flex gap-4">
                  <div className="w-32 h-20 bg-surface-container border border-outline-variant/30 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    <span className="material-symbols-outlined text-on-surface-variant/40">image</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://... (Image URL)"
                        disabled={!canEdit}
                        className="flex-1 px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none disabled:opacity-50"
                      />
                      {canEdit && (
                        <button className="px-4 py-2 bg-surface-container border border-outline-variant/50 rounded-lg text-xs font-bold uppercase hover:bg-surface-container-low transition">
                          Browse
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-2">Used when the page is shared on Twitter, Facebook, or LinkedIn. Ideal size: 1200x630px.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Google Preview */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 md:p-8 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-4">Search Engine Preview</h3>
            <div className="p-5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl max-w-2xl">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold">JF</div>
                <div>
                  <div className="text-[11px] text-[#202124]">JourneyFlicker</div>
                  <div className="text-[10px] text-[#4d5156]">https://journeyflicker.com{activePage.path === '/' ? '' : activePage.path}</div>
                </div>
              </div>
              <div className="text-[#1a0dab] text-[18px] hover:underline cursor-pointer truncate">{activePage.title}</div>
              <div className="text-[#4d5156] text-[13px] leading-snug mt-1">{activePage.desc}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
