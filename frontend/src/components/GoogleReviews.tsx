import { useMemo, useState, useEffect } from 'react';
import { api } from '../lib/api';

export function GoogleReviews({ max = 4 }: { max?: number }) {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    api.getReviews()
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(err => console.error("Failed to load reviews:", err));
  }, []);
  // Randomly select 'max' reviews
  const randomReviews = useMemo(() => {
    if (!reviews.length) return [];
    const shuffled = [...reviews].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, max);
  }, [max, reviews]);

  if (!reviews.length) return null;

  return (
    <div className="py-12 border-t border-outline-variant/20 mt-16">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md p-2.5">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </div>
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-on-surface">Excellent</h3>
          <div className="flex items-center gap-2">
            <div className="flex text-amber-400 text-lg">
              ★★★★★
            </div>
            <span className="text-sm text-on-surface-variant font-medium">Based on Google Reviews</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {randomReviews.map(review => (
          <div key={review.id} className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                {review.author.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-sm text-on-surface">{review.author}</div>
                <div className="text-[11px] text-on-surface-variant">{review.date}</div>
              </div>
            </div>
            <div className="flex text-amber-400 text-sm mb-3">★★★★★</div>
            <p className="text-sm text-on-surface-variant leading-relaxed flex-1">
              "{review.content}"
            </p>
            <div className="mt-4 pt-4 border-t border-outline-variant/10 flex items-center gap-1.5 opacity-60">
              <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant">Posted on Google</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
