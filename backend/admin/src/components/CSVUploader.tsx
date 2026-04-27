import { useRef, useState } from 'react';
import { parseCSV } from '../lib/csvParser';
import { api, uploadImage } from '../lib/api';

interface CSVUploaderProps {
  type: 'destination' | 'tour' | 'visa';
  onUploadComplete: () => void;
}

export function CSVUploader({ type, onUploadComplete }: CSVUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imgFiles, setImgFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState('');

  const csvRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const resolveImageUrl = (rawVal: string, urlMap: Record<string, string>) => {
    if (!rawVal) return '';
    // If it's multiple images separated by |
    if (rawVal.includes('|')) {
      return rawVal.split('|').map(s => {
        const t = s.trim();
        return urlMap[t] || t;
      }).join(' | ');
    }
    // single image
    const t = rawVal.trim();
    return urlMap[t] || t;
  };

  const processDestinations = async (data: Record<string, string>[], urlMap: Record<string, string>) => {
    for (const row of data) {
      if (!row.name || !row.region) continue;
      const payload: any = {
        name: row.name,
        region: row.region,
        description: row.description || '',
        heroImageUrl: resolveImageUrl(row.heroImageUrl || '', urlMap),
        essenceText: row.essenceText || '',
        bestSeasonsTitle: row.bestSeasonsTitle || '',
        bestSeasonsMonths: row.bestSeasonsMonths || '',
      };

      if (row.galleryImages) {
        payload.galleryImages = row.galleryImages.split('|').map(s => urlMap[s.trim()] || s.trim()).filter(Boolean);
      }

      if (row.landmarks) {
        payload.landmarks = row.landmarks.split('|').filter(Boolean).map(lm => {
          const parts = lm.split(';;').map(s => s.trim());
          return { 
            title: parts[0] || '', 
            category: parts[1] || '', 
            description: parts[2] || '', 
            imageUrl: urlMap[parts[3] || ''] || parts[3] || '' 
          };
        });
      }

      if (row.seasonsHighlights) {
        payload.seasonsHighlights = row.seasonsHighlights.split('|').filter(Boolean).map(sh => {
          const parts = sh.split(';;').map(s => s.trim());
          return { season: parts[0] || '', description: parts[1] || '' };
        });
      }
      try {
        await api.createDestination(payload);
      } catch (err) {
        console.error(`Failed destination ${row.name}`, err);
      }
    }
  };

  const processTours = async (data: Record<string, string>[], urlMap: Record<string, string>) => {
    for (const row of data) {
      if (!row.name || !row.region || !row.price) continue;
      const payload: any = {
        name: row.name,
        region: row.region,
        days: row.days ? parseInt(row.days, 10) : 1,
        price: row.price,
        category: row.category || 'Standard',
        rating: row.rating ? parseFloat(row.rating) : 5,
        heroImageUrl: resolveImageUrl(row.heroImageUrl || '', urlMap),
        overviewDescription: row.overviewDescription || '',
        overviewExtended: row.overviewExtended || '',
        overviewImageUrl: resolveImageUrl(row.overviewImageUrl || '', urlMap),
        transport: row.transport || '',
        guide: row.guide || '',
        pickup: row.pickup || '',
        maxGuests: parseInt(row.maxGuests) || 0,
      };

      if (row.visualArchive) {
        payload.visualArchive = row.visualArchive.split('|').map(s => urlMap[s.trim()] || s.trim()).filter(Boolean);
      }
      if (row.departureWindows) {
        payload.departureWindows = row.departureWindows.split('|').map(s => s.trim()).filter(Boolean);
      }
      
      if (row.itinerary) {
        payload.itinerary = row.itinerary.split('|').filter(Boolean).map(it => {
          const parts = it.split(';;').map(s => s.trim());
          return {
            title: parts[0] || '',
            description: parts[1] || '',
            imageUrl: urlMap[parts[2] || ''] || parts[2] || '',
            schedule: parts[3] || '',
            accommodation: parts[4] || '',
            meals: parts[5] || ''
          };
        });
      }

      if (row.sightseeing) {
        payload.sightseeing = row.sightseeing.split('|').filter(Boolean).map(ss => {
          const parts = ss.split(';;').map(s => s.trim());
          return { 
            title: parts[0] || '', 
            description: parts[1] || '', 
            icon: parts[2] || 'place', 
            imageUrl: urlMap[parts[3] || ''] || parts[3] || '' 
          };
        });
      }

      if (row.testimonials) {
        payload.testimonials = row.testimonials.split('|').filter(Boolean).map(ts => {
          const parts = ts.split(';;').map(s => s.trim());
          return { quote: parts[0] || '', author: parts[1] || '' };
        });
      }
      try {
        await api.createTour(payload);
      } catch (err) {
        console.error(`Failed tour ${row.name}`, err);
      }
    }
  };

  const processVisas = async (data: Record<string, string>[]) => {
    for (const row of data) {
      if (!row.country || !row.processing) continue;
      const payload: any = {
        country: row.country,
        processing: row.processing,
        difficulty: row.difficulty || 'Moderate',
        fee: row.fee || 'None',
      };
      try {
        await api.createVisa(payload);
      } catch (err) {
        console.error(`Failed visa ${row.country}`, err);
      }
    }
  };

  const handleUploadSubmit = async () => {
    if (!csvFile) return alert('Please select a CSV file first.');

    setLoading(true);
    try {
      // 1. Upload Images
      const urlMap: Record<string, string> = {};
      if (imgFiles.length > 0) {
        setProgress(`Uploading ${imgFiles.length} images...`);
        for (let i = 0; i < imgFiles.length; i++) {
          const file = imgFiles[i];
          const url = await uploadImage(file);
          urlMap[file.name] = url;
        }
      }

      // 2. Parse CSV
      setProgress('Parsing CSV data...');
      const text = await csvFile.text();
      const parsedData = parseCSV(text);

      // 3. Process Entries
      setProgress(`Creating ${parsedData.length} records...`);
      if (type === 'destination') {
        await processDestinations(parsedData, urlMap);
      } else if (type === 'tour') {
        await processTours(parsedData, urlMap);
      } else if (type === 'visa') {
        await processVisas(parsedData);
      }

      alert(`CSV Upload and Image Sync for ${type}s complete!`);
      setShowModal(false);
      setCsvFile(null);
      setImgFiles([]);
      onUploadComplete();
    } catch (err) {
      console.error(err);
      alert('Error processing bulk upload. Please check the files and format.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-xs font-semibold hover:bg-orange-100 transition-colors"
      >
        <span className="material-symbols-outlined text-base">upload_file</span>
        Import {type === 'destination' ? 'Destinations' : type === 'tour' ? 'Tours' : 'Visas'}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-on-surface">Bulk Import {type === 'destination' ? 'Destinations' : type === 'tour' ? 'Tours' : 'Visas'}</h3>
              <button 
                onClick={() => !loading && setShowModal(false)}
                className="text-on-surface-variant hover:text-on-surface disabled:opacity-50"
                disabled={loading}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* CSV Upload */}
              <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low text-center cursor-pointer hover:bg-surface-container transition-colors" onClick={() => !loading && csvRef.current?.click()}>
                <span className="material-symbols-outlined text-3xl text-orange-600 mb-2">description</span>
                <p className="text-sm font-semibold">{csvFile ? csvFile.name : '1. Select CSV Data File'}</p>
                <p className="text-xs text-on-surface-variant">{csvFile ? 'File selected' : 'Excel Export (Comma Separated)'}</p>
                <input type="file" accept=".csv" ref={csvRef} className="hidden" onChange={e => setCsvFile(e.target.files?.[0] || null)} />
              </div>

              {/* Images Upload (Hide for Visas) */}
              {type !== 'visa' && (
              <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low text-center cursor-pointer hover:bg-surface-container transition-colors" onClick={() => !loading && imgRef.current?.click()}>
                <span className="material-symbols-outlined text-3xl text-blue-600 mb-2">perm_media</span>
                <p className="text-sm font-semibold">{imgFiles.length > 0 ? `${imgFiles.length} images selected` : '2. Select Corresponding Images (Optional)'}</p>
                <p className="text-xs text-on-surface-variant">Select all images referenced in your CSV (Hold Ctrl/Cmd to select multiple)</p>
                <input type="file" accept="image/*" multiple ref={imgRef} className="hidden" onChange={e => setImgFiles(Array.from(e.target.files || []))} />
              </div>
              )}

              {/* Status */}
              {loading && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-3">
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  {progress}
                </div>
              )}
              
              <div className="flex justify-end gap-2 mt-6">
                <button 
                  onClick={() => setShowModal(false)} 
                  disabled={loading}
                  className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUploadSubmit}
                  disabled={loading || !csvFile}
                  className="px-4 py-2 text-sm font-semibold bg-black text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? 'Processing...' : 'Run Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
