import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ImageViewerModal from '../components/ImageViewerModal';

const API_BASE = 'http://localhost:5000';

export default function ArtHistory() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', historyDate: '' });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

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
      toast.success('Art History post created!');
    } catch (err) { toast.error('Failed to create post'); }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Art History</h1>
          <p className="text-gray-400 mt-1">Explore historical masterpieces curated by our team</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
            {showCreate ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add Post</>}
          </button>
        )}
      </div>

      {showCreate && user?.role === 'admin' && (
        <form onSubmit={create} className="card mb-8 space-y-4 animate-slide-up">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" placeholder="Title" required />
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input h-20 resize-none" placeholder="Description" required />
          <input type="date" value={form.historyDate} onChange={e => setForm({ ...form, historyDate: e.target.value })} className="input" required />
          <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="input" required />
          <button type="submit" className="btn-primary">Create Post</button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 card"><p className="text-5xl mb-3">🏛️</p><p className="text-gray-400">No history records yet</p></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {posts.map(p => (
            <div key={p._id} className="card group hover:border-primary/40 cursor-pointer overflow-hidden p-0" onClick={() => setSelectedPost({...p, artist: p.author})}>
              <div className="aspect-video w-full bg-dark-border relative">
                <img src={p.imageUrl?.startsWith('http') ? p.imageUrl : `${API_BASE}${p.imageUrl}`} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  {p.historyDate && <p className="text-xs text-primary mb-2">{new Date(p.historyDate).toLocaleDateString()}</p>}
                  <h3 className="text-2xl font-bold text-white mb-2">{p.title}</h3>
                  <p className="text-gray-300 text-sm line-clamp-2">{p.description}</p>
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
