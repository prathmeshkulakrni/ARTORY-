import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Heart, MessageCircle, Eye, Search, BadgeCheck } from 'lucide-react';

import ImageViewerModal from '../components/ImageViewerModal';

const API_BASE = 'http://localhost:5000';

function ArtCard({ artwork }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(artwork.likes?.includes(user?._id));
  const [likeCount, setLikeCount] = useState(artwork.likes?.length || 0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/artwork/${artwork._id}/like`);
      setLiked(res.data.liked);
      setLikeCount(res.data.likes);
    } catch (err) { toast.error('Failed to like'); }
  };

  const imgSrc = artwork.imageUrl?.startsWith('http') ? artwork.imageUrl : `${API_BASE}${artwork.imageUrl}`;
  const artistImg = artwork.artist?.profileImage
    ? (artwork.artist.profileImage.startsWith('http') ? artwork.artist.profileImage : `${API_BASE}${artwork.artist.profileImage}`)
    : null;

  return (
    <>
      <div className="card overflow-hidden group animate-fade-in cursor-pointer" onClick={() => setIsModalOpen(true)}>
        <div className="relative overflow-hidden rounded-xl mb-3">
          <img src={imgSrc} alt={artwork.title} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="badge bg-primary/80 text-white">{artwork.category}</span>
            <span className="text-xs text-white/80 flex items-center gap-1"><Eye size={12} /> {artwork.views || 0}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          {artistImg ? (
            <img src={artistImg} className="w-9 h-9 avatar" alt="" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${artwork.artist?._id}`); }} />
          ) : (
            <div className="w-9 h-9 avatar bg-primary/30 flex items-center justify-center text-sm font-bold text-primary" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${artwork.artist?._id}`); }}>
              {artwork.artist?.username?.[0]?.toUpperCase() || 'A'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm truncate">{artwork.title}</h3>
            <button className="text-xs text-gray-500 hover:text-primary" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${artwork.artist?._id}`); }}>
              {artwork.artist?.username}
            </button>
            <p className="text-xs text-gray-500">{new Date(artwork.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {artwork.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{artwork.description}</p>}

        <div className="flex items-center gap-4 pt-3 border-t border-dark-border">
          <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}>
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} /> {likeCount}
          </button>
          <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors">
            <MessageCircle size={16} /> {artwork.comments?.length || 0}
          </button>
        </div>
      </div>
      <ImageViewerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} artwork={artwork} />
    </>
  );
}

export default function Feed() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const navigate = useNavigate();

  const fetchFeed = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/artwork/feed?page=${p}&limit=12`);
      setArtworks(prev => p === 1 ? res.data.artworks : [...prev, ...res.data.artworks]);
      setTotalPages(res.data.pages);
    } catch (err) { toast.error('Failed to load feed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFeed(); }, []);

  const searchUsers = async (e) => {
    e.preventDefault();
    if (!userSearch.trim()) return setUserResults([]);
    try {
      const { data } = await api.get(`/auth/search?q=${encodeURIComponent(userSearch.trim())}`);
      setUserResults(data);
    } catch {
      toast.error('Failed to search users');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Feed</h1>
          <p className="text-gray-400 mt-1">Discover amazing artworks from the community</p>
        </div>
      </div>

      <form onSubmit={searchUsers} className="relative mb-4">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search users by username..." className="input pl-12 py-3.5" />
      </form>
      {userResults.length > 0 && (
        <div className="card mb-8 space-y-2">
          {userResults.map((result) => (
            <button key={result._id} onClick={() => navigate(`/profile/${result._id}`)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-dark hover:bg-[#2a2b2f] text-left">
              {result.profileImage ? <img src={result.profileImage.startsWith('http') ? result.profileImage : `${API_BASE}${result.profileImage}`} className="w-10 h-10 avatar object-cover" alt="" /> : <div className="w-10 h-10 avatar bg-primary/30 flex items-center justify-center text-primary font-bold">{result.username?.[0]?.toUpperCase()}</div>}
              <span className="font-semibold text-white flex items-center gap-1">{result.username}{result.isVerified && <BadgeCheck size={16} className="text-blue-500" />}</span>
            </button>
          ))}
        </div>
      )}

      {loading && artworks.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : artworks.length === 0 ? (
        <div className="text-center py-20 card">
          <p className="text-6xl mb-4">🎨</p>
          <h3 className="text-xl font-bold text-white mb-2">No artworks yet</h3>
          <p className="text-gray-400">Be the first to upload something amazing!</p>
        </div>
      ) : (
        <>
          <div className="art-grid">
            {artworks.map(a => <ArtCard key={a._id} artwork={a} />)}
          </div>
          {page < totalPages && (
            <div className="text-center mt-8">
              <button onClick={() => { setPage(p => p + 1); fetchFeed(page + 1); }} className="btn-outline">Load More</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
