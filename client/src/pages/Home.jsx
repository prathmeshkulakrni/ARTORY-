import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Sparkles, Bot, PenTool, Heart, ArrowRight, Users, Trophy, GraduationCap, Upload, Handshake, Zap, TrendingUp, Palette, Compass, MessageCircle, Globe, ShieldCheck, Command, BadgeCheck, ZapOff, Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ArtoryLogo from '../components/ArtoryLogo';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

const categories = [
  { name: "Digital Art", count: "12.6k artworks", icon: Sparkles, color: "text-blue-400", bg: "from-blue-500/20 to-blue-600/10" },
  { name: "Concept Art", count: "8.7k designs", icon: Palette, color: "text-purple-400", bg: "from-purple-500/20 to-purple-600/10" },
  { name: "Illustration", count: "15.3k stories", icon: PenTool, color: "text-orange-400", bg: "from-orange-500/20 to-orange-600/10" },
  { name: "AI Mentor", count: "AI Help", icon: Bot, color: "text-green-400", bg: "from-green-500/20 to-green-600/10" },
  { name: "Character Art", count: "9.8k designs", icon: User, color: "text-pink-400", bg: "from-pink-500/20 to-pink-600/10" },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleTheme } = useTheme();
  const [trendingArtworks, setTrendingArtworks] = useState([]);
  const [loadingArt, setLoadingArt] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/artwork/public`)
      .then(r => r.json())
      .then(data => setTrendingArtworks(data.artworks || []))
      .catch(() => {})
      .finally(() => setLoadingArt(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0c0d0f] text-white font-sans selection:bg-primary selection:text-white pb-32">
      {/* Art Link Navbar */}
      <nav className="sticky top-0 z-[100] bg-dark/40 backdrop-blur-3xl border-b border-white/5 shadow-2xl">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-10 py-6">
          <div className="flex items-center gap-16">
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
              <ArtoryLogo size={56} />
            </div>
            
            <div className="hidden xl:flex gap-12 text-[11px] font-black uppercase tracking-[0.4em] text-gray-500">
              {['Explore', 'Community', 'Competition', 'Gallery'].map((item) => (
                <button 
                  key={item} 
                  onClick={() => navigate(`/${item.toLowerCase().replace('competition', 'competitions').replace('gallery', 'art-history')}`)}
                  className="hover:text-primary transition-all relative group py-2"
                >
                  {item}
                  <div className="absolute -bottom-1 left-0 right-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full shadow-[0_0_10px_rgba(124,58,237,0.5)]" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-5 bg-surface/30 border-2 border-white/5 rounded-2xl px-6 py-3 group focus-within:border-primary/50 transition-all duration-500 shadow-inner">
               <Search size={18} className="text-gray-600 group-focus-within:text-primary transition-colors"/>
               <input placeholder="Search artists..." className="bg-transparent border-none focus:ring-0 text-xs w-48 text-white placeholder-gray-700 font-black uppercase tracking-widest"/>
            </div>
            
            <button 
              onClick={() => navigate(user ? '/feed' : '/login')}
              className="flex items-center gap-4 pl-3 pr-6 py-2.5 rounded-[1.75rem] bg-surface/40 border-2 border-white/5 hover:border-primary/40 transition-all group shadow-2xl"
            >
              <div className="w-11 h-11 rounded-[1.25rem] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform overflow-hidden shadow-inner border border-white/10 relative">
                {user?.profileImage ? (
                  <img src={user.profileImage.startsWith('http') ? user.profileImage : `${API_BASE}${user.profileImage}`} className="w-full h-full object-cover" alt=""/>
                ) : (
                  <User size={22} />
                )}
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-left">
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-300 group-hover:text-white transition-colors block">
                  {user ? user.username : 'Start'}
                </span>
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{user ? 'Artist Member' : 'Guest Access'}</span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-10">
        {/* Massive Art Hero Section */}
        <div className="flex flex-col lg:flex-row items-center mt-32 mb-48 gap-24 relative">
          <div className="absolute top-0 -left-20 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] -z-10 animate-pulse" />
          <div className="absolute bottom-0 -right-20 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] -z-10 animate-pulse delay-1000" />
          
          <div className="flex-1 space-y-12 z-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.4em] animate-fade-in shadow-2xl">
              <Zap size={16} className="animate-bounce" /> Decentralized Creative Network
            </div>
            
            <h1 className="text-7xl md:text-[7.5rem] font-black leading-[0.85] tracking-tighter text-white animate-slide-up selection:bg-accent">
              Start Your <br/>
              <span className="text-primary italic relative">
                 Art
                 <div className="absolute -bottom-4 left-0 right-0 h-4 bg-primary/20 blur-xl rounded-full" />
              </span> <br/>
              With the <span className="text-accent underline decoration-primary/30">Future</span>.
            </h1>
            
            <p className="text-gray-400 max-w-xl text-xl leading-relaxed font-medium mx-auto lg:mx-0 animate-slide-up opacity-80" style={{ animationDelay: '100ms' }}>
              Artory helps artists share work, learn with AI, join contests, and meet other artists.
            </p>
            
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start pt-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <button 
                onClick={() => navigate('/explore')} 
                className="bg-gradient-to-r from-primary to-accent text-white font-black px-14 py-6 rounded-[2rem] shadow-[0_20px_40px_rgba(124,58,237,0.4)] hover:shadow-primary/60 hover:-translate-y-2 transition-all active:scale-95 text-xs uppercase tracking-[0.4em] flex items-center gap-4 group/btn"
              >
                Start Exploring <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/register')} 
                className="bg-surface/40 backdrop-blur-3xl border-2 border-white/5 text-white hover:bg-surface/60 font-black px-14 py-6 rounded-[2rem] transition-all active:scale-95 text-xs uppercase tracking-[0.4em] hover:border-primary/40 flex items-center gap-4"
              >
                Join Group <Users size={20} />
              </button>
            </div>
            
            <div className="flex items-center justify-center lg:justify-start gap-12 pt-12">
               <div className="flex -space-x-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-14 h-14 rounded-2xl border-4 border-[#0c0d0f] bg-surface flex items-center justify-center shadow-2xl overflow-hidden">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=creator${i}`} alt="" className="w-full h-full object-cover"/>
                    </div>
                  ))}
                  <div className="w-14 h-14 rounded-2xl border-4 border-[#0c0d0f] bg-primary flex items-center justify-center text-xs font-black shadow-2xl">
                     +50K
                  </div>
               </div>
               <div className="space-y-1">
                  <p className="text-xs font-black text-white uppercase tracking-widest">Global Drawnization Active</p>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">52,481 artists here</p>
               </div>
            </div>
          </div>
          
          <div className="flex-1 relative h-[600px] lg:h-[800px] w-full flex justify-center items-center group animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="absolute inset-0 rounded-[4rem] overflow-hidden shadow-[0_80px_160px_-40px_rgba(0,0,0,0.9)] border-2 border-white/10 p-6 bg-surface/5 backdrop-blur-3xl rotate-3 group-hover:rotate-0 transition-all duration-[1.5s] relative">
              <div className="absolute inset-0 bg-primary/5 opacity-40 animate-pulse" />
              <div className="w-full h-full rounded-[3rem] overflow-hidden relative border border-white/5">
                <img 
                  src="https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?auto=format&fit=crop&q=80&w=1200" 
                  alt="Inspiring Art" 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-[3000ms]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d0f] via-transparent to-transparent opacity-80"></div>
                
                {/* UI Elements */}
                <div className="absolute top-12 left-12 p-8 rounded-[2.5rem] bg-black/60 backdrop-blur-3xl border border-white/10 shadow-2xl animate-float group-hover:bg-primary/20 transition-all duration-700">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                         <TrendingUp size={32}/>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Trending</p>
                         <p className="text-xl font-black text-white tracking-tight">Digital Art</p>
                      </div>
                   </div>
                </div>

                <div className="absolute bottom-12 right-12 p-8 rounded-[2.5rem] bg-primary/90 backdrop-blur-3xl text-white shadow-[0_30px_60px_rgba(124,58,237,0.4)] animate-float border border-white/20" style={{ animationDelay: '1.5s' }}>
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-white/20 flex items-center justify-center shadow-inner">
                         <Trophy size={32}/>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.4em]">Active Competition</p>
                        <p className="text-xl font-black tracking-tight">$12,500 Credits</p>
                      </div>
                   </div>
                </div>
                
                {/* Interactive UI corners */}
                <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-white/20 rounded-tr-3xl" />
                <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-white/20 rounded-bl-3xl" />
              </div>
            </div>
            {/* Background Blur Orbs */}
            <div className="absolute -z-20 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-125 transition-transform duration-1000" />
          </div>
        </div>

        {/* Art Hub Features */}
        <div className="mb-48 relative">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 relative z-10">
            {[
              { icon: Upload, label: 'Upload Art', desc: 'Save and Share', route: '/register' },
              { icon: Bot, label: 'AI Mentor', desc: 'AI Help', route: '/ai-mentor' },
              { icon: Users, label: 'Community', desc: 'Art Community', route: '/community' },
              { icon: GraduationCap, label: 'Lessons', desc: 'Learn Skills', route: '/ai-mentor' },
              { icon: Trophy, label: 'Competitions', desc: 'Art Contests', route: '/competitions' },
              { icon: Handshake, label: 'Work Together', desc: 'Chat Live', route: '/register' },
            ].map((item, idx) => (
              <div key={idx} onClick={() => navigate(item.route)} className="group flex flex-col items-center text-center p-10 rounded-[3rem] bg-dark-card border border-white/5 hover:bg-surface/40 hover:border-primary/40 transition-all duration-700 cursor-pointer shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="w-20 h-20 rounded-[1.5rem] bg-surface/60 border border-white/5 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 shadow-2xl group-hover:shadow-primary/20 relative z-10">
                  <item.icon size={36} className="text-primary group-hover:text-accent transition-colors duration-700" />
                </div>
                <h4 className="text-[12px] font-black text-white uppercase tracking-[0.3em] mb-3 relative z-10">{item.label}</h4>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] leading-relaxed relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Artwork Gallery */}
        <div className="mb-48">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 px-6 gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-1 bg-primary rounded-full" />
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">Picked Messages</p>
               </div>
               <h2 className="text-5xl font-black text-white tracking-tighter flex items-center gap-6">
                  Art <span className="text-primary italic">Gallery</span>
               </h2>
               <p className="text-gray-500 font-medium text-lg">Handpicked art from our community.</p>
            </div>
            <button onClick={() => navigate('/explore')} className="h-16 px-10 rounded-2xl bg-primary/10 border-2 border-primary/20 text-primary font-black text-[11px] uppercase tracking-[0.3em] hover:bg-primary hover:text-white transition-all duration-500 flex items-center gap-4 group/btn shadow-2xl active:scale-95">
              Enter The Void <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
            </button>
          </div>

          {loadingArt ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-6">
                  <div className="aspect-[4/5] rounded-[3rem] bg-surface/40" />
                  <div className="h-4 bg-surface/40 rounded-full w-3/4 mx-auto" />
                  <div className="h-3 bg-surface/40 rounded-full w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          ) : trendingArtworks.length === 0 ? (
            <div className="text-center py-40 bg-dark-card rounded-[4rem] border-2 border-dashed border-white/5 relative group/zero">
               <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/zero:opacity-100 transition-opacity" />
              <div className="w-32 h-32 bg-surface rounded-[2.5rem] border border-white/5 flex items-center justify-center mx-auto mb-10 shadow-2xl relative z-10">
                 <Compass size={56} className="text-gray-700 group-hover/zero:text-primary transition-all duration-700"/>
              </div>
              <h3 className="text-3xl font-black text-white mb-4 tracking-tighter relative z-10">No Art Yet</h3>
              <p className="text-gray-500 font-medium text-lg mb-12 relative z-10">The community is waiting for the first post.</p>
              <button onClick={() => navigate('/register')} className="relative z-10 bg-primary text-white font-black px-14 py-6 rounded-[2rem] text-xs uppercase tracking-[0.4em] shadow-2xl shadow-primary/40 hover:scale-105 transition-all active:scale-95">Sign Up and Upload</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
              {trendingArtworks.slice(0, 5).map((art, idx) => {
                const imgUrl = art.imageUrl?.startsWith('http') ? art.imageUrl : `${API_BASE}${art.imageUrl}`;
                return (
                  <div key={idx} className="group/card cursor-pointer animate-slide-up" style={{ animationDelay: `${idx * 150}ms` }} onClick={() => navigate('/explore')}>
                    <div className="relative aspect-[4/5] rounded-[3.5rem] overflow-hidden mb-8 bg-surface border-2 border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] transition-all duration-700 group-hover/card:-translate-y-4 group-hover/card:shadow-primary/30 group-hover/card:border-primary/40 group-hover/card:shadow-2xl">
                      <img
                        src={imgUrl}
                        alt={art.title}
                        className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover/card:scale-110"
                        onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d0f] via-transparent to-transparent opacity-0 group-hover/card:opacity-90 transition-all duration-500" />
                      <div className="absolute bottom-8 left-8 right-8 opacity-0 group-hover/card:opacity-100 translate-y-6 group-hover/card:translate-y-0 transition-all duration-500 z-20">
                         <button className="w-full bg-white text-dark font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-primary hover:text-white transition-all">View Details</button>
                      </div>
                    </div>
                    <div className="flex flex-col items-center text-center px-4 space-y-2">
                      <h3 className="font-black text-lg text-white truncate w-full tracking-tighter group-hover/card:text-primary transition-colors duration-500">{art.title}</h3>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">artist: <span className="text-white">{art.artist?.username || 'Unknown Artist'}</span></p>
                      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/5 w-full justify-center opacity-40 group-hover/card:opacity-100 transition-opacity duration-700">
                         <div className="flex items-center gap-2 text-[10px] text-primary font-black">
                            <Heart size={14} fill="currentColor" className="animate-pulse" /> {art.likes?.length || 0}
                         </div>
                         <div className="flex items-center gap-2 text-[10px] text-gray-500 font-black">
                            <MessageCircle size={14}/> {art.comments?.length || 0}
                         </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Global Categories Section */}
        <div className="mb-48 relative overflow-hidden rounded-[5rem] bg-dark-card border border-white/5 p-20 shadow-2xl group/categories">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-40" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="flex flex-col items-center text-center mb-24 relative z-10">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-px bg-primary" />
                <span className="text-[11px] font-black text-primary uppercase tracking-[0.5em]">Art Categories</span>
                <div className="w-12 h-px bg-primary" />
             </div>
             <h2 className="text-5xl font-black text-white tracking-tighter leading-tight mb-6">Explore Art <span className="text-primary italic">Categories</span></h2>
             <p className="text-gray-500 text-lg font-medium max-w-2xl">Find art by style and topic.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 relative z-10">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div 
                  key={idx} 
                  onClick={() => navigate('/explore')} 
                  className="bg-[#0c0d0f] border-2 border-white/5 p-12 rounded-[3.5rem] hover:border-primary/50 hover:-translate-y-3 transition-all duration-700 cursor-pointer group/cat flex flex-col items-center text-center shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/cat:opacity-100 transition-opacity duration-700" />
                  <div className={`w-20 h-20 rounded-[1.75rem] bg-gradient-to-br ${cat.bg} flex items-center justify-center mb-8 group-hover/cat:scale-110 group-hover/cat:rotate-6 transition-all duration-700 shadow-2xl border border-white/10`}>
                    <Icon size={36} className={cat.color} />
                  </div>
                  <h3 className="font-black text-xl text-white mb-3 group-hover/cat:text-primary transition-colors tracking-tighter leading-none">{cat.name}</h3>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{cat.count}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cinematic Final CTA */}
        <div className="bg-gradient-to-br from-primary via-primary to-accent rounded-[5rem] p-24 md:p-32 text-center relative overflow-hidden shadow-[0_60px_120px_-30px_rgba(124,58,237,0.5)] group/cta selection:bg-white selection:text-primary">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -mr-20 -mt-20 blur-[120px] animate-pulse" />
           <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/20 rounded-full -ml-20 -mb-20 blur-[100px] animate-pulse delay-1000" />
           
           <div className="relative z-10 space-y-12">
              <div className="flex flex-col items-center gap-6">
                 <div className="w-20 h-20 rounded-[2rem] bg-white/20 backdrop-blur-2xl flex items-center justify-center border border-white/30 shadow-2xl">
                    <Fingerprint size={48} className="text-white" />
                 </div>
                 <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-4">
                    Start Your <br/> <span className="italic text-black/20">Journey</span> Today.
                 </h2>
              </div>
              <p className="text-white/80 font-black max-w-2xl mx-auto text-xl uppercase tracking-widest leading-relaxed">
                 Join the art community and share your work.
              </p>
              <div className="flex flex-col sm:flex-row gap-8 justify-center pt-8">
                 <button onClick={() => navigate('/register')} className="h-24 px-16 bg-white text-primary font-black rounded-[2rem] text-[13px] uppercase tracking-[0.5em] shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all duration-500 flex items-center gap-4">
                    Create Account <Zap size={24} className="fill-primary" />
                 </button>
                 <button onClick={() => navigate('/explore')} className="h-24 px-16 bg-black/20 backdrop-blur-3xl text-white border-2 border-white/20 font-black rounded-[2rem] text-[13px] uppercase tracking-[0.5em] hover:bg-black/40 hover:border-white/40 transition-all duration-500 flex items-center gap-4">
                    Art Gallery <Command size={24} />
                 </button>
              </div>
           </div>
           
           {/* Visual Flourish */}
           <div className="absolute top-1/2 left-10 w-px h-64 bg-gradient-to-b from-transparent via-white/40 to-transparent" />
           <div className="absolute top-1/2 right-10 w-px h-64 bg-gradient-to-b from-transparent via-white/40 to-transparent" />
        </div>
      </div>

      {/* Minimalist Art Footer */}
      <footer className="mt-64 border-t border-white/5 py-32 bg-dark-card/20 relative">
         <div className="absolute inset-0 bg-primary/5 opacity-20 pointer-events-none" />
         <div className="max-w-[1400px] mx-auto px-10 flex flex-col lg:flex-row justify-between items-start gap-24 relative z-10">
            <div className="space-y-8 max-w-md">
              <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
                <ArtoryLogo size={58} />
              </div>
              <p className="text-gray-500 font-medium text-lg leading-relaxed">A simple place for artists to learn, share work, and grow.</p>
              <div className="flex gap-6">
                 {/* Social Placeholder Orbs */}
                 {[...Array(4)].map((_, i) => <div key={i} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center cursor-pointer"><Globe size={20}/></div>)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-24">
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] mb-4">Ecosystem</h4>
                  <div className="flex flex-col gap-5 text-[11px] font-black text-gray-500 uppercase tracking-widest">
                     <button className="hover:text-primary text-left transition-colors">Art Feed</button>
                     <button className="hover:text-primary text-left transition-colors">Gallery</button>
                     <button className="hover:text-primary text-left transition-colors">Community</button>
                     <button className="hover:text-primary text-left transition-colors">Competitions</button>
                  </div>
               </div>
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] mb-4">Rules</h4>
                  <div className="flex flex-col gap-5 text-[11px] font-black text-gray-500 uppercase tracking-widest">
                     <button className="hover:text-primary text-left transition-colors">Security</button>
                     <button className="hover:text-primary text-left transition-colors">Verification</button>
                     <button className="hover:text-primary text-left transition-colors">Governance</button>
                     <button className="hover:text-primary text-left transition-colors">API Access</button>
                  </div>
               </div>
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] mb-4">Support</h4>
                  <div className="flex flex-col gap-5 text-[11px] font-black text-gray-500 uppercase tracking-widest">
                     <button className="hover:text-primary text-left transition-colors">Help Center</button>
                     <button className="hover:text-primary text-left transition-colors">Updates</button>
                     <button className="hover:text-primary text-left transition-colors">Contact</button>
                  </div>
               </div>
            </div>
         </div>
         <div className="max-w-[1400px] mx-auto px-10 mt-32 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 opacity-40">
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">
               © 2026 ARTORY LABS. EXECUTING VISIONARY PROTOCOLS.
            </p>
            <div className="flex gap-10 text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">
               <span>Lat: 37.7749° N</span>
               <span>Lng: 122.4194° W</span>
               <span>Status: Saved</span>
            </div>
         </div>
      </footer>
    </div>
  );
}
