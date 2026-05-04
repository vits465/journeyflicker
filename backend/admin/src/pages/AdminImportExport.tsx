import { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, type ImportPreview } from '../lib/api';

const TYPES  = ['destinations', 'tours', 'visas', 'contacts', 'media'];
const EXPORT_FORMATS = ['json', 'csv'];
const IMPORT_FORMATS = ['json', 'csv', 'xlsx'];

function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' | 'info' }) {
  return (
    <div className={`fixed top-5 right-5 z-[300] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2.5 text-white ${type === 'ok' ? 'bg-emerald-600' : type === 'err' ? 'bg-red-600' : 'bg-blue-600'}`}>
      <span className="material-symbols-outlined text-base">{type === 'ok' ? 'check_circle' : type === 'err' ? 'error' : 'info'}</span>
      {msg}
    </div>
  );
}

export default function AdminImportExport() {
  const { canEdit } = useOutletContext<{ canEdit: boolean }>();
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' | 'info' } | null>(null);
  const [busy, setBusy]   = useState<string | null>(null);

  // Export state
  const [expType, setExpType]     = useState('destinations');
  const [expFormat, setExpFormat] = useState('json');

  // Import state
  const [impType, setImpType]       = useState('destinations');
  const [impFormat, setImpFormat]   = useState('json');
  const [allowDups, setAllowDups]   = useState(false);
  const [preview, setPreview]       = useState<ImportPreview | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const toast$ = (msg: string, type: 'ok' | 'err' | 'info' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleExport = () => {
    api.exportData(expType, expFormat);
    toast$(`Exporting ${expType} as ${expFormat.toUpperCase()}…`, 'info');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setPreview(null);
    }
  };

  const readFileContent = (): Promise<string> => {
    return new Promise((res, rej) => {
      if (!importFile) return rej(new Error('No file'));
      const reader = new FileReader();
      if (impFormat === 'xlsx') reader.readAsDataURL(importFile);
      else reader.readAsText(importFile);
      reader.onload  = () => res(reader.result as string);
      reader.onerror = rej;
    });
  };

  const handlePreview = async () => {
    if (!importFile) return toast$('Select a file first', 'info');
    setBusy('preview');
    try {
      let content = await readFileContent();
      if (impFormat === 'xlsx') content = content.split(',')[1];
      const result = await api.importData({ type: impType, format: impFormat, data: content, preview: true, allowDuplicates: allowDups });
      if ('preview' in result) setPreview(result as ImportPreview);
    } catch (e: unknown) { toast$(e instanceof Error ? e.message : 'Preview failed', 'err'); }
    finally { setBusy(null); }
  };

  const handleImport = async () => {
    if (!importFile) return toast$('Select a file first', 'info');
    if (!confirm(`Import ${impType} from ${importFile.name}? This will add/update records.`)) return;
    setBusy('import');
    try {
      let content = await readFileContent();
      if (impFormat === 'xlsx') content = content.split(',')[1];
      const result = await api.importData({ type: impType, format: impFormat, data: content, preview: false, allowDuplicates: allowDups });
      if ('results' in result) {
        const r = result.results;
        toast$(`Imported: ${r.inserted || 0} inserted, ${r.updated || 0} updated, ${r.duplicates} skipped`);
      }
      setPreview(null);
      setImportFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e: unknown) { toast$(e instanceof Error ? e.message : 'Import failed', 'err'); }
    finally { setBusy(null); }
  };

  if (!canEdit) return <div className="p-8 text-center text-red-500 font-semibold">Access Denied</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div>
        <h1 className="text-2xl font-semibold text-on-surface tracking-tight">Import / Export</h1>
        <p className="text-on-surface-variant text-sm mt-1">Bulk import from JSON, CSV, or XLSX. Export data in JSON or CSV.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Export */}
        <div className="bg-surface dark:bg-white/5 rounded-3xl border border-outline-variant/30 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600">download</span>
            </div>
            <div>
              <h2 className="font-bold text-on-surface">Export Data</h2>
              <p className="text-xs text-on-surface-variant">Download current data</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block">Data Type</label>
              <select value={expType} onChange={e => setExpType(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary">
                {[...TYPES, 'all'].map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block">Format</label>
              <div className="flex gap-2">
                {EXPORT_FORMATS.map(f => (
                  <button key={f} onClick={() => setExpFormat(f)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition ${expFormat === f ? 'bg-emerald-600 text-white' : 'border border-outline-variant/30 text-on-surface hover:bg-surface-container-low'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={handleExport} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base">download</span>
            Export {expType} as {expFormat.toUpperCase()}
          </button>
        </div>

        {/* Import */}
        <div className="bg-surface dark:bg-white/5 rounded-3xl border border-outline-variant/30 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600">upload</span>
            </div>
            <div>
              <h2 className="font-bold text-on-surface">Import Data</h2>
              <p className="text-xs text-on-surface-variant">Upload JSON, CSV, or XLSX</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block">Import Into</label>
              <select value={impType} onChange={e => setImpType(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary">
                {TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block">Format</label>
              <div className="flex gap-2">
                {IMPORT_FORMATS.map(f => (
                  <button key={f} onClick={() => setImpFormat(f)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition ${impFormat === f ? 'bg-blue-600 text-white' : 'border border-outline-variant/30 text-on-surface hover:bg-surface-container-low'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={allowDups} onChange={e => setAllowDups(e.target.checked)} className="w-4 h-4 accent-blue-600" />
              <span className="text-xs text-on-surface-variant">Allow duplicate records</span>
            </label>

            <input ref={fileRef} type="file" accept=".json,.csv,.xlsx,.xls" className="hidden" onChange={handleFileSelect} />
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-outline-variant/40 rounded-xl p-5 text-center cursor-pointer hover:border-primary/50 hover:bg-surface-container-low transition">
              {importFile ? (
                <div className="text-sm">
                  <span className="material-symbols-outlined text-blue-500 text-2xl">description</span>
                  <p className="font-semibold text-on-surface mt-1">{importFile.name}</p>
                  <p className="text-xs text-on-surface-variant">{(importFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-on-surface-variant text-3xl">cloud_upload</span>
                  <p className="text-sm text-on-surface-variant mt-1">Click to select file</p>
                  <p className="text-xs text-on-surface-variant opacity-60">.json, .csv, .xlsx supported</p>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handlePreview} disabled={!importFile || !!busy}
              className="flex-1 py-2.5 rounded-xl border border-blue-300 text-blue-600 text-sm font-bold hover:bg-blue-50 transition disabled:opacity-40">
              {busy === 'preview' ? 'Analyzing…' : 'Preview'}
            </button>
            <button onClick={handleImport} disabled={!importFile || !!busy}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition disabled:opacity-40">
              {busy === 'import' ? 'Importing…' : 'Import'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Results */}
      {preview && (
        <div className="bg-surface dark:bg-white/5 rounded-3xl border border-outline-variant/30 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-500">preview</span>
            Import Preview
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Records', value: preview.results.total, color: 'text-blue-600' },
              { label: 'Valid', value: preview.results.valid, color: 'text-emerald-600' },
              { label: 'Duplicates', value: preview.results.duplicates, color: 'text-amber-600' },
              { label: 'Errors', value: preview.results.errors.length, color: 'text-red-600' },
            ].map(s => (
              <div key={s.label} className="bg-surface-container-low rounded-xl p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-on-surface-variant mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {preview.results.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-h-40 overflow-y-auto">
              <p className="text-xs font-bold text-red-700 mb-2">Errors:</p>
              {preview.results.errors.slice(0, 10).map((e, i) => (
                <p key={i} className="text-xs text-red-600">{e.item}: {e.error}</p>
              ))}
            </div>
          )}

          {preview.sample?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Sample (first 5 records):</p>
              <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
                <table className="w-full text-xs">
                  <thead className="bg-surface-container-lowest border-b border-outline-variant/20">
                    <tr>{Object.keys(preview.sample[0]).slice(0, 5).map(k => (
                      <th key={k} className="px-3 py-2 text-left font-bold text-on-surface-variant capitalize">{k}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {preview.sample.map((row, i) => (
                      <tr key={i} className="hover:bg-surface-container-lowest">
                        {Object.values(row).slice(0, 5).map((v, j) => (
                          <td key={j} className="px-3 py-2 text-on-surface truncate max-w-[120px]">{String(v || '—')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
