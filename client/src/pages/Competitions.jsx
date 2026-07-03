import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Trophy, Clock, Plus, X, Medal, Check, Ban, Upload, Users, Crown, Sparkles, ArrowRight, Star, Shield, Zap, Target } from 'lucide-react';
import ReportButton from '../components/ReportButton';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function Competitions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comps, setComps] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: '', deadline: '', prize: '' });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');

  // Per-competition expansion and submission state
  const [expandedId, setExpandedId] = useState(null);
  const [submitFile, setSubmitFile] = useState({});
  const [submissions, setSubmissions] = useState({});   // { compId: [submissions] }
  const [winners, setWinners] = useState({});           // { compId: {rank, artistId} }
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchComps = () => {
    setLoading(true);
    api.get('/competition').then(r => setComps(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchComps(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post('/competition', form);
      setComps(prev => [r.data, ...prev]);
      setShowCreate(false);
      toast.success('Competition sent for review.');
    } catch (err) { toast.error(err.response?.data?.message || 'Could not create competition'); }
  };

  const handleApproval = async (id, status) => {
    try {
      await api.put(`/competition/${id}/approve`, { status });
      setComps(prev => prev.map(c => c._id === id ? { ...c, status } : c));
      toast.success(`Competition status updated: ${status}`);
    } catch { toast.error('Failed to save status'); }
  };

  const handleJoin = async (id) => {
    try {
      await api.post(`/competition/${id}/join`);
      setComps(prev => prev.map(c => c._id === id ? { ...c, participants: [...(c.participants || []), { _id: user._id }] } : c));
      toast.success('Joined the competition!');
    } catch (err) { toast.error(err.response?.data?.message || 'Could not join competition'); }
  };

  const handleSubmit = async (compId) => {
    const file = submitFile[compId];
    if (!file) return toast.error('Selection required');
    const fd = new FormData();
    fd.append('submissionImage', file);
    try {
      await api.post(`/competition/${compId}/submit`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Entry submitted for review!');
      setSubmitFile(prev => ({ ...prev, [compId]: null }));
      fetchComps();
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed'); }
  };

  const loadSubmissions = async (compId) => {
    try {
      const r = await api.get(`/competition/${compId}/submissions`);
      setSubmissions(prev => ({ ...prev, [compId]: r.data }));
    } catch (err) { toast.error(err.response?.data?.message || 'Could not load entries'); }
  };

  const handlePickWinners = async (compId) => {
    const picked = winners[compId];
    if (!picked || Object.keys(picked).length === 0) return toast.error('Choose at least 1 winner');
    const winnersArr = Object.entries(picked).map(([rank, artistId]) => ({ rank: Number(rank), artistId }));
    try {
      const r = await api.post(`/competition/${compId}/winners`, { winners: winnersArr });
      setComps(prev => prev.map(c => c._id === compId ? { ...c, winners: r.data.winners } : c));
      toast.success('Winners saved!');
    } catch (err) { toast.error(err.response?.data?.message || 'Could not save winners'); }
  };

  const handleEndCompetition = async (compId) => {
    if (!window.confirm("End this competition now?")) return;
    try {
      const r = await api.put(`/competition/${compId}/end`);
      setComps(prev => prev.map(c => c._id === compId ? { ...c, deadline: r.data.comp.deadline } : c));
      toast.success('Competition ended.');
    } catch (err) { 
      toast.error(err.response?.data?.message || err.message || 'Could not end competition'); 
    }
  };

  const timeLeft = (d) => {
    const diff = new Date(d) - new Date();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000);
    return days > 0 ? `${days} Days Left` : `${hours} Hours Remaining`;
  };

  const isOrganizer = (c) => (c.organizer?._id || c.organizer) === user?._id;
  const hasJoined = (c) => c.participants?.some(p => (p._id || p) === user?._id);
  const hasSubmitted = (c) => c.submissions?.some(s => (s.artist?._id || s.artist) === user?._id);
  const isApproved = (c) => c.status === 'approved';
  const isActive = (c) => isApproved(c) && new Date(c.deadline) > new Date();

  const filteredComps = comps.filter(c => {
    if (tab === 'all') return true;
    if (tab === 'active') return isApproved(c) && new Date(c.deadline) > new Date();
    if (tab === 'ended') return isApproved(c) && new Date(c.deadline) <= new Date();
    if (tab === 'pending') return c.status === 'pending';
    if (tab === 'mine') return isOrganizer(c);
    return true;
  });

  return (
    <div className="animate-fade-in space-y-12 pb-20 selection:bg-primary selection:text-white">
      {/* Dynamic Competition Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
             <Trophy size={14}/> Global Competitions
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9]">
            Art <span className="text-primary italic">Competitions</span>
          </h1>
          <p className="text-gray-400 font-medium text-lg max-w-xl leading-relaxed">
            Join art contests, win rewards, and share your work with the community.
          </p>
        </div>
        
        <button 
          onClick={() => setShowCreate(!showCreate)} 
          className={`h-16 px-10 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl ${showCreate ? 'bg-surface/40 text-gray-400 border border-white/5 hover:text-white' : 'bg-gradient-to-r from-primary to-accent text-white shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-95'}`}
        >
          {showCreate ? <><X size={20}/> Cancel</> : <><Plus size={20}/> Create Competition</>}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={create} className="bg-dark-card border border-white/5 rounded-[3rem] p-10 space-y-8 animate-slide-up shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px] -z-10" />
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center shadow-inner">
              <Sparkles size={32} className="text-primary animate-pulse" />
            </div>
            <div>
               <h3 className="text-3xl font-black text-white tracking-tighter">New Competition</h3>
               <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em]">Sent to admins for approval</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6 md:col-span-2">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Competition Title</label>
                 <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-surface/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-primary/40 focus:bg-surface/60 transition-all outline-none font-medium" placeholder="Ex: Neo-Cyber Landscape Challenge" required />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Rules</label>
                 <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-surface/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-primary/40 focus:bg-surface/60 transition-all h-40 resize-none outline-none font-medium leading-relaxed" placeholder="Rules, deadline notes, and judging details..." required />
               </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Category</label>
              <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-surface/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-primary/40 transition-all outline-none font-medium" placeholder="e.g. 3D Sculpting" />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">End Date</label>
              <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full bg-surface/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-primary/40 transition-all outline-none font-medium" required />
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Prize Details (Prize Pool)</label>
              <input value={form.prize} onChange={e => setForm({...form, prize: e.target.value})} className="w-full bg-surface/40 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-primary/40 transition-all outline-none font-medium" placeholder="Ex: 5000 Credits + Profile Verification Badge" />
            </div>
          </div>
          
          <button type="submit" className="w-full bg-gradient-to-r from-primary to-accent text-white font-black py-5 rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.01] transition-all active:scale-[0.98] text-[11px] uppercase tracking-[0.3em]">
            Submit Competition
          </button>
        </form>
      )}

      {/* Competition Navigation */}
      <div className="flex gap-2 bg-dark-card/40 p-2 rounded-[1.5rem] border border-white/5 w-fit overflow-x-auto hide-scrollbar snap-x">
        {(user?.role === 'admin'
          ? [['all','All Competitions'],['active','Active Competitions'],['ended','Ended'],['pending','Awaiting Review']]
          : [['all','All'],['active','Active'],['ended','Ended'],['mine','My Proposals']]
        ).map(([key, label]) => (
          <button 
            key={key} 
            onClick={() => setTab(key)}
            className={`px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap rounded-xl transition-all duration-500 snap-center ${tab === key ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            {label}
            {key === 'pending' && comps.filter(c => c.status === 'pending').length > 0 && (
              <span className="ml-3 bg-primary text-white text-[9px] px-2 py-0.5 rounded-full animate-pulse">{comps.filter(c => c.status === 'pending').length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-[1.5rem] animate-spin"/>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">Loading Competitions...</p>
        </div>
      ) : filteredComps.length === 0 ? (
        <div className="text-center py-32 bg-dark-card border border-white/5 rounded-[4rem] shadow-2xl">
          <div className="w-24 h-24 bg-surface rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner ring-1 ring-white/5">
            <Target size={44} className="text-gray-700" />
          </div>
          <h3 className="text-3xl font-black text-white mb-3 tracking-tighter">No Active Competitions.</h3>
          <p className="text-gray-500 font-medium mb-10 max-w-xs mx-auto">No competitions yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {filteredComps.map(c => (
            <div key={c._id} className="bg-dark-card border border-white/5 rounded-[3rem] p-10 flex flex-col group hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/10 transition-colors" />
              
              {/* Card Meta */}
              <div className="flex items-start justify-between mb-8">
                <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                  <Trophy size={32} className="text-primary"/>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 backdrop-blur-xl ${new Date(c.deadline) > new Date() ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    <Clock size={14}/>{timeLeft(c.deadline)}
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border ${c.status === 'approved' ? 'bg-primary/5 text-primary border-primary/20' : c.status === 'rejected' ? 'bg-red-500/5 text-red-400 border-red-500/20' : 'bg-yellow-500/5 text-yellow-300 border-yellow-500/20'}`}>
                    {c.status || 'pending'}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                <h3 className="text-3xl font-black text-white leading-[0.9] tracking-tighter group-hover:text-primary transition-colors">{c.title}</h3>
                <p className="text-gray-400 font-medium text-sm leading-relaxed line-clamp-3">{c.description}</p>
                
                <div className="flex flex-wrap gap-4 pt-2">
                  {c.prize && (
                    <div className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 rounded-2xl border border-primary/20">
                      <Medal size={16} className="text-primary"/>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">{c.prize}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-surface/40 rounded-2xl border border-white/5">
                    <Users size={16} className="text-gray-500"/>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{c.participants?.length || 0} Artists</span>
                  </div>
                </div>
              </div>

              {/* Victors Section */}
              {c.winners && c.winners.length > 0 && (
                <div className="mb-8 p-6 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-[2rem] space-y-5 shadow-inner">
                  <div className="flex items-center justify-between">
                     <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] flex items-center gap-3">
                       <Crown size={16}/> Winners
                     </p>
                     <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Final Results</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {[...c.winners].sort((a, b) => a.rank - b.rank).map((w, i) => {
                      const wUser = w.artist;
                      const wId = wUser?._id || wUser;
                      const wImg = wUser?.profileImage;
                      const wImgSrc = wImg ? (wImg.startsWith('http') ? wImg : `${API_BASE}${wImg}`) : null;
                      const rankStyle = [
                         'bg-yellow-500/20 text-yellow-500 border-yellow-500/20',
                         'bg-gray-400/20 text-gray-400 border-gray-400/20',
                         'bg-orange-600/20 text-orange-600 border-orange-600/20'
                      ][w.rank - 1] || 'bg-primary/20 text-primary border-primary/20';
                      const subImg = w.imageUrl ? (w.imageUrl.startsWith('http') ? w.imageUrl : `${API_BASE}${w.imageUrl}`) : null;
                      return (
                        <div key={i} className="flex items-center justify-between gap-4 bg-dark/40 p-3 rounded-2xl border border-white/5 group/victor hover:border-primary/30 transition-all">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border ${rankStyle}`}>
                               {['🥇','🥈','🥉'][w.rank - 1] || w.rank}
                            </div>
                            <div className="w-12 h-12 rounded-full bg-surface border-2 border-white/10 shrink-0 overflow-hidden group-hover/victor:border-primary/50 transition-colors">
                              {wImgSrc ? <img src={wImgSrc} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-black text-primary text-xs">{wUser?.username?.[0]?.toUpperCase() || '?'}</div>}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-white truncate hover:text-primary transition-colors cursor-pointer" onClick={() => wId && navigate(`/profile/${wId}`)}>
                                {wUser?.username || 'Unknown Artist'}
                              </p>
                              <p className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">Host</p>
                            </div>
                          </div>
                          {subImg && (
                            <img 
                              src={subImg} 
                              alt="submission" 
                              className="w-14 h-14 rounded-xl object-cover shrink-0 cursor-pointer hover:scale-110 hover:border-primary transition-all shadow-2xl border border-white/10" 
                              onClick={() => setSelectedImage(subImg)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between gap-6 pt-8 border-t border-white/5">
                <div className="flex -space-x-3">
                  {(c.participants || []).slice(0, 5).map((p, idx) => (
                    <div key={idx} className="h-10 w-10 rounded-full border-4 border-dark-card bg-surface flex items-center justify-center text-[10px] font-black text-gray-500 ring-1 ring-white/5">
                      {(p.username?.[0] || 'V').toUpperCase()}
                    </div>
                  ))}
                  {(c.participants?.length > 5) && (
                    <div className="h-10 w-10 rounded-full border-4 border-dark-card bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary ring-1 ring-white/5">
                      +{c.participants.length - 5}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <ReportButton targetType="competition" targetId={c._id} compact />
                  
                  {isApproved(c) && !isOrganizer(c) && user?.role !== 'admin' && (
                    <div className="flex items-center gap-3">
                      {!hasJoined(c) && isActive(c) && (
                        <button onClick={() => handleJoin(c._id)} className="bg-primary text-white font-black px-8 py-3.5 rounded-[1.25rem] shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all text-[11px] uppercase tracking-[0.2em]">
                          Join Competition
                        </button>
                      )}
                      {hasJoined(c) && !hasSubmitted(c) && isActive(c) && (
                        <div className="flex gap-2">
                           <label className="flex items-center gap-3 cursor-pointer h-12 px-6 bg-surface/40 rounded-xl border border-white/5 hover:border-primary transition-all text-[10px] text-gray-400 font-black uppercase tracking-widest">
                            <Upload size={16}/>
                            {submitFile[c._id] ? 'File Ready' : 'Choose Image'}
                            <input type="file" accept="image/*" className="hidden" onChange={e => setSubmitFile(prev => ({ ...prev, [c._id]: e.target.files[0] }))}/>
                          </label>
                          {submitFile[c._id] && (
                            <button onClick={() => handleSubmit(c._id)} className="bg-primary text-white font-black h-12 px-6 rounded-xl text-[10px] uppercase tracking-widest shadow-2xl shadow-primary/20 animate-pulse">
                              Send
                            </button>
                          )}
                        </div>
                      )}
                      {hasSubmitted(c) && (
                        <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.2em] bg-primary/5 px-6 py-3 rounded-xl border border-primary/20">
                          <Check size={16}/> Entry Submitted
                        </div>
                      )}
                    </div>
                  )}
                  
                  {(isOrganizer(c) || user?.role === 'admin') && isApproved(c) && (
                    <button 
                      onClick={() => { setExpandedId(expandedId === c._id ? null : c._id); if (expandedId !== c._id) loadSubmissions(c._id); }}
                      className="h-14 px-8 rounded-[1.25rem] bg-surface/40 backdrop-blur-xl border border-white/5 text-gray-300 font-black text-[10px] uppercase tracking-[0.2em] hover:text-white hover:border-primary/40 transition-all flex items-center gap-3 group/btn"
                    >
                      {expandedId === c._id ? 'Close' : 'Review Entries'}
                      <ArrowRight size={18} className={`${expandedId === c._id ? 'rotate-90' : 'group-hover/btn:translate-x-2'} transition-transform`} />
                    </button>
                  )}
                </div>
              </div>

              {/* Entry Review */}
              {expandedId === c._id && (
                <div className="mt-8 pt-8 border-t border-white/5 space-y-6 animate-slide-up">
                  <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-3">
                       <Zap size={16} className="text-primary"/>
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Submitted Entries</p>
                    </div>
                    {isActive(c) && (
                      <button onClick={() => handleEndCompetition(c._id)} className="text-[9px] font-black text-red-500/40 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10">
                        <Clock size={12}/> End Competition
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                    {(submissions[c._id] || []).length === 0
                      ? <div className="text-center py-16 opacity-30 bg-surface/10 rounded-[2rem] border-2 border-dashed border-white/5"><Compass size={40} className="mx-auto mb-4"/><p className="text-[10px] font-black uppercase tracking-[0.2em]">No Entries</p></div>
                      : (submissions[c._id] || []).map((s, si) => {
                        const sImg = s.imageUrl ? (s.imageUrl.startsWith('http') ? s.imageUrl : `${API_BASE}${s.imageUrl}`) : null;
                        const aImg = s.artist?.profileImage ? (s.artist.profileImage.startsWith('http') ? s.artist.profileImage : `${API_BASE}${s.artist.profileImage}`) : null;
                        return (
                          <div key={si} className="flex items-center gap-5 p-4 rounded-[1.5rem] bg-dark/60 border border-white/5 hover:border-primary/40 transition-all group/sub">
                            <div className="w-12 h-12 rounded-full bg-surface border border-white/10 overflow-hidden shrink-0 flex items-center justify-center text-xs font-black text-primary shadow-2xl">
                              {aImg ? <img src={aImg} alt="" className="w-full h-full object-cover"/> : s.artist?.username?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-white truncate">{s.artist?.username || 'Unknown Artist'}</p>
                              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Submitted {new Date(s.submittedAt).toLocaleDateString()}</p>
                            </div>
                            {sImg && <img src={sImg} alt="submission" className="w-20 h-20 rounded-2xl object-cover shrink-0 cursor-pointer hover:scale-110 transition-all shadow-2xl border border-white/10" onClick={() => setSelectedImage(sImg)}/>}
                            
                            <div className="flex gap-2 ml-4">
                              {[1,2,3].map(rank => (
                                <button
                                  key={rank}
                                  onClick={() => setWinners(prev => {
                                    const cur = { ...(prev[c._id] || {}) };
                                    if (cur[rank] === (s.artist?._id || s.artist)) { delete cur[rank]; }
                                    else { cur[rank] = s.artist?._id || s.artist; }
                                    return { ...prev, [c._id]: cur };
                                  })}
                                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all duration-500 border ${(winners[c._id]?.[rank] === (s.artist?._id || s.artist)) ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/30 scale-110' : 'bg-surface/40 text-gray-600 border-white/5 hover:text-white hover:border-primary/40'}`}
                                >
                                  {['🥇','🥈','🥉'][rank-1]}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                  
                  {(submissions[c._id] || []).length > 0 && (
                    <button onClick={() => handlePickWinners(c._id)} className="w-full bg-gradient-to-r from-primary to-accent text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98] transition-all text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4">
                      <Crown size={20} className="animate-bounce"/> Save Winners
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image View */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-8 backdrop-blur-3xl animate-fade-in" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-10 right-10 text-white/40 hover:text-white bg-white/5 border border-white/10 w-16 h-16 rounded-full transition-all hover:rotate-90 flex items-center justify-center shadow-2xl" onClick={() => setSelectedImage(null)}>
            <X size={32} />
          </button>
          <img src={selectedImage} alt="Entry View" className="max-w-full max-h-[85vh] object-contain rounded-[2.5rem] shadow-[0_0_100px_rgba(124,58,237,0.3)] border border-white/10" onClick={(e) => e.stopPropagation()} />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-dark/60 backdrop-blur-2xl px-6 py-3 rounded-full border border-white/10 text-[10px] font-black text-white uppercase tracking-[0.4em]">
             Image Preview
          </div>
        </div>
      )}
    </div>
  );
}
