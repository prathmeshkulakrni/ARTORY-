import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Heart, MessageCircle, Eye, Search, BadgeCheck, Bot, Users, Upload, Sparkles, GraduationCap, Trophy, Handshake, ArrowRight, Play, Star, TrendingUp, Compass, Zap, Flame, Shield, Award, Palette } from 'lucide-react';
import ImageViewerModal from '../components/ImageViewerModal';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

function ArtCard({ artwork, onDeleted }) {
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
  const artist = artwork.artist;
  const artistId = artist?._id || artist;
  const artistImg = artist?.profileImage ? (artist.profileImage.startsWith('http') ? artist.profileImage : `${API_BASE}${artist.profileImage}`) : null;

  const openArtist = (e) => {
    e.stopPropagation();
    if (artistId) navigate(`/profile/${artistId}`);
  };

  return (
    <>
      <div className="group cursor-pointer flex-shrink-0 w-[260px] animate-slide-up" onClick={() => setIsModalOpen(true)}>
        <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden mb-5 bg-surface/20 border border-white/5 shadow-2xl transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-primary/20 group-hover:border-primary/30">
          <img
            src={imgSrc}
            alt={artwork.title}
            className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
            loading="lazy"
            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="absolute top-4 left-4">
             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark/60 backdrop-blur-xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-y-2 group-hover:translate-y-0">
                <Sparkles size={10}/> {artwork.category}
             </div>
          </div>

          <div className="absolute bottom-5 left-5 right-5 flex justify-between items-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-black text-white shadow-inner">
                   {artwork.artist?.username?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                   <p className="text-[10px] font-black text-white truncate max-w-[100px] leading-none">{artwork.artist?.username}</p>
                   <p className="text-[8px] font-black text-primary uppercase tracking-widest mt-1">Artist</p>
                </div>
             </div>
             <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white">
                <ArrowRight size={14}/>
             </div>
          </div>
        </div>
        
        <div className="px-4">
          <button onClick={openArtist} className="mb-3 flex w-full items-center gap-3 text-left group/artist">
            <span className="w-9 h-9 rounded-xl bg-primary/10 border border-white/10 overflow-hidden flex items-center justify-center text-xs font-black text-primary shrink-0">
              {artistImg ? <img src={artistImg} alt="" className="w-full h-full object-cover" /> : artist?.username?.[0]?.toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-black text-white truncate group-hover/artist:text-primary transition-colors">{artist?.username || 'Artist'}</span>
              <span className="block text-[8px] font-black uppercase tracking-widest text-gray-500">View profile</span>
            </span>
          </button>
          <h3 className="font-black text-base text-white truncate tracking-tight group-hover:text-primary transition-colors">{artwork.title}</h3>
          <div className="flex items-center gap-5 mt-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">
            <button onClick={handleLike} className={`flex items-center gap-2 transition-all ${liked ? 'text-primary scale-110' : 'hover:text-primary'}`}>
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} /> {likeCount}
            </button>
            <span className="flex items-center gap-2"><MessageCircle size={14} /> {artwork.comments?.length || 0}</span>
            <span className="flex items-center gap-2"><Eye size={14} /> {artwork.views || 0}</span>
          </div>
        </div>
      </div>
      <ImageViewerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} artwork={artwork} onDeleted={onDeleted} />
    </>
  );
}

const topCommunities = [
  { name: 'Neo-Surrealism', members: '12.5K Artists', color: 'from-blue-500/20 to-cyan-400/20', iconColor: 'text-blue-400', emoji: '🌌' },
  { name: 'Cyber-Concept', members: '8.3K Architects', color: 'from-purple-500/20 to-pink-400/20', iconColor: 'text-purple-400', emoji: '🚀' },
  { name: 'Avatar Genesis', members: '15.2K Creators', color: 'from-orange-500/20 to-rose-400/20', iconColor: 'text-orange-400', emoji: '🎭' },
  { name: 'Void Sculpting', members: '6.7K Masters', color: 'from-teal-500/20 to-emerald-400/20', iconColor: 'text-teal-400', emoji: '🏺' },
];

export default function Feed() {
  const { user } = useAuth();
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchFeed = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/artwork/feed?page=${p}&limit=12`);
      setArtworks(prev => p === 1 ? res.data.artworks : [...prev, ...res.data.artworks]);
      setTotalPages(res.data.pages);
    } catch (err) { toast.error('Connection to Void failed'); }
    finally { setLoading(false); }
  };

  const handleArtworkDeleted = (artworkId) => {
    setArtworks(prev => prev.filter(art => art._id !== artworkId));
  };

  useEffect(() => { fetchFeed(); }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-fade-in pb-20 px-4 lg:px-0 selection:bg-primary selection:text-white">
      {/* Dynamic Header & AI Insight Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Top Banner */}
        <div className="lg:col-span-8 relative overflow-hidden rounded-[3rem] bg-dark-card border border-white/5 min-h-[450px] shadow-2xl group">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?auto=format&fit=crop&q=80&w=1400"
              alt="Hero Art"
              className="w-full h-full object-cover opacity-30 group-hover:scale-110 transition-transform duration-[3000ms]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
          </div>

          <div className="relative z-10 p-12 md:p-16 flex flex-col justify-center h-full max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em] w-fit animate-pulse">
              <Zap size={14}/> New Updates
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.9] tracking-tighter">
              Expand Your <br/>
              <span className="text-primary italic">Creative</span> <br/>
              Dominion.
            </h1>
            
            <p className="text-gray-400 text-lg md:text-xl font-medium leading-relaxed max-w-lg">
              Welcome back, {user?.username}. The community has evolved. Engage with new artists and master the gallery.
            </p>
            
            <div className="flex flex-wrap gap-5 pt-4">
              <button
                onClick={() => navigate('/explore')}
                className="bg-gradient-to-r from-primary to-accent text-white font-black px-10 py-5 rounded-[1.5rem] shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-95 transition-all text-[11px] uppercase tracking-[0.2em]"
              >
                Enter The Void
              </button>
              <button
                onClick={() => navigate('/upload')}
                className="bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 font-black px-10 py-5 rounded-[1.5rem] transition-all active:scale-95 text-[11px] uppercase tracking-[0.2em] flex items-center gap-3"
              >
                Gallery Vision <Upload size={18} />
              </button>
            </div>
          </div>
          
          {/* Floating Live Indicator */}
          <div className="absolute top-10 right-10 hidden xl:flex flex-col items-end gap-3">
             <div className="flex items-center gap-3 bg-dark/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <p className="text-[10px] font-black text-white uppercase tracking-widest">5.2K Live Artists</p>
             </div>
             <div className="bg-primary/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl flex items-center gap-4 text-white">
                <Award size={24}/>
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Current Challenge</p>
                   <p className="text-sm font-black">Neo-Noir Portraits</p>
                </div>
             </div>
          </div>
        </div>

        {/* AI Mentor Integration */}
        <div className="lg:col-span-4 bg-dark-card border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-[80px] transition-all group-hover:bg-primary/10" />
          
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Bot size={32} className="text-primary" />
              </div>
              <div className="flex -space-x-3">
                 {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-4 border-dark bg-surface flex items-center justify-center overflow-hidden">
                       <img src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-full h-full object-cover" />
                    </div>
                 ))}
                 <div className="w-10 h-10 rounded-full border-4 border-dark bg-surface flex items-center justify-center text-[10px] font-black text-primary">
                    +42
                 </div>
              </div>
            </div>
            
            <div>
               <h3 className="font-black text-white text-3xl mb-3 tracking-tighter">AI Mentor</h3>
               <p className="text-gray-500 font-bold text-[11px] uppercase tracking-[0.2em] mb-4">AI Cognitive Guidance</p>
               <p className="text-sm text-gray-400 font-medium leading-relaxed">
                  Use AI feedback to improve your art.
               </p>
            </div>
            
            <div className="space-y-3">
               {[
                 { label: 'Palette Optimization', icon: Palette, color: 'text-orange-400' },
                 { label: 'Explore', icon: Compass, color: 'text-blue-400' },
                 { label: 'Lighting Feedback', icon: Zap, color: 'text-yellow-400' }
               ].map((mod, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-dark/40 border border-white/5 group/mod hover:border-primary/40 transition-all cursor-pointer">
                     <div className="flex items-center gap-3">
                        <mod.icon size={16} className={mod.color}/>
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">{mod.label}</span>
                     </div>
                     <ArrowRight size={14} className="text-gray-700 group-hover/mod:text-primary transition-colors"/>
                  </div>
               ))}
            </div>
          </div>
          
          <button
            onClick={() => navigate('/ai-mentor')}
            className="mt-10 w-full bg-primary text-white font-black py-5 rounded-[1.5rem] hover:shadow-2xl hover:shadow-primary/40 transition-all active:scale-95 text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 group/btn"
          >
            Access Insights <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>

      {/* Featured Gallery */}
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 px-2">
          <div>
            <div className="inline-flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-3">
               <Flame size={14}/> Trending Pulse
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter">Featured <span className="text-primary italic">Art</span></h2>
          </div>
          <button onClick={() => navigate('/explore')} className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:underline flex items-center gap-3 group bg-primary/10 px-6 py-3 rounded-xl border border-primary/20">
            View All Documentation <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {loading && artworks.length === 0 ? (
          <div className="flex gap-8 overflow-hidden px-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[260px] animate-pulse">
                <div className="aspect-[3/4] rounded-[2.5rem] bg-surface/20 mb-6" />
                <div className="h-4 bg-surface/20 rounded-full w-3/4 mb-3" />
                <div className="h-3 bg-surface/20 rounded-full w-1/2" />
              </div>
            ))}
          </div>
        ) : artworks.length === 0 ? (
          <div className="text-center py-32 bg-dark-card rounded-[4rem] border-2 border-dashed border-dark-border/40">
            <div className="w-24 h-24 bg-surface rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
               <Compass size={44} className="text-gray-700"/>
            </div>
            <h3 className="text-2xl font-black text-white mb-3">The Gallery is Uncharted.</h3>
            <p className="text-gray-500 font-medium mb-10">Be the first artist to gallery a artwork today.</p>
            <button onClick={() => navigate('/upload')} className="bg-primary text-white font-black px-10 py-4 rounded-xl text-[11px] uppercase tracking-widest shadow-xl shadow-primary/20">Upload Art</button>
          </div>
        ) : (
          <div className="flex gap-8 overflow-x-auto pb-12 hide-scrollbar px-2 -mx-2 snap-x">
            {artworks.slice(0, 10).map(a => <div key={a._id} className="snap-center"><ArtCard artwork={a} onDeleted={handleArtworkDeleted} /></div>)}
            <div className="flex-shrink-0 w-[260px] flex items-center justify-center snap-center">
               <button onClick={() => navigate('/explore')} className="w-20 h-20 rounded-[2rem] bg-dark-card border border-white/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-2xl group hover:scale-110">
                  <ArrowRight size={32} className="group-hover:translate-x-2 transition-transform"/>
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="bg-dark-card border border-white/5 rounded-[4rem] p-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 relative z-10">
          {[
            { icon: Upload, label: 'Upload', desc: 'Save Art', color: 'text-blue-400', route: '/upload' },
            { icon: Bot, label: 'AI Studio', desc: 'Art Tools', color: 'text-primary', route: '/ai-mentor' },
            { icon: Users, label: 'Community', desc: 'Art Community', color: 'text-green-400', route: '/community' },
            { icon: GraduationCap, label: 'Academy', desc: 'Learn Skills', color: 'text-orange-400', route: '/ai-mentor' },
            { icon: Trophy, label: 'Competitions', desc: 'Global Prize', color: 'text-yellow-400', route: '/competitions' },
            { icon: Handshake, label: 'Draw', desc: 'Live Co-Lab', color: 'text-pink-400', route: '/drawing' },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => navigate(item.route)}
              className="flex flex-col items-center text-center p-6 rounded-[2.5rem] hover:bg-white/5 cursor-pointer transition-all duration-500 group/nav"
            >
              <div className="w-16 h-16 rounded-2xl bg-surface/40 flex items-center justify-center mb-4 group-hover/nav:scale-110 group-hover/nav:rotate-6 transition-all duration-500 shadow-xl border border-white/5">
                <item.icon size={28} className={`${item.color} group-hover/nav:scale-110 transition-transform`} />
              </div>
              <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-1.5">{item.label}</h4>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Exploration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
         <div className="lg:col-span-8 space-y-12">
            <div className="flex items-center justify-between px-2">
               <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-4">
                  Gallery <span className="text-primary italic">Stream</span> <Sparkles size={24} className="text-primary animate-pulse"/>
               </h2>
               <div className="flex gap-4">
                  {['All', 'Digital', 'Traditional'].map(filter => (
                    <button key={filter} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'All' ? 'bg-primary text-white shadow-lg' : 'bg-surface/40 text-gray-500 hover:text-white'}`}>
                       {filter}
                    </button>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {artworks.map((a, idx) => {
                const imgSrc = a.imageUrl?.startsWith('http') ? a.imageUrl : `${API_BASE}${a.imageUrl}`;
                const artistImg = a.artist?.profileImage ? (a.artist.profileImage.startsWith('http') ? a.artist.profileImage : `${API_BASE}${a.artist.profileImage}`) : null;
                return (
                  <div key={a._id} className="group bg-dark-card border border-white/5 rounded-[3rem] p-6 cursor-pointer hover:border-primary/40 transition-all duration-500 shadow-2xl animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }} onClick={() => navigate('/explore')}>
                    <div className="relative aspect-[16/11] overflow-hidden rounded-[2.5rem] mb-6 shadow-inner">
                      <img src={imgSrc} alt={a.title} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 backdrop-blur-xl border border-primary/40 flex items-center justify-center font-black text-primary">
                               {a.artist?.username?.[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                               <p className="text-xs font-black text-white truncate">{a.artist?.username}</p>
                               <p className="text-[9px] font-black text-primary uppercase tracking-widest">Master</p>
                            </div>
                         </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 px-2">
                      <div className="flex justify-between items-start">
                         <h3 className="font-black text-xl text-white tracking-tight group-hover:text-primary transition-colors truncate flex-1">{a.title}</h3>
                         <div className="flex items-center gap-4 text-gray-500 font-black text-[10px]">
                            <span className="flex items-center gap-1.5"><Heart size={14} className="text-primary"/> {a.likes?.length || 0}</span>
                         </div>
                      </div>
                      <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity">Discover the depth of this artwork in the exploration gallery.</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (a.artist?._id) navigate(`/profile/${a.artist._id}`); }}
                        className="flex items-center gap-3 pt-2 text-left group/artist"
                      >
                        <span className="w-9 h-9 rounded-xl bg-primary/10 border border-white/10 overflow-hidden flex items-center justify-center text-xs font-black text-primary shrink-0">
                          {artistImg ? <img src={artistImg} alt="" className="w-full h-full object-cover" /> : a.artist?.username?.[0]?.toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-black text-white truncate group-hover/artist:text-primary transition-colors">{a.artist?.username || 'Artist'}</span>
                          <span className="block text-[8px] font-black uppercase tracking-widest text-gray-500">View profile</span>
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {page < totalPages && (
              <div className="text-center pt-8">
                <button onClick={() => { setPage(p => p + 1); fetchFeed(page + 1); }} className="px-16 py-6 rounded-[2rem] bg-surface/20 border border-white/5 text-white font-black text-[11px] uppercase tracking-[0.3em] hover:bg-primary hover:border-primary shadow-2xl transition-all active:scale-95 group">
                   Load More <span className="text-primary group-hover:text-white transition-colors">Artworks</span>
                </button>
              </div>
            )}
         </div>

         {/* Sidebar */}
         <div className="lg:col-span-4 space-y-12">
            <div className="space-y-8">
               <div className="flex items-center justify-between px-2">
                  <h2 className="text-2xl font-black text-white tracking-tighter">Art <span className="text-primary italic">Community</span></h2>
                  <Users size={20} className="text-gray-700"/>
               </div>
               <div className="bg-dark-card border border-white/5 rounded-[3rem] p-6 shadow-2xl space-y-4">
                 {topCommunities.map((c, idx) => (
                   <div
                     key={idx}
                     onClick={() => navigate('/community')}
                     className="flex items-center gap-5 p-5 rounded-[2rem] hover:bg-surface/40 cursor-pointer transition-all duration-500 group border border-transparent hover:border-white/5"
                   >
                     <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center text-3xl shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-3`}>
                       {c.emoji}
                     </div>
                     <div className="flex-1 min-w-0">
                       <h4 className="font-black text-base text-white group-hover:text-primary transition-colors tracking-tight">{c.name}</h4>
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1.5">{c.members}</p>
                     </div>
                     <div className="w-10 h-10 rounded-xl bg-surface/60 flex items-center justify-center text-gray-700 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                        <ArrowRight size={18} />
                     </div>
                   </div>
                 ))}
               </div>
            </div>


         </div>
      </div>
    </div>
  );
}
