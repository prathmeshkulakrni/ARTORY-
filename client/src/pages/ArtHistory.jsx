import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, X, Calendar, Landmark, Info, Clock, ExternalLink, Sparkles, BookOpen, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ImageViewerModal from '../components/ImageViewerModal';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function ArtHistory() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', historyDate: '' });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/arthistory').then(res => setPosts(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('historyDate', form.historyDate);
      formData.append('image', imageFile);
      const res = await api.post('/arthistory', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPosts([res.data, ...posts]);
      setShowCreate(false);
      setForm({ title: '', description: '', historyDate: '' });
      setImageFile(null);
      toast.success('Historical record galleryd!');
    } catch (err) { toast.error('Failed to preserve record'); }
  };

  const filteredPosts = posts.filter(post =>
    post.title?.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 lg:px-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
            <Landmark size={14}/> The Digital Gallery
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter leading-none">Art <span className="text-primary italic">Chronicles</span></h1>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] max-w-md">Explore important moments in art history.</p>
        </div>
        
        {user?.role === 'admin' && (
          <button 
            onClick={() => setShowCreate(!showCreate)} 
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl ${showCreate ? 'bg-surface text-gray-400' : 'bg-primary text-white shadow-primary/20'}`}
          >
            {showCreate ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Gallery New Era</>}
          </button>
        )}
      </div>

      <div className="relative mb-12">
        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-surface/30 border border-white/10 rounded-2xl pl-14 pr-5 py-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
          placeholder="Search history by title..."
        />
      </div>

      {/* Admin Form */}
      {showCreate && user?.role === 'admin' && (
        <div className="bg-dark-card border-2 border-primary/20 rounded-[2.5rem] p-10 mb-16 shadow-2xl animate-slide-up relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
           
           <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                 <BookOpen size={24}/>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Post New Chronicle</h2>
           </div>

           <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Artwork Title</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-dark/60 border border-dark-border/40 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary transition-all shadow-inner" placeholder="e.g. The Starry Night" required />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Chronological Date</label>
                  <input type="date" value={form.historyDate} onChange={e => setForm({ ...form, historyDate: e.target.value })} className="w-full bg-dark/60 border border-dark-border/40 rounded-2xl px-6 py-4 text-sm text-white focus:border-primary transition-all shadow-inner" required />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Historical Narrative</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-dark/60 border border-dark-border/40 rounded-2xl px-6 py-4 text-sm text-white h-[142px] resize-none focus:border-primary transition-all shadow-inner" placeholder="Describe what happened and why it matters..." required />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">High-Res Documentation (Image)</label>
                <div className="relative group">
                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer z-10" required />
                  <div className="bg-dark/60 border-2 border-dashed border-dark-border/40 rounded-3xl p-10 text-center group-hover:border-primary/40 transition-all">
                    <Sparkles size={32} className="mx-auto mb-4 text-gray-600 group-hover:text-primary transition-colors" />
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{imageFile ? imageFile.name : 'Drop image or click to browse'}</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button type="submit" className="bg-gradient-to-r from-primary to-accent text-white font-black px-12 py-5 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                  Add Post
                </button>
              </div>
           </form>
        </div>
      )}

      {/* Gallery Section */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-10">
           {[...Array(4)].map((_, i) => (
             <div key={i} className="animate-pulse">
                <div className="aspect-[16/10] bg-dark-card rounded-[2.5rem] mb-6" />
                <div className="h-4 bg-dark-card rounded-full w-3/4 mb-3" />
                <div className="h-3 bg-dark-card rounded-full w-1/2" />
             </div>
           ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-32 bg-dark-card rounded-[3rem] border-2 border-dashed border-dark-border/40">
          <div className="w-24 h-24 bg-surface rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
             <Landmark size={40} className="text-gray-700"/>
          </div>
          <h3 className="text-2xl font-black text-white mb-2">The Gallery is Silent.</h3>
          <p className="text-gray-500 font-medium mb-8">No historical chronicles have been preserved yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-10">
          {filteredPosts.map((p, idx) => (
            <div 
              key={p._id} 
              className="group bg-dark-card border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-primary/40 transition-all duration-500 cursor-pointer shadow-2xl animate-slide-up" 
              style={{ animationDelay: `${idx * 100}ms` }}
              onClick={() => setSelectedPost({...p, artist: p.author})}
            >
              <div className="aspect-[16/10] w-full bg-surface relative overflow-hidden">
                <img 
                  src={p.imageUrl?.startsWith('http') ? p.imageUrl : `${API_BASE}${p.imageUrl}`} 
                  alt={p.title} 
                  className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" 
                  loading="lazy" 
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent flex flex-col justify-end p-10">
                  <div className="translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="px-3 py-1 rounded-lg bg-primary/20 backdrop-blur-md border border-primary/30 text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12}/> {p.historyDate ? new Date(p.historyDate).getFullYear() : 'Ancient'}
                      </div>
                      <div className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black text-white/80 uppercase tracking-widest flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         Historical Record
                      </div>
                    </div>
                    
                    <h3 className="text-4xl font-black text-white mb-3 tracking-tighter">{p.title}</h3>
                    <p className="text-gray-300 text-sm font-medium leading-relaxed line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity mb-6">{p.description}</p>
                    
                    <button className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.2em] group-hover:gap-5 transition-all">
                       Examine Gallery <ExternalLink size={14}/>
                    </button>
                  </div>
                </div>

                <div className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all group-hover:rotate-12">
                   <Info size={20}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <ImageViewerModal isOpen={!!selectedPost} onClose={() => setSelectedPost(null)} artwork={selectedPost} />
    </div>
  );
}
