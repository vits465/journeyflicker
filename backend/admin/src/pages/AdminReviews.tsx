import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../lib/api';

interface Review {
  id: string | number;
  author: string;
  date: string;
  rating: number;
  content: string;
}

export default function AdminReviews() {
  const { canEdit } = useOutletContext<{ canEdit: boolean }>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getReviews()
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      await api.updateReviews(reviews);
      alert('Reviews saved successfully!');
    } catch (err) {
      alert('Failed to save reviews');
    } finally {
      setSaving(false);
    }
  };

  const addReview = () => {
    const newRev: Review = { id: Date.now().toString(), author: 'New Reviewer', date: 'Just now', rating: 5, content: 'Excellent experience.' };
    setReviews([newRev, ...reviews]);
  };

  const removeReview = (id: string | number) => {
    if (!confirm('Remove this review?')) return;
    setReviews(reviews.filter(r => r.id !== id));
  };

  const updateReview = (id: string | number, field: keyof Review, value: any) => {
    setReviews(reviews.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  if (loading) return <div className="p-10 text-center text-on-surface-variant font-medium animate-pulse">Loading reviews database...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-on-surface tracking-tight">Google Reviews Integration</h2>
          <p className="text-on-surface-variant text-sm mt-1">Manage the global reviews that randomly appear on Tour and Destination pages.</p>
        </div>
        {canEdit && (
          <div className="flex gap-3">
            <button onClick={addReview} className="px-4 py-2 bg-surface text-on-surface border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span> Add Review
            </button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors text-sm font-bold flex items-center gap-2 disabled:opacity-50">
              <span className="material-symbols-outlined text-[18px]">save</span> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-5 py-4 rounded-2xl flex items-start gap-3 shadow-sm mb-6">
        <span className="material-symbols-outlined text-blue-500 mt-0.5">cloud_sync</span>
        <div>
          <strong className="block text-sm mb-1">Live Database Sync Active</strong>
          <p className="text-xs opacity-90 leading-relaxed">
            These reviews are synced directly to your live frontend. The website will randomly select 4 of these reviews to display at the bottom of every page. Make sure they represent your best 5-star feedback! Click "Save Changes" to publish your edits to the website immediately.
          </p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-outline-variant/30 p-12 text-center shadow-sm">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">reviews</span>
            <p className="text-on-surface-variant">No reviews found. Click "Add Review" to get started.</p>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="bg-surface rounded-2xl border border-outline-variant/30 p-5 shadow-sm flex flex-col md:flex-row gap-5 hover:border-outline-variant/60 transition-colors">
              
              <div className="flex-1 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                  <div className="flex items-center gap-3 flex-1 w-full">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                      {review.author.charAt(0) || 'U'}
                    </div>
                    <input 
                      type="text" 
                      value={review.author} 
                      onChange={e => updateReview(review.id, 'author', e.target.value)}
                      className="font-bold text-on-surface text-lg bg-transparent border-b border-transparent hover:border-outline-variant/30 focus:border-primary outline-none px-1 py-0.5 w-full sm:w-auto transition-colors"
                      placeholder="Reviewer Name"
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex text-amber-400 text-sm">★★★★★</div>
                    <input 
                      type="text" 
                      value={review.date} 
                      onChange={e => updateReview(review.id, 'date', e.target.value)}
                      className="text-xs text-on-surface-variant bg-transparent border-b border-transparent hover:border-outline-variant/30 focus:border-primary outline-none px-1 py-0.5 text-right w-24 transition-colors"
                      placeholder="e.g. 2 months ago"
                      disabled={!canEdit}
                    />
                  </div>
                </div>
                
                <textarea 
                  value={review.content} 
                  onChange={e => updateReview(review.id, 'content', e.target.value)}
                  className="text-sm text-on-surface-variant leading-relaxed italic w-full bg-transparent border border-outline-variant/10 hover:border-outline-variant/30 rounded-lg p-3 focus:border-primary outline-none resize-none min-h-[80px] transition-colors"
                  placeholder="Review content..."
                  disabled={!canEdit}
                />
              </div>

              {canEdit && (
                <div className="flex flex-row md:flex-col items-center justify-center md:justify-center gap-3 border-t md:border-t-0 md:border-l border-outline-variant/20 pt-4 md:pt-0 md:pl-5 w-full md:w-32 shrink-0">
                  <button onClick={() => removeReview(review.id)} className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-bold flex items-center justify-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">delete</span> Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
