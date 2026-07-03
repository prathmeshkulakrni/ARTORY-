import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import api from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

function Avatar({ user }) {
  const img = user?.profileImage
    ? (user.profileImage.startsWith('http') ? user.profileImage : `${API_BASE}${user.profileImage}`)
    : null;
  return img ? (
    <img src={img} alt="" className="w-9 h-9 rounded-full object-cover" />
  ) : (
    <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
      {user?.username?.[0]?.toUpperCase() || 'A'}
    </div>
  );
}

export default function ArtistReviewSection({ artistId }) {
  const [data, setData] = useState({ averageRating: 0, count: 0, reviews: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artistId) return;
    api.get(`/marketplace/artists/${artistId}/reviews`)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [artistId]);

  if (loading) return <div className="text-sm text-gray-500">Loading reviews...</div>;

  return (
    <div className="bg-[#13141C] rounded-3xl p-6 mx-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-white">Marketplace Reviews</h3>
          <p className="text-sm text-gray-500">{data.count} public review{data.count === 1 ? '' : 's'}</p>
        </div>
        <div className="flex items-center gap-2 text-amber-300 font-bold">
          <Star size={18} fill="currentColor" />
          {data.averageRating || '0.0'}
        </div>
      </div>

      {data.reviews.length === 0 ? (
        <p className="text-sm text-gray-500">No marketplace feedback yet.</p>
      ) : (
        <div className="space-y-4">
          {data.reviews.map(review => (
            <div key={review._id} className="border border-dark-border rounded-2xl p-4 bg-dark/40">
              <div className="flex items-start gap-3">
                <Avatar user={review.reviewer} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-white">{review.reviewer?.username}</p>
                    <span className="text-xs text-gray-500">for {review.request?.title}</span>
                  </div>
                  <div className="flex gap-0.5 my-1 text-amber-300">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{review.review}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
