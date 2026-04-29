import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

type ReviewStatus = 'pending' | 'approved' | 'featured';

interface Review {
  id: string;
  author: string;
  location: string;
  rating: number;
  content: string;
  status: ReviewStatus;
  date: string;
}

const DUMMY_REVIEWS: Review[] = [
  { id: '1', author: 'Eleanor Vance', location: 'Santorini, Greece', rating: 5, content: 'Absolutely breathtaking experience. The attention to detail from the JourneyFlicker team made our honeymoon unforgettable.', status: 'featured', date: 'Oct 20, 2026' },
  { id: '2', author: 'Marcus Sterling', location: 'Kyoto, Japan', rating: 5, content: 'A masterclass in cultural immersion. The private tea ceremony was the highlight of our trip.', status: 'approved', date: 'Oct 15, 2026' },
  { id: '3', author: 'Sarah Jenkins', location: 'Swiss Alps', rating: 4, content: 'Beautiful scenery and great hotels, though the weather was a bit unpredictable on the second day. Still highly recommended.', status: 'pending', date: 'Oct 12, 2026' },
  { id: '4', author: 'David Chen', location: 'Maldives', rating: 5, content: 'Literal paradise. Everything was seamless from the seaplane transfer to the overwater villa.', status: 'featured', date: 'Sep 28, 2026' },
];

export default function AdminReviews() {
  const { canEdit } = useOutletContext<{ canEdit: boolean }>();
  const [filter, setFilter] = useState<'all' | ReviewStatus>('all');
  const [reviews, setReviews] = useState<Review[]>(DUMMY_REVIEWS);

  const filteredReviews = reviews.filter(r => filter === 'all' || r.status === filter);

  const updateStatus = (id: string, newStatus: ReviewStatus) => {
    if (!canEdit) return;
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    featured: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-on-surface tracking-tight">Reviews & Testimonials</h2>
          <p className="text-on-surface-variant text-sm mt-1">Curate customer feedback and select featured testimonials for the homepage.</p>
        </div>
        <div className="flex bg-surface rounded-full border border-outline-variant/30 p-1 shadow-sm">
          {(['all', 'pending', 'approved', 'featured'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-colors ${
                filter === f ? 'bg-on-surface text-surface shadow-md' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-outline-variant/30 p-12 text-center shadow-sm">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">reviews</span>
            <p className="text-on-surface-variant">No reviews found for this filter.</p>
          </div>
        ) : (
          filteredReviews.map(review => (
            <div key={review.id} className="bg-surface rounded-2xl border border-outline-variant/30 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-5">
              
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface text-lg">{review.author}</h3>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {review.location} • {review.date}
                    </div>
                  </div>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined" style={{ fontVariationSettings: i < review.rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed italic">"{review.content}"</p>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 border-t md:border-t-0 md:border-l border-outline-variant/20 pt-4 md:pt-0 md:pl-5 w-full md:w-48">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[review.status]}`}>
                  {review.status}
                </span>

                {canEdit && (
                  <div className="flex gap-2 w-full md:w-auto md:mt-auto">
                    {review.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(review.id, 'approved')} className="flex-1 md:flex-none px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs font-bold shadow-sm" title="Approve">
                          <span className="material-symbols-outlined text-sm block">check</span>
                        </button>
                        <button className="flex-1 md:flex-none px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-bold" title="Reject/Delete">
                          <span className="material-symbols-outlined text-sm block">close</span>
                        </button>
                      </>
                    )}
                    {review.status === 'approved' && (
                      <button onClick={() => updateStatus(review.id, 'featured')} className="w-full px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-xs">auto_awesome</span> Feature
                      </button>
                    )}
                    {review.status === 'featured' && (
                      <button onClick={() => updateStatus(review.id, 'approved')} className="w-full px-3 py-1.5 bg-surface-container-low text-on-surface-variant rounded-lg hover:bg-surface-container transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                        Un-Feature
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
