import { useRef, useState } from 'react';
import { api, uploadImage } from '../lib/api';

interface DocImporterProps {
  type: 'destination' | 'tour' | 'visa';
  onUploadComplete: () => void;
}

// ── Parse plain text from .docx by extracting readable content ──────────────
async function extractTextFromFile(file: File): Promise<string> {
  // For plain text files
  if (file.name.endsWith('.txt')) {
    return await file.text();
  }
  // For .docx — extract raw XML text (works without external libs)
  if (file.name.endsWith('.docx')) {
    try {
      const { default: JSZip } = await import('jszip');
      const zip = await JSZip.loadAsync(file);
      const xmlFile = zip.file('word/document.xml');
      if (!xmlFile) throw new Error('Not a valid docx');
      const xml = await xmlFile.async('string');
      // Strip XML tags and decode common entities
      const text = xml
        .replace(/<w:br[^/]*/g, '\n')
        .replace(/<w:p[ >][^>]*>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&apos;/g, "'").replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, '\n\n');
      return text;
    } catch {
      // Fallback: try reading as plain text
      return await file.text();
    }
  }
  return await file.text();
}

// ── Smart Tour Parser ────────────────────────────────────────────────────────
function parseTourText(raw: string) {
  const text = raw;
  const destMatch = text.match(/DESTINATION\s*[:\-]?\s*([A-Z][A-Z ]+)/i) || text.match(/([A-Z][A-Z ]+)\s+TOUR/);
  const name = destMatch ? destMatch[1].trim() + ' Discovery Tour' : 'New Tour';
  const regionMatch = text.match(/DESTINATION\s*[:\-]?\s*([A-Za-z ]+)/i);
  const region = regionMatch ? regionMatch[1].trim() : name.split(' ')[0] || '';
  const daysMatch = text.match(/(\d+)\s*Night[s]?\s*(\d+)\s*Day[s]?/i) || text.match(/(\d+)\s*Day[s]?/i);
  const days = daysMatch ? parseInt(daysMatch[2] || daysMatch[1]) : 7;
  const priceMatch = text.match(/USD[.\s]*(\d+[,\d]*)/i);
  const price = priceMatch ? `$${priceMatch[1]}` : '';
  const dayMatches = [...text.matchAll(/Day[-\s]*(\d+).*?\n([^]+?)(?=Day[-\s]*\d+|Above Package|$)/gi)];
  const itinerary = dayMatches.slice(0, 12).map(m => {
    const dayText = m[2].trim();
    const titleLine = dayText.split('\n')[0];
    const description = dayText.split('\n').slice(1).join(' ').trim() || titleLine;
    const mealsMatch = dayText.match(/\(([BLD][^)]+)\)/i);
    const meals = mealsMatch ? mealsMatch[1].replace(/B/g, 'Breakfast').replace(/L/g, 'Lunch').replace(/D/g, 'Dinner').replace(/-/g, ', ') : '';
    const cleanTitle = titleLine.replace(/\([BLD,\s-]+\)/gi, '').trim();
    const dynamicImage = `https://source.unsplash.com/800x600/?${encodeURIComponent(region + ' ' + cleanTitle.split(' ')[0] + ' travel')}`;
    return { title: cleanTitle, description: description.substring(0, 300), meals, accommodation: '', schedule: '', imageUrl: dynamicImage };
  });
  const includesMatch = text.match(/Package Includes[:\s]*([^]*?)(?=Package Excludes|Cancellation|$)/i);
  const sightseeing: any[] = [];
  if (includesMatch) {
    const bullets = includesMatch[1].match(/(?:^|\n)\s*[•\-\d.]+\s*(.+)/gm) || [];
    bullets.slice(0, 5).forEach(b => {
      const t = b.replace(/^[\s•\-\d.]+/, '').trim();
      if (t.length > 5) {
        const sightImage = `https://source.unsplash.com/800x600/?${encodeURIComponent(region + ' ' + t.substring(0, 20) + ' travel')}`;
        sightseeing.push({ title: t.substring(0, 40), description: t, icon: 'star', imageUrl: sightImage });
      }
    });
  }
  const transport = [
    /bullet train|shinkansen/i.test(text) ? 'Bullet Train (Shinkansen)' : '',
    /private transfer|private basis/i.test(text) ? 'Private Transfers' : '',
    /flight|airport/i.test(text) ? 'Flight (as specified)' : '',
  ].filter(Boolean).join(', ');
  const guideMatch = text.match(/([A-Za-z\/\s]+speaking guide)/i);
  const guide = guideMatch ? guideMatch[1].trim() : '';
  const pickupMatch = text.match(/arrive in ([A-Za-z ]+)/i) || text.match(/([A-Z]{3})\s*Airport/i);
  const pickup = pickupMatch ? pickupMatch[1].trim() : '';
  const heroImage = `https://source.unsplash.com/1200x800/?${encodeURIComponent(region + ' landscape travel')}`;
  const visualArchive = [
    `https://source.unsplash.com/800x600/?${encodeURIComponent(region + ' city')}`,
    `https://source.unsplash.com/800x600/?${encodeURIComponent(region + ' nature')}`,
    `https://source.unsplash.com/800x600/?${encodeURIComponent(region + ' culture')}`
  ];
  return { name, region, days, price, category: 'Signature Expedition', rating: 4.8, transport, guide, pickup, overviewDescription: `A curated ${days}-day journey through ${region}.`, itinerary, sightseeing, visualArchive, departureWindows: [], maxGuests: 8, heroImageUrl: heroImage };
}

// ── Smart Destination Parser ─────────────────────────────────────────────────
function parseDestinationText(raw: string) {
  const text = raw;
  const destMatch = text.match(/DESTINATION\s*[:\-]?\s*([A-Z][A-Z ]+)/i) || text.match(/^([A-Z][A-Z ]{2,})\s*TOUR/m) || text.match(/arrive in ([A-Za-z ]+)/i);
  const name = destMatch ? destMatch[1].trim().replace(/\bTOUR\b/i, '').trim() : 'New Destination';
  const region = name;
  const paragraphs = raw.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 60);
  const description = paragraphs.find(p => !/QUOTATION|TRAVELING|Dear Sir|Greeting|Option|Hotel|Per Person|Day-|Package/i.test(p)) || '';
  const visitMatches = [...text.matchAll(/[Vv]isit ([^.\n]+)/g)];
  const landmarks: any[] = [];
  const seen = new Set<string>();
  visitMatches.forEach(m => {
    m[1].split(/,|and/).map(p => p.trim()).filter(p => p.length > 3 && p.length < 60).forEach(place => {
      if (!seen.has(place) && landmarks.length < 6) {
        seen.add(place);
        const cleanPlace = place.replace(/^the /i, '');
        const dynamicImage = `https://source.unsplash.com/800x600/?${encodeURIComponent(name + ' ' + cleanPlace + ' landmark')}`;
        landmarks.push({ title: cleanPlace, category: 'Attraction', description: `A must-visit landmark in ${name}.`, imageUrl: dynamicImage });
      }
    });
  });
  const heroImage = `https://source.unsplash.com/1200x800/?${encodeURIComponent(name + ' famous landmark travel')}`;
  const galleryImages = [
    `https://source.unsplash.com/800x600/?${encodeURIComponent(name + ' street view')}`,
    `https://source.unsplash.com/800x600/?${encodeURIComponent(name + ' architecture')}`,
    `https://source.unsplash.com/800x600/?${encodeURIComponent(name + ' landscape')}`,
    `https://source.unsplash.com/800x600/?${encodeURIComponent(name + ' culture')}`
  ];
  return { name, region, description: description.substring(0, 500), essenceText: '', heroImageUrl: heroImage, galleryImages, bestSeasonsTitle: `Best Time to Visit ${name}`, bestSeasonsMonths: '', landmarks, seasonsHighlights: [{ season: 'Peak Season', description: `Best time to visit ${name}.` }, { season: 'Off-Peak', description: `Fewer crowds in ${name}.` }] };
}

// ── Smart Visa Parser ────────────────────────────────────────────────────────
function parseVisaText(raw: string) {
  const text = raw;
  const destMatch = text.match(/DESTINATION\s*[:\-]?\s*([A-Z][A-Z ]+)/i) || text.match(/([A-Z][A-Z ]+)\s+VISA/i);
  const country = destMatch ? destMatch[1].trim() : 'New Country';
  const typeMatch = text.match(/Type\s*[:\-]?\s*([A-Za-z ]+)/i);
  const visaType = typeMatch ? typeMatch[1].trim() : 'Tourist Visa';
  const processingMatch = text.match(/Processing\s*(?:Time)?\s*[:\-]?\s*([A-Za-z0-9 ]+)/i);
  const processing = processingMatch ? processingMatch[1].trim() : '7-10 Business Days';
  const feeMatch = text.match(/(?:Fee|Cost)\s*[:\-]?\s*USD\s*(\d+)/i) || text.match(/USD\s*(\d+)/i);
  const fee = feeMatch ? `$${feeMatch[1]}` : '$150';
  
  const diffMatch = text.match(/Difficulty\s*[:\-]?\s*(Easy|Medium|Moderate|Hard|Complex)/i);
  let difficulty = diffMatch ? diffMatch[1].trim() : 'Moderate';
  if (difficulty.toLowerCase() === 'medium') difficulty = 'Moderate';
  if (difficulty.toLowerCase() === 'hard' || difficulty.toLowerCase() === 'complex') difficulty = 'Challenging';
  // Capitalize properly
  difficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  const paragraphs = raw.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 50);
  const description = paragraphs.find(p => !/QUOTATION|TRAVELING|Requirement|Document|Processing|Fee/i.test(p)) || `Comprehensive visa assistance for ${country}.`;

  const docsMatch = text.match(/(?:Required Documents|Documents)[:\s]*([^]*?)(?=Requirements|Process|Cancellation|$)/i);
  const documents: string[] = [];
  if (docsMatch) {
    const bullets = docsMatch[1].match(/(?:^|\n)\s*[•\-\d.]+\s*(.+)/gm) || [];
    bullets.forEach(b => documents.push(b.replace(/^[\s•\-\d.]+/, '').trim()));
  }

  const reqMatch = text.match(/Requirements[:\s]*([^]*?)(?=Process|Cancellation|$)/i);
  const requirements: {label: string, detail: string}[] = [];
  if (reqMatch) {
    const bullets = reqMatch[1].match(/(?:^|\n)\s*[•\-\d.]+\s*(.+)/gm) || [];
    bullets.forEach(b => {
      const parts = b.replace(/^[\s•\-\d.]+/, '').split(':');
      if (parts.length > 1) {
        requirements.push({ label: parts[0].trim(), detail: parts.slice(1).join(':').trim() });
      } else {
        requirements.push({ label: 'Requirement', detail: parts[0].trim() });
      }
    });
  }

  const heroImage = `https://source.unsplash.com/1200x800/?${encodeURIComponent(country + ' passport travel')}`;
  return { country, processing, difficulty, fee, description: description.substring(0, 500), visaType, documents, requirements, heroImageUrl: heroImage };
}

export function CSVUploader({ type, onUploadComplete }: DocImporterProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [imgFiles, setImgFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState('');
  const [preview, setPreview] = useState('');

  const docRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const handleDocChange = async (file: File | null) => {
    setDocFile(file);
    if (!file) return;
    try {
      const text = await extractTextFromFile(file);
      setPreview(text.substring(0, 200) + '...');
    } catch { setPreview('File loaded.'); }
  };

  const handleSubmit = async () => {
    if (!docFile) return alert('Please select a document file first.');
    setLoading(true);
    try {
      setProgress('Reading document...');
      const text = await extractTextFromFile(docFile);

      // Upload images if any
      const urlMap: Record<string, string> = {};
      if (imgFiles.length > 0) {
        setProgress(`Uploading ${imgFiles.length} images...`);
        for (const file of imgFiles) {
          const url = await uploadImage(file);
          urlMap[file.name] = url;
        }
      }

      setProgress('Parsing document data...');

      if (type === 'tour') {
        const parsed = parseTourText(text);
        if (imgFiles.length > 0) parsed.heroImageUrl = Object.values(urlMap)[0] || '';
        await api.createTour(parsed as any);
      } else if (type === 'destination') {
        const parsed = parseDestinationText(text);
        if (imgFiles.length > 0) parsed.heroImageUrl = Object.values(urlMap)[0] || '';
        await api.createDestination(parsed as any);
      } else if (type === 'visa') {
        const parsed = parseVisaText(text);
        // Visa model doesn't support multiple images in CSVUploader form yet, but if it did we'd handle it.
        await api.createVisa(parsed as any);
      }

      alert(`Document imported as ${type} successfully!`);
      setShowModal(false);
      setDocFile(null);
      setImgFiles([]);
      setPreview('');
      onUploadComplete();
    } catch (err) {
      console.error(err);
      alert('Error processing document. Please try again.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const label = type === 'destination' ? 'Destinations' : type === 'tour' ? 'Tours' : 'Visas';

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-2 bg-violet-50 text-violet-700 rounded-lg text-xs font-semibold hover:bg-violet-100 transition-colors"
      >
        <span className="material-symbols-outlined text-base">description</span>
        Import {label}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div style={{ width:38, height:38, background:'linear-gradient(135deg,#667eea,#764ba2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span className="material-symbols-outlined" style={{ color:'#fff', fontSize:20 }}>description</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Import {label} from Document</h3>
                  <p className="text-xs text-on-surface-variant">Upload a .docx or .txt file — data will be auto-extracted</p>
                </div>
              </div>
              <button onClick={() => !loading && setShowModal(false)} disabled={loading} className="text-on-surface-variant hover:text-on-surface disabled:opacity-50">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Doc Upload */}
              <div
                className="p-5 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50 text-center cursor-pointer hover:bg-violet-100 transition-colors"
                onClick={() => !loading && docRef.current?.click()}
              >
                <span className="material-symbols-outlined text-4xl text-violet-500 mb-2">description</span>
                <p className="text-sm font-semibold text-violet-800">{docFile ? docFile.name : '1. Select Document File'}</p>
                <p className="text-xs text-violet-500 mt-1">{docFile ? 'File selected ✓' : 'Supports .docx and .txt files'}</p>
                <input type="file" accept=".docx,.txt,.doc" ref={docRef} className="hidden" onChange={e => handleDocChange(e.target.files?.[0] || null)} />
              </div>

              {/* Preview */}
              {preview && (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Document Preview</p>
                  <p className="text-xs text-gray-600 font-mono leading-relaxed">{preview}</p>
                </div>
              )}

              {/* Images Upload */}
              {type !== 'visa' && (
                <div
                  className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low text-center cursor-pointer hover:bg-surface-container transition-colors"
                  onClick={() => !loading && imgRef.current?.click()}
                >
                  <span className="material-symbols-outlined text-3xl text-blue-500 mb-1">perm_media</span>
                  <p className="text-sm font-semibold">{imgFiles.length > 0 ? `${imgFiles.length} image(s) selected` : '2. Select Images (Optional)'}</p>
                  <p className="text-xs text-on-surface-variant">First image will be used as Hero Image</p>
                  <input type="file" accept="image/*" multiple ref={imgRef} className="hidden" onChange={e => setImgFiles(Array.from(e.target.files || []))} />
                </div>
              )}

              {/* Progress */}
              {loading && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-3">
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  {progress}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setShowModal(false)} disabled={loading} className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !docFile}
                  className="px-4 py-2 text-sm font-semibold bg-black text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  {loading ? 'Processing...' : 'Import & Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
