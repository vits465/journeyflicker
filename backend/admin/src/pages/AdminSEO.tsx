import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, type SeoPage } from '../lib/api';

const DEFAULT_PAGES: SeoPage[] = [
  { id: 'home', name: 'Homepage', path: '/', title: 'JourneyFlicker | Digital Curator of Luxury Travel', desc: 'Experience the world\'s most evocative territories through our curated luxury travel itineraries.', ogImage: '' },
  { id: 'destinations', name: 'Destinations', path: '/destinations', title: 'Luxury Destinations | JourneyFlicker', desc: 'Explore our handpicked selection of premium global destinations.', ogImage: '' },
  { id: 'tours', name: 'Tours & Journeys', path: '/tours', title: 'Curated Tours | JourneyFlicker', desc: 'Browse our exclusive, meticulously planned travel experiences and guided tours.', ogImage: '' },
  { id: 'about', name: 'About Us', path: '/about', title: 'About JourneyFlicker', desc: 'Learn about our philosophy as digital curators of luxury travel.', ogImage: '' },
];

export default function AdminSEO() {
  const { canEdit } = useOutletContext<{ canEdit: boolean }>();
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [activePageId, setActivePageId] = useState<string>('home');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSeoSettings().then(data => {
      if (data && data.length > 0) {
        // Merge with default to ensure all pages exist
        const merged = DEFAULT_PAGES.map(dp => {
          const found = data.find((p: SeoPage) => p.id === dp.id);
          return found ? { ...dp, ...found } : dp;
        });
        setPages(merged);
      } else {
        setPages(DEFAULT_PAGES);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setPages(DEFAULT_PAGES);
      setLoading(false);
    });
  }, []);

  const activePage = pages.find(p => p.id === activePageId) || pages[0];

  const handleUpdate = (field: keyof SeoPage, value: string) => {
    setPages(prev => prev.map(p => p.id === activePageId ? { ...p, [field]: value } : p));
  };

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      await api.updateSeoSettings(pages);
      alert('SEO Metadata updated successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to update SEO settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-on-surface-variant">Loading...</div>;
  }

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
            {pages.map(page => (
              <button
                key={page.id}
                onClick={() => setActivePageId(page.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activePageId === page.id ? 'bg-black text-white shadow-md' : 'text-on-surface hover:bg-surface-container-low'
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
                  value={activePage.title}
                  onChange={e => handleUpdate('title', e.target.value)}
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
                  value={activePage.desc}
                  onChange={e => handleUpdate('desc', e.target.value)}
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
                    {activePage.ogImage ? (
                      <img src={activePage.ogImage} alt="OG" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant/40">image</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://... (Image URL)"
                        value={activePage.ogImage || ''}
                        onChange={e => handleUpdate('ogImage', e.target.value)}
                        disabled={!canEdit}
                        className="flex-1 px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none disabled:opacity-50"
                      />
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
