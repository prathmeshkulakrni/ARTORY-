import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Users, Plus, X, Lock, Globe, Sparkles, MessageSquare, Shield, ArrowRight, Palette, Zap, Search, LayoutGrid, Heart } from 'lucide-react';
import ReportButton from '../components/ReportButton';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';
const mediaSrc = (path, version) => {
  if (!path) return '';
  const src = path.startsWith('http') ? path : `${API_BASE}${path}`;
  return version ? `${src}${src.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}` : src;
};

export default function Community() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: '', isPrivate: false });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.get('/community').then(r => setCommunities(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post('/community', { ...form, isPrivate: form.isPrivate });
      setCommunities(prev => [r.data, ...prev]);
      setShowCreate(false);
      setForm({ name: '', description: '', category: '', isPrivate: false });
      toast.success('Community created!');
    } catch (err) { toast.error(err.response?.data?.message || 'Could not create community'); }
  };

  const join = async (e, id) => {
    e.stopPropagation();
    try {
      const r = await api.post(`/community/${id}/join`);
      setCommunities(prev => prev.map(comm => {
        if (comm._id !== id) return comm;
        if (r.data.joined) return { ...comm, members: [...(comm.members || []), user._id] };
        if (r.data.joined === false && !r.data.requested && !r.data.cancelled) {
          return { ...comm, members: (comm.members || []).filter(m => (m._id || m) !== user._id) };
        }
        return comm;
      }));
      if (r.data.requested) toast.success('Join request sent!');
      else if (r.data.cancelled) toast.success('Message cancelled');
      else toast.success(r.data.joined ? 'Joined community!' : 'Left community');
    } catch { toast.error('Could not join community'); }
  };

  const filteredCommunities = communities.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-32 px-6 lg:px-8 selection:bg-primary selection:text-white">
      {/* UI Style Header */}
      <div className="relative mb-20 group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-accent/20 blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-10 bg-dark-card border border-white/5 p-12 rounded-[4rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-4">
               <div className="w-12 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(124,58,237,0.5)]" />
               <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] italic">Artistic Ecosystem</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tighter leading-none">
              Global <span className="text-primary italic">Community</span>
            </h1>
            <p className="text-gray-500 text-lg font-medium max-w-xl leading-relaxed">Join art communities to share tips, build projects, and try new ideas.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
            <div className="relative group/search w-full sm:w-64">
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/search:text-primary transition-colors" />
               <input 
                 placeholder="Filter communities..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-dark/40 border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-xs font-black text-white focus:outline-none focus:border-primary/50 transition-all shadow-inner"
               />
            </div>
            <button 
              onClick={() => setShowCreate(!showCreate)} 
              className={`w-full sm:w-auto flex items-center justify-center gap-4 px-10 py-5 rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all duration-500 shadow-2xl active:scale-95 ${showCreate ? 'bg-surface text-gray-500 border border-white/5' : 'bg-gradient-to-r from-primary to-accent text-white shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1'}`}
            >
              {showCreate ? <><X size={20}/> Close Console</> : <><Plus size={20}/> Create Community</>}
            </button>
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="bg-[#0c0d0f] border-2 border-white/10 rounded-[4rem] p-16 mb-20 shadow-[0_0_100px_rgba(0,0,0,0.6)] animate-slide-up relative overflow-hidden group/form">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" />
          
          <div className="flex items-center gap-6 mb-12">
            <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-2xl border border-primary/20">
               <Zap size={32} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter leading-none">New <span className="text-primary italic">Creative Hub</span></h2>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mt-2">Initializing public art group architecture</p>
            </div>
          </div>

          <form onSubmit={create} className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] ml-2 flex items-center gap-3">
                   <Palette size={14} className="text-primary"/> Group Identity
                </label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-dark/60 border-2 border-white/5 rounded-[1.75rem] px-8 py-5 text-lg font-black text-white focus:outline-none focus:border-primary/50 transition-all shadow-inner tracking-tight" placeholder="The Digital Vanguard" required />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] ml-2 flex items-center gap-3">
                   <LayoutGrid size={14} className="text-primary"/> Specialty Domain
                </label>
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-dark/60 border-2 border-white/5 rounded-[1.75rem] px-8 py-5 text-sm font-black text-white focus:outline-none focus:border-primary/50 transition-all shadow-inner tracking-tight" placeholder="Cyber-Impressionism" required />
              </div>
            </div>
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] ml-2 flex items-center gap-3">
                   <MessageSquare size={14} className="text-primary"/> Hub Mandate
                </label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-dark/60 border-2 border-white/5 rounded-[2rem] px-8 py-6 text-sm font-medium text-white focus:outline-none focus:border-primary/50 transition-all h-[200px] resize-none shadow-inner leading-relaxed" placeholder="Write what this group is about..." />
              </div>
            </div>
            <div className="lg:col-span-2 flex flex-col md:flex-row items-center justify-between gap-10 pt-10 border-t border-white/5 mt-4">
              <div className="flex items-center gap-8">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Privacy Layer:</span>
                <div className="flex bg-dark/60 p-2 rounded-2xl border-2 border-white/5 shadow-inner">
                  <button type="button" onClick={() => setForm({...form, isPrivate: false})}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${!form.isPrivate ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Globe size={16}/> Open
                  </button>
                  <button type="button" onClick={() => setForm({...form, isPrivate: true})}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${form.isPrivate ? 'bg-accent text-white shadow-xl shadow-accent/30' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Lock size={16}/> Encrypted
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full md:w-auto bg-gradient-to-r from-primary to-accent text-white font-black px-16 py-6 rounded-[2rem] text-[12px] uppercase tracking-[0.4em] shadow-2xl shadow-primary/30 hover:shadow-primary/60 hover:scale-[1.02] active:scale-95 transition-all duration-500 flex items-center justify-center gap-4">
                Launch Group Hub <ArrowRight size={24} className="animate-bounce-x"/>
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-8">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-[0_0_30px_rgba(124,58,237,0.3)]"/>
          <p className="text-gray-600 font-black text-[10px] tracking-[0.5em] uppercase animate-pulse">Starting Global Community...</p>
        </div>
      ) : communities.length === 0 ? (
        <div className="text-center py-40 bg-dark-card border-2 border-dashed border-white/5 rounded-[4rem] animate-fade-in relative group/empty">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/empty:opacity-100 transition-opacity duration-1000" />
          <div className="w-32 h-32 bg-surface rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-2xl border border-white/5 relative z-10 group-hover/empty:scale-110 transition-transform duration-700">
            <Users size={64} className="text-gray-700 group-hover/empty:text-primary transition-colors duration-700"/>
          </div>
          <div className="space-y-4 relative z-10">
             <h3 className="text-3xl font-black text-white tracking-tighter">Art Network Empty</h3>
             <p className="text-gray-500 max-w-sm mx-auto mb-10 font-medium text-lg leading-relaxed">No groups yet. Create the first one to get started.</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="relative z-10 bg-primary/10 text-primary border-2 border-primary/20 px-12 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-primary hover:text-white transition-all duration-500 shadow-2xl">Create First Group</button>
        </div>
      ) : filteredCommunities.length === 0 ? (
        <div className="text-center py-32 bg-dark-card border border-white/5 rounded-[4rem] shadow-2xl animate-fade-in relative group/empty overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 opacity-40 blur-[80px]" />
          <div className="w-24 h-24 bg-surface rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner ring-1 ring-white/5 relative z-10">
             <Search size={36} className="text-primary animate-pulse"/>
          </div>
          <div className="space-y-4 relative z-10">
             <h3 className="text-2xl font-black text-white tracking-tighter">No Creative Hubs Found</h3>
             <p className="text-gray-500 font-medium max-w-md mx-auto mb-8">No communities match your filter query <span className="text-primary italic">"{searchQuery}"</span>. Try adjusting your parameters.</p>
             <button onClick={() => setSearchQuery('')} className="bg-primary/10 text-primary border-2 border-primary/20 px-10 py-4.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all duration-500 shadow-2xl">Clear Search Filter</button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredCommunities.map((c, idx) => {
            const isMember = c.members?.some(m => (m._id || m) === user?._id);
            const hasPending = c.joinRequests?.some(r => (r.user?._id || r.user) === user?._id);
            return (
              <div key={c._id} className="group bg-dark-card border border-white/5 hover:border-primary/40 rounded-[3.5rem] p-8 cursor-pointer relative shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_40px_80px_-20px_rgba(124,58,237,0.2)] transition-all duration-700 transform hover:-translate-y-3 animate-slide-up overflow-hidden" style={{ animationDelay: `${idx * 100}ms` }} onClick={() => navigate(`/community/${c._id}`)}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Privacy badge */}
                <div className="absolute top-6 right-6 z-20">
                  {c.isPrivate
                    ? <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-accent bg-accent/10 px-4 py-2 rounded-2xl backdrop-blur-3xl border border-accent/20 shadow-2xl transition-all group-hover:bg-accent group-hover:text-white"><Lock size={12}/> Encrypted</span>
                    : <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-2xl backdrop-blur-3xl border border-primary/20 shadow-2xl transition-all group-hover:bg-primary group-hover:text-white"><Globe size={12}/> Public Hub</span>
                  }
                </div>

                <div className="h-56 rounded-[2.5rem] bg-surface/40 mb-8 flex items-center justify-center overflow-hidden relative group-hover:ring-2 ring-primary/20 transition-all shadow-inner">
                  {c.coverImage
                    ? <img src={mediaSrc(c.coverImage, c.updatedAt)} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-accent/10 flex items-center justify-center">
                        <Users size={56} className="text-primary/20 group-hover:scale-110 group-hover:text-primary transition-all duration-700"/>
                      </div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  
                  <div className="absolute bottom-6 left-6 z-10">
                     <div className="flex -space-x-3">
                        {[1,2,3].map(i => (
                           <div key={i} className="w-10 h-10 rounded-xl bg-surface border-2 border-dark-card flex items-center justify-center text-[10px] font-black text-gray-500 shadow-xl overflow-hidden">
                              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c._id}${i}`} alt="" className="w-full h-full object-cover"/>
                           </div>
                        ))}
                        <div className="w-10 h-10 rounded-xl bg-primary/20 backdrop-blur-xl border-2 border-primary/30 flex items-center justify-center text-[10px] font-black text-primary shadow-xl">
                           +{c.members?.length || 0}
                        </div>
                     </div>
                  </div>
                </div>

                <div className="space-y-6 px-2 relative z-10">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                       <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                       <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{c.category}</span>
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-tighter line-clamp-1 group-hover:text-primary transition-colors duration-500">{c.name}</h3>
                  </div>
                  
                  <p className="text-sm text-gray-500 font-medium line-clamp-2 h-10 leading-relaxed group-hover:text-gray-400 transition-colors">{c.description || 'A friendly art group for sharing work and ideas.'}</p>
                  
                  <div className="flex items-center gap-8 pt-2">
                    <div className="flex items-center gap-3 text-gray-500 group-hover:text-gray-300 transition-colors">
                      <Users size={18} className="text-primary/60 group-hover:text-primary transition-colors" />
                      <span className="text-[11px] font-black uppercase tracking-widest">{c.members?.length || 0} Artists</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500 group-hover:text-gray-300 transition-colors">
                      <MessageSquare size={18} className="text-accent/60 group-hover:text-accent transition-colors" />
                      <span className="text-[11px] font-black uppercase tracking-widest">Active Link</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-8 border-t border-white/5">
                    <div className="flex items-center gap-4">
                       <ReportButton targetType="community" targetId={c._id} compact />
                       <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-600 hover:text-red-500 transition-all hover:bg-red-500/10">
                          <Heart size={18} />
                       </button>
                    </div>
                    <button
                      onClick={(e) => join(e, c._id)}
                      className={`flex items-center gap-3 px-8 py-3.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 transform active:scale-95 shadow-2xl ${
                        isMember ? 'bg-surface/60 text-gray-500 hover:bg-red-500 hover:text-white border border-white/5'
                        : hasPending ? 'bg-accent/10 text-accent border border-accent/20'
                        : 'bg-gradient-to-r from-primary to-accent text-white shadow-primary/30 hover:shadow-primary/50 hover:scale-105'
                      }`}
                    >
                      {isMember ? 'Leave' : hasPending ? 'Pending' : <><Zap size={14}/> Create Group</>}
                    </button>
                  </div>
                </div>
                
                {/* UI Decorative Elements */}
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 -ml-12 -mb-12 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="absolute top-1/2 right-0 w-px h-24 bg-gradient-to-b from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
