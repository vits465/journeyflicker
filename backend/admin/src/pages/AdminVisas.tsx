import { useState, useEffect } from 'react';
import type { Visa } from '../lib/api';
import { api } from '../lib/api';
import { useAdminAuth } from '../lib/adminAuth';
import { Preloader } from '../components/Preloader';

const emptyForm: Partial<Visa> = { country: '', processing: '', difficulty: 'Moderate', fee: '' };
const inputCls = 'w-full px-3 py-1.5 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary';
const labelCls = 'block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1';

export default function AdminVisas() {
  const { canCRUD } = useAdminAuth();
  const [visas, setVisas] = useState<Visa[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Visa>>(emptyForm);

  useEffect(() => {
    loadVisas();
    const interval = setInterval(loadVisas, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadVisas = () =>
    api.listVisas().then((data) => { setVisas(data); setLoading(false); }).catch(console.error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      editingId ? await api.updateVisa(editingId, formData) : await api.createVisa(formData);
      setFormData(emptyForm);
      setEditingId(null);
      loadVisas();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (visa: Visa) => { setFormData(visa); setEditingId(visa.id); };
  const handleDelete = async (id: string) => {
    if (confirm('Delete this visa requirement?')) {
      try { await api.deleteVisa(id); loadVisas(); } catch (err) { console.error(err); }
    }
  };

  const difficultyBadge = (d?: string) =>
    d === 'Easy' ? 'bg-green-50 text-green-700' : d === 'Moderate' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700';

  return (
    <div className="space-y-5 w-full max-w-3xl mx-auto">
      {!canCRUD && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs font-semibold">
          <span className="material-symbols-outlined text-base">visibility</span>
          You have read-only access. Contact an editor to make changes.
        </div>
      )}
      {canCRUD && <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-outline-variant/30">
        <h2 className="text-base font-semibold text-on-surface mb-4">
          {editingId ? '✏️ Edit' : '+ Create'} Visa Requirement
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelCls}>Country</label>
            <input type="text" value={formData.country || ''} onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className={inputCls} placeholder="e.g., Japan" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Processing Time</label>
              <input type="text" value={formData.processing || ''} onChange={(e) => setFormData({ ...formData, processing: e.target.value })}
                className={inputCls} placeholder="e.g., 2–4 weeks" required />
            </div>
            <div>
              <label className={labelCls}>Difficulty</label>
              <select value={formData.difficulty || 'Moderate'} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })} className={inputCls}>
                <option>Easy</option>
                <option>Moderate</option>
                <option>Difficult</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Estimated Fee</label>
              <input type="text" value={formData.fee || ''} onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                className={inputCls} placeholder="e.g., $100–$150" required />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-1 border-t">
            <button type="submit" className="px-5 py-2 bg-black text-white rounded text-sm font-semibold hover:bg-gray-800 transition-colors">
              {editingId ? 'Update' : 'Create'} Visa
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setFormData(emptyForm); }}
                className="px-5 py-2 bg-gray-100 text-gray-700 rounded text-sm font-semibold hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>}

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant/30 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-on-surface">All Visa Requirements</h2>
          <span className="text-xs text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded-full">{visas.length}</span>
        </div>
        {loading ? (
          <Preloader />
        ) : visas.length === 0 ? (
          <div className="p-6 text-center text-sm text-on-surface-variant">No visa requirements yet. Add one above!</div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-container-low border-b border-outline-variant/30">
                  <tr>
                    {['Country', 'Processing', 'Difficulty', 'Fee', 'Actions'].map((h) => (
                      <th key={h} className={`px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wide ${h === 'Actions' ? 'text-center' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {visas.map((visa) => (
                    <tr key={visa.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-on-surface">{visa.country}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{visa.processing}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${difficultyBadge(visa.difficulty)}`}>{visa.difficulty}</span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">{visa.fee}</td>
                      <td className="px-4 py-3 text-center space-x-3">
                        {canCRUD && <button onClick={() => handleEdit(visa)} className="text-blue-600 hover:text-blue-800 font-medium text-xs">Edit</button>}
                        {canCRUD && <button onClick={() => handleDelete(visa.id)} className="text-red-500 hover:text-red-700 font-medium text-xs">Delete</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-3 p-3">
              {visas.map((visa) => (
                <div key={visa.id} className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-sm text-on-surface">{visa.country}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${difficultyBadge(visa.difficulty)}`}>{visa.difficulty}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-0.5">Processing: {visa.processing}</p>
                  <p className="text-xs text-on-surface-variant mb-3">Fee: {visa.fee}</p>
                  <div className="flex gap-2">
                    {canCRUD && <button onClick={() => handleEdit(visa)} className="flex-1 text-blue-600 text-xs font-semibold py-1.5 px-2 bg-blue-50 rounded hover:bg-blue-100">Edit</button>}
                    {canCRUD && <button onClick={() => handleDelete(visa.id)} className="flex-1 text-red-500 text-xs font-semibold py-1.5 px-2 bg-red-50 rounded hover:bg-red-100">Delete</button>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
