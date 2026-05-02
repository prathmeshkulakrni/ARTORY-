import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Users, Plus, X, Lock, Globe } from 'lucide-react';
import ReportButton from '../components/ReportButton';

const API_BASE = 'http://localhost:5000';

export default function Community() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: '', isPrivate: false });
  const [loading, setLoading] = useState(true);

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
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const join = async (e, id) => {
    e.stopPropagation();
    const c = communities.find(x => x._id === id);
    const isMember = c?.members?.some(m => (m._id || m) === user?._id);
    const hasPending = c?.joinRequests?.some(r => (r.user?._id || r.user) === user?._id);

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
      else if (r.data.cancelled) toast.success('Request cancelled');
      else toast.success(r.data.joined ? 'Joined!' : 'Left community');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Communities</h1>
          <p className="text-gray-400 mt-1">Join groups of like-minded artists</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
          {showCreate ? <><X size={18}/> Cancel</> : <><Plus size={18}/> Create</>}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={create} className="card mb-8 space-y-4 animate-slide-up">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="Community name" required />
          <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input" placeholder="Category (e.g. Digital Art)" required />
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input h-20 resize-none" placeholder="Description" />
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">Privacy:</span>
            <button type="button" onClick={() => setForm({...form, isPrivate: false})}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${!form.isPrivate ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'text-gray-500 hover:text-gray-300'}`}>
              <Globe size={14}/> Public
            </button>
            <button type="button" onClick={() => setForm({...form, isPrivate: true})}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${form.isPrivate ? 'bg-orange-400/20 text-orange-400 border border-orange-400/40' : 'text-gray-500 hover:text-gray-300'}`}>
              <Lock size={14}/> Private
            </button>
          </div>
          <button type="submit" className="btn-primary">Create Community</button>
        </form>
      )}

      {loading
        ? <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin"/></div>
        : communities.length === 0
          ? <div className="text-center py-20 card"><p className="text-5xl mb-3">👥</p><p className="text-gray-400">No communities yet. Create the first one!</p></div>
          : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map(c => {
                const isMember = c.members?.some(m => (m._id || m) === user?._id);
                const hasPending = c.joinRequests?.some(r => (r.user?._id || r.user) === user?._id);
                return (
                  <div key={c._id} className="card group hover:border-primary/50 cursor-pointer relative" onClick={() => navigate(`/community/${c._id}`)}>
                    {/* Privacy badge */}
                    <div className="absolute top-3 right-3 z-10">
                      {c.isPrivate
                        ? <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full backdrop-blur-sm"><Lock size={10}/> Private</span>
                        : <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full backdrop-blur-sm"><Globe size={10}/> Public</span>
                      }
                    </div>
                    <div className="h-32 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 mb-4 flex items-center justify-center overflow-hidden">
                      {c.coverImage
                        ? <img src={`${API_BASE}${c.coverImage}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="cover" />
                        : <Users size={32} className="text-primary"/>
                      }
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{c.name}</h3>
                    <span className="badge bg-primary/20 text-primary mb-3 inline-block">{c.category}</span>
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{c.description || 'No description'}</p>
                    <div className="flex justify-between items-center pt-3 border-t border-dark-border">
                      <span className="text-sm text-gray-500">{c.members?.length || 0} members</span>
                      <div className="flex items-center gap-3">
                        <ReportButton targetType="community" targetId={c._id} compact />
                        <button
                          onClick={(e) => join(e, c._id)}
                          className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-all ${
                            isMember ? 'bg-dark-border text-gray-400 hover:bg-red-500/20 hover:text-red-400'
                            : hasPending ? 'bg-orange-400/10 text-orange-400'
                            : 'bg-primary/20 text-primary hover:bg-primary hover:text-white'
                          }`}
                        >
                          {isMember ? 'Leave' : hasPending ? 'Pending' : 'Join'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
      }
    </div>
  );
}
