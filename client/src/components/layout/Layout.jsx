import { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';
import { Search, Camera, User, Command, LayoutGrid, BadgeCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

function TopHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);

  const profileImg = user?.profileImage
    ? (user.profileImage.startsWith('http') ? user.profileImage : `${API_BASE}${user.profileImage}`)
    : null;

  const handleSearch = (e) => {
    e.preventDefault();
    const firstMatch = results[0];
    if (firstMatch) {
      setSearchQuery('');
      setResults([]);
      navigate(`/profile/${firstMatch._id}`);
    }
  };

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      setSearching(true);
      api.get(`/auth/search?q=${encodeURIComponent(q)}`)
        .then(res => setResults(res.data || []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    const close = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setResults([]);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div id="top-header" className="sticky top-0 z-[40] bg-dark/40 backdrop-blur-3xl border-b border-white/5 shadow-2xl">
      <div className="flex items-center justify-between px-10 py-5 max-w-[1500px] mx-auto">
        {/* Art Search Console */}
        <div ref={searchRef} className="flex-1 max-w-2xl group/search relative">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
               <Search size={18} className="text-gray-600 group-focus-within/search:text-primary transition-colors duration-500" />
            </div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artists..."
              className="w-full bg-surface/30 border-2 border-white/5 rounded-2xl pl-14 pr-6 py-4 text-xs font-black text-white placeholder-gray-700 focus:outline-none focus:border-primary/50 focus:bg-surface/50 transition-all duration-500 shadow-inner uppercase tracking-widest"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 bg-dark/60 px-3 py-1.5 rounded-lg border border-white/5 opacity-40 group-focus-within/search:opacity-100 transition-opacity">
               <Command size={10} className="text-gray-500" />
               <span className="text-[9px] font-black text-gray-500">K</span>
            </div>
          </form>
          {searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-3 rounded-2xl border border-white/10 bg-[#0c0d0f] shadow-2xl overflow-hidden z-[80]">
              {searching ? (
                <div className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Searching artists...</div>
              ) : results.length === 0 ? (
                <div className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">No artists found</div>
              ) : (
                results.map(result => {
                  const avatar = result.profileImage
                    ? (result.profileImage.startsWith('http') ? result.profileImage : `${API_BASE}${result.profileImage}`)
                    : null;
                  return (
                    <button
                      key={result._id}
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setResults([]);
                        navigate(`/profile/${result._id}`);
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center overflow-hidden font-black">
                        {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : result.username?.[0]?.toUpperCase()}
                      </div>
                      <span className="flex-1 text-xs font-black text-white uppercase tracking-widest">{result.username}</span>
                      {result.isVerified && <BadgeCheck size={16} className="text-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Console Controls */}
        <div className="flex items-center gap-5 ml-10">
          <div className="flex items-center gap-3 bg-surface/20 p-2 rounded-2xl border border-white/5 shadow-2xl">
             <button className="h-12 w-12 rounded-xl bg-white/5 text-gray-500 hover:text-primary hover:bg-white/10 transition-all flex items-center justify-center group/ctrl" onClick={() => navigate('/explore')} title="Art Grid">
               <LayoutGrid size={20} className="group-hover/ctrl:scale-110 transition-transform" />
             </button>
             <button className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center group/ctrl active:scale-95" onClick={() => navigate('/upload')} title="Post Vision">
               <Camera size={20} className="group-hover/ctrl:scale-110 transition-transform" />
             </button>
          </div>
          
          <div className="h-10 w-px bg-white/10" />

          <div
            className="flex items-center gap-4 pl-2 pr-5 py-2 rounded-2xl bg-surface/40 border-2 border-white/5 hover:border-primary/40 transition-all cursor-pointer group shadow-2xl overflow-hidden relative"
            onClick={() => navigate('/profile')}
          >
             <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden ring-1 ring-white/10 group-hover:scale-110 transition-transform relative z-10">
               {profileImg ? (
                 <img src={profileImg} alt="" className="w-full h-full object-cover" />
               ) : (
                 <User size={20} className="text-primary" />
               )}
             </div>
             <div className="text-left relative z-10">
                <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">{user?.username || 'Unknown Artist'}</p>
                <div className="flex items-center gap-2">
                   <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                   <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">Read</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0c0d0f] w-full selection:bg-primary selection:text-white">
      <Sidebar open={open} setOpen={setOpen} />
      <main className="flex-1 h-screen overflow-y-auto w-full hide-scrollbar scroll-smooth">
        <TopHeader />
        <div className="max-w-[1500px] mx-auto p-10">
          <Outlet />
        </div>
      </main>
      <Toaster position="top-right" toastOptions={{
        style: { 
          background: '#0c0d0f', 
          color: '#E2E8F0', 
          border: '2px solid rgba(124,58,237,0.2)',
          borderRadius: '1.5rem',
          padding: '16px 24px',
          fontWeight: '900',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        },
        success: { iconTheme: { primary: '#7C3AED', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
      }} />
    </div>
  );
}
