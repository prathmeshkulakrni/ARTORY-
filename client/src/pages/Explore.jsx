import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Filter, Heart, Bookmark, Search, Compass, Sparkles, SlidersHorizontal, ArrowRight, Palette } from 'lucide-react';
import ImageViewerModal from '../components/ImageViewerModal';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';
const cats = ['all','digital art','watercolor','illustration','3d art','photography','comic', 'sketch', 'surrealism', 'abstract'];

export default function Explore() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [artworks, setArtworks] = useState([]);
  const [cat, setCat] = useState('all');
  const [searchTerm, setSearchTerm] = useState(query);
  const [loading, setLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  const fetch_ = async () => {
    setLoading(true);
    try {
      let res;
      if (query) {
        res = await api.get(`/artwork/search?q=${query}`);
      } else if (cat === 'all') {
        res = await api.get('/artwork/feed?limit=40');
      } else {
        res = await api.get(`/artwork/category/${cat.replace(' ', '-')}`);
      }
      setArtworks(res.data.artworks || res.data || []);
    } catch { 
      toast.error('The Gallery is currently unreachable'); 
    } finally {
      setLoading(false);
    }
  };

  const handleArtworkDeleted = (artworkId) => {
    setArtworks(prev => prev.filter(art => art._id !== artworkId));
    setSelectedArtwork(null);
  };

  useEffect(() => { 
    fetch_(); 
  }, [cat, query]);

  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  const handleGallerySearch = (event) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    navigate(trimmed ? `/explore?q=${encodeURIComponent(trimmed)}` : '/explore');
  };

  const sortedArtworks = [...artworks].sort((a, b) => {
    if (sortBy === 'likes') {
      return (b.likes?.length || 0) - (a.likes?.length || 0);
    }
    if (sortBy === 'alpha') {
      return (a.title || '').localeCompare(b.title || '');
    }
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeB !== timeA) return timeB - timeA;
    return (b._id || '').localeCompare(a._id || '');
  });

  return (
    <div className="animate-fade-in flex flex-col min-h-screen pb-20 selection:bg-primary selection:text-white">
      {/* Header & Advanced Search Integration */}
      <div className="flex-shrink-0 z-20 relative space-y-10 mb-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
               <Compass size={14}/> Discovery Module
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9]">
              {query ? (
                <><span className="text-gray-500">Query:</span> {query}</>
              ) : (
                <>Gallery <span className="text-primary italic">Exploration</span></>
              )}
            </h1>
            <p className="text-gray-400 font-medium text-lg max-w-xl leading-relaxed">
              Explore artwork shared by artists in the community.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end px-6 py-3 border-r border-white/5">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Documentation</p>
                <p className="text-2xl font-black text-white tracking-tight">{artworks.length || '---'} Items</p>
             </div>
             <button 
               type="button"
               onClick={() => setShowFilters(!showFilters)}
               className={`h-16 px-8 rounded-2xl bg-surface/40 backdrop-blur-xl border border-white/5 text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-surface/60 flex items-center gap-3 transition-all hover:border-primary/40 group ${showFilters ? 'ring-2 ring-primary/60 border-primary/40' : ''}`}
             >
                <SlidersHorizontal size={18} className="group-hover:rotate-90 transition-transform" /> Art Filters
             </button>
          </div>
        </div>

        <form onSubmit={handleGallerySearch} className="relative max-w-2xl">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full bg-surface/30 border-2 border-white/5 rounded-2xl pl-14 pr-6 py-4 text-xs font-black text-white placeholder-gray-700 focus:outline-none focus:border-primary/50 focus:bg-surface/50 transition-all uppercase tracking-widest"
            placeholder="Search by post title or artist username..."
          />
        </form>

        {showFilters && (
          <div className="bg-[#0c0d0f]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl animate-slide-down flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl relative overflow-hidden group/filter">
            <div className="absolute inset-0 bg-primary/5 opacity-40 blur-[80px]" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] pl-1">Sort Architecture</span>
              <div className="flex bg-dark/60 p-1.5 rounded-xl border border-white/5 shadow-inner">
                {[
                  { id: 'newest', label: 'Newest First' },
                  { id: 'likes', label: 'Popularity' },
                  { id: 'alpha', label: 'Alphabetical' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSortBy(opt.id)}
                    className={`px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${sortBy === opt.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[9px] bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
              <Sparkles size={12}/> {sortBy === 'newest' ? 'chronological matrix' : sortBy === 'likes' ? 'popularity matrix' : 'lexical ordering'}
            </div>
          </div>
        )}

        {/* Dynamic Category Navigation */}
        <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar -mx-4 px-4 mask-fade-right">
          {cats.map(c=>(
            <button 
              key={c} 
              onClick={()=>{setCat(c);}}
              className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-500 border snap-center ${
                cat === c 
                  ? 'bg-gradient-to-r from-primary to-accent text-white border-primary shadow-2xl shadow-primary/30 scale-105' 
                  : 'bg-surface/20 text-gray-500 border-white/5 hover:text-white hover:bg-surface/40 hover:border-white/10'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      
      {/* High-Contrast Aesthetic Grid */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-[1.5rem] animate-spin"/>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">Loading Gallery...</p>
          </div>
        ) : artworks.length === 0 ? (
          <div className="text-center py-32 bg-dark-card border border-white/5 rounded-[4rem] shadow-2xl">
            <div className="w-24 h-24 bg-surface rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner ring-1 ring-white/5">
               <Palette size={44} className="text-gray-700"/>
            </div>
            <h3 className="text-3xl font-black text-white mb-3 tracking-tighter">No Documentation Found.</h3>
            <p className="text-gray-500 font-medium mb-10 max-w-sm mx-auto">The parameters provided do not match any existing gallerys in the current dominion.</p>
            <button onClick={() => setCat('all')} className="bg-primary text-white font-black px-10 py-5 rounded-2xl text-[11px] uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 transition-all">Reset Exploration</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            {sortedArtworks.map((art, idx) => {
              const imgUrl = art.imageUrl?.startsWith('http') ? art.imageUrl : `${API_BASE}${art.imageUrl}`;
              const isLiked = art.likes?.includes(user?._id);
              
              return (
                <div key={idx} className="group cursor-pointer flex flex-col animate-slide-up" style={{ animationDelay: `${idx * 40}ms` }} onClick={() => setSelectedArtwork(art)}>
                  <div className="relative rounded-[2.5rem] overflow-hidden mb-6 aspect-[3/4] bg-dark-card border border-white/5 shadow-2xl transition-all duration-700 group-hover:-translate-y-3 group-hover:shadow-primary/20 group-hover:border-primary/40">
                    <img
                      src={imgUrl}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
                      loading="lazy"
                    />
                    
                    {/* Floating UI Elements */}
                    <div className="absolute top-5 left-5 right-5 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-y-4 group-hover:translate-y-0">
                       <div className="px-3 py-1.5 rounded-xl bg-dark/60 backdrop-blur-xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-primary">
                          {art.category}
                       </div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-dark/95 via-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                       <div className="flex flex-col gap-4 w-full">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center font-black text-primary text-xs">
                                {art.artist?.username?.[0]?.toUpperCase()}
                             </div>
                             <div className="min-w-0">
                                <p className="text-xs font-black text-white truncate leading-none mb-1">{art.artist?.username}</p>
                                <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Artist</p>
                             </div>
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                             <button className="flex-1 h-12 rounded-xl bg-primary text-white flex items-center justify-center gap-2 hover:bg-accent transition-all">
                               <Heart size={16} fill={isLiked ? "white" : "none"} />
                               <span className="text-[10px] font-black uppercase tracking-widest">{art.likes?.length || 0}</span>
                             </button>
                             <button className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10">
                               <Bookmark size={18} />
                             </button>
                          </div>
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 px-4">
                    <h3 className="font-black text-lg text-white truncate tracking-tight group-hover:text-primary transition-colors">{art.title}</h3>
                    <div className="flex items-center justify-between">
                       <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Gallery ID: #{art._id?.slice(-6)}</p>
                       <div className="flex items-center gap-2 text-primary">
                          <Sparkles size={12}/>
                          <span className="text-[9px] font-black uppercase tracking-widest">Verified</span>
                       </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ImageViewerModal isOpen={!!selectedArtwork} onClose={() => setSelectedArtwork(null)} artwork={selectedArtwork} onDeleted={handleArtworkDeleted} />
    </div>
  );
}
