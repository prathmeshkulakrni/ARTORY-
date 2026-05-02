import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Trophy, Clock, Plus, X, Medal, Check, Ban, Upload, Users, Crown } from 'lucide-react';
import ReportButton from '../components/ReportButton';

const API_BASE = 'http://localhost:5000';

export default function Competitions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comps, setComps] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: '', deadline: '', prize: '' });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  // Per-competition expansion and submission state
  const [expandedId, setExpandedId] = useState(null);
  const [submitFile, setSubmitFile] = useState({});
  const [submissions, setSubmissions] = useState({});   // { compId: [submissions] }
  const [winners, setWinners] = useState({});           // { compId: {rank, artistId} }
  const [showWinnerModal, setShowWinnerModal] = useState(null); // compId
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
      toast.success('Hosting request sent! Waiting for admin approval.');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleApproval = async (id, status) => {
    try {
      await api.put(`/competition/${id}/approve`, { status });
      setComps(prev => prev.map(c => c._id === id ? { ...c, status } : c));
      toast.success(`Competition ${status}`);
    } catch { toast.error('Failed to update status'); }
  };

  const handleJoin = async (id) => {
    try {
      await api.post(`/competition/${id}/join`);
      setComps(prev => prev.map(c => c._id === id ? { ...c, participants: [...(c.participants || []), { _id: user._id }] } : c));
      toast.success('Joined competition!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to join'); }
  };

  const handleSubmit = async (compId) => {
    const file = submitFile[compId];
    if (!file) return toast.error('Please select an image first');
    const fd = new FormData();
    fd.append('submissionImage', file);
    try {
      await api.post(`/competition/${compId}/submit`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Submission uploaded!');
      setSubmitFile(prev => ({ ...prev, [compId]: null }));
      fetchComps();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit'); }
  };

  const loadSubmissions = async (compId) => {
    try {
      const r = await api.get(`/competition/${compId}/submissions`);
      setSubmissions(prev => ({ ...prev, [compId]: r.data }));
    } catch (err) { toast.error(err.response?.data?.message || 'Cannot view submissions'); }
  };

  const handlePickWinners = async (compId) => {
    const picked = winners[compId];
    if (!picked || Object.keys(picked).length === 0) return toast.error('Select at least 1 winner');
    const winnersArr = Object.entries(picked).map(([rank, artistId]) => ({ rank: Number(rank), artistId }));
    try {
      const r = await api.post(`/competition/${compId}/winners`, { winners: winnersArr });
      setComps(prev => prev.map(c => c._id === compId ? { ...c, winners: r.data.winners } : c));
      setShowWinnerModal(null);
      toast.success('Winners announced! 🏆');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to pick winners'); }
  };

  const handleEndCompetition = async (compId) => {
    if (!window.confirm("Are you sure you want to end this competition now?")) return;
    try {
      const r = await api.put(`/competition/${compId}/end`);
      setComps(prev => prev.map(c => c._id === compId ? { ...c, deadline: r.data.comp.deadline } : c));
      toast.success('Competition ended!');
    } catch (err) { 
      console.error("End competition error:", err);
      toast.error(err.response?.data?.message || err.message || 'Failed to end competition'); 
    }
  };

  const timeLeft = (d) => {
    const diff = new Date(d) - new Date();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / 86400000);
    return days > 0 ? `${days}d left` : `${Math.floor(diff / 3600000)}h left`;
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
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Competitions</h1>
          <p className="text-gray-400 mt-1">Compete and win recognition</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
          {showCreate ? <><X size={18}/> Cancel</> : <><Plus size={18}/> Request to Host</>}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={create} className="card mb-8 space-y-4 animate-slide-up">
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input" placeholder="Competition title" required />
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input h-20 resize-none" placeholder="Description & Hosting details" required />
          <div className="grid grid-cols-2 gap-4">
            <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input" placeholder="Category" />
            <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="input" required />
          </div>
          <input value={form.prize} onChange={e => setForm({...form, prize: e.target.value})} className="input" placeholder="Prize (optional)" />
          <button type="submit" className="btn-primary">Submit Hosting Request</button>
        </form>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-dark-border pb-px overflow-x-auto">
        {(user?.role === 'admin'
          ? [['all','All'],['active','Active'],['ended','Ended'],['pending','Pending']]
          : [['all','All'],['active','Active'],['ended','Ended'],['mine','My Requests']]
        ).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-3 text-sm font-semibold whitespace-nowrap capitalize transition-colors border-b-2 ${tab === key ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
            {label}
            {key === 'pending' && comps.filter(c => c.status === 'pending').length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{comps.filter(c => c.status === 'pending').length}</span>
            )}
          </button>
        ))}
      </div>

      {loading
        ? <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin"/></div>
        : filteredComps.length === 0
          ? <div className="text-center py-20 card"><p className="text-5xl mb-3">🏆</p><p className="text-gray-400">No competitions found</p></div>
          : <div className="grid md:grid-cols-2 gap-6">
              {filteredComps.map(c => (
                <div key={c._id} className="card group hover:border-yellow-500/40 flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                      <Trophy size={24} className="text-yellow-400"/>
                    </div>
                    <span className={`badge ${new Date(c.deadline) > new Date() ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      <Clock size={10} className="inline mr-1"/>{timeLeft(c.deadline)}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{c.title}</h3>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2 flex-1">{c.description}</p>
                  {c.prize && <p className="text-sm text-yellow-400 mb-3 flex items-center gap-1"><Medal size={14}/> {c.prize}</p>}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`badge ${c.status === 'approved' ? 'bg-green-500/20 text-green-400' : c.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-300'}`}>
                        {c.status || 'pending'}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Users size={11}/> {c.participants?.length || 0}</span>
                    </div>
                    <ReportButton targetType="competition" targetId={c._id} compact />
                  </div>

                  {/* ── Winners Display (always visible if exists) ── */}
                  {c.winners && c.winners.length > 0 && (
                    <div className="mb-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                      <p className="text-xs text-yellow-400 font-semibold mb-2 flex items-center gap-1"><Crown size={12}/> Winners</p>
                      <div className="space-y-2">
                        {[...c.winners].sort((a, b) => a.rank - b.rank).map((w, i) => {
                          const wUser = w.artist;
                          const wId = wUser?._id || wUser;
                          const wImg = wUser?.profileImage;
                          const wImgSrc = wImg ? (wImg.startsWith('http') ? wImg : `${API_BASE}${wImg}`) : null;
                          const rankEmoji = ['🥇','🥈','🥉'][w.rank - 1] || `#${w.rank}`;
                          const subImg = w.imageUrl ? (w.imageUrl.startsWith('http') ? w.imageUrl : `${API_BASE}${w.imageUrl}`) : null;
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-lg">{rankEmoji}</span>
                              {/* Profile avatar */}
                              <button onClick={() => wId && navigate(`/profile/${wId}`)} className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-primary/30 flex-shrink-0 overflow-hidden flex items-center justify-center text-primary font-bold text-xs">
                                  {wImgSrc ? <img src={wImgSrc} alt="" className="w-full h-full object-cover"/> : (wUser?.username?.[0]?.toUpperCase() || '?')}
                                </div>
                                <span className="text-sm text-white hover:text-primary truncate">{wUser?.username || 'Unknown'}</span>
                              </button>
                              {/* Submitted image thumbnail */}
                              {subImg && (
                                <img src={subImg} alt="submission" className="w-10 h-10 rounded-lg object-cover border border-yellow-500/30 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setSelectedImage(subImg)}/>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Admin: Approve/Reject ── */}
                  {user?.role === 'admin' && tab === 'pending' && c.status === 'pending' && (
                    <div className="flex gap-2 pt-3 border-t border-dark-border">
                      <button onClick={() => handleApproval(c._id, 'approved')} className="flex-1 btn-primary bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white flex items-center justify-center gap-2"><Check size={16}/> Approve</button>
                      <button onClick={() => handleApproval(c._id, 'rejected')} className="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all"><Ban size={16}/> Reject</button>
                    </div>
                  )}

                  {/* ── Regular user actions ── */}
                  {isApproved(c) && !isOrganizer(c) && user?.role !== 'admin' && (
                    <div className="pt-3 border-t border-dark-border space-y-3">
                      {/* Join */}
                      {!hasJoined(c) && isActive(c) && (
                        <button onClick={() => handleJoin(c._id)} className="w-full btn-primary flex items-center justify-center gap-2">
                          <Users size={16}/> Join Competition
                        </button>
                      )}
                      {hasJoined(c) && !hasSubmitted(c) && isActive(c) && (
                        <div className="space-y-2">
                          <p className="text-xs text-green-400 font-medium">✓ You're in — submit your artwork</p>
                          <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border border-dashed border-dark-border hover:border-primary text-sm text-gray-400 hover:text-primary transition-colors">
                            <Upload size={14}/>
                            {submitFile[c._id] ? submitFile[c._id].name : 'Choose submission image'}
                            <input type="file" accept="image/*" className="hidden" onChange={e => setSubmitFile(prev => ({ ...prev, [c._id]: e.target.files[0] }))}/>
                          </label>
                          {submitFile[c._id] && (
                            <button onClick={() => handleSubmit(c._id)} className="w-full btn-primary flex items-center justify-center gap-2">
                              <Upload size={16}/> Submit Entry
                            </button>
                          )}
                        </div>
                      )}
                      {hasSubmitted(c) && (
                        <p className="text-xs text-primary text-center font-medium">✅ Submission received!</p>
                      )}
                      {hasJoined(c) && !isActive(c) && !hasSubmitted(c) && (
                        <p className="text-xs text-gray-500 text-center">Competition ended — no submission</p>
                      )}
                    </div>
                  )}

                  {/* ── Organizer actions ── */}
                  {(isOrganizer(c) || user?.role === 'admin') && isApproved(c) && (
                    <div className="pt-3 border-t border-dark-border space-y-2">
                      {isActive(c) && (
                        <button
                          onClick={() => handleEndCompetition(c._id)}
                          className="w-full text-sm text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white flex items-center justify-center gap-2 py-2 rounded-xl transition-all mb-2"
                        >
                          <Clock size={14} /> End Competition Now
                        </button>
                      )}
                      <button
                        onClick={() => { setExpandedId(expandedId === c._id ? null : c._id); if (expandedId !== c._id) loadSubmissions(c._id); }}
                        className="w-full text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-surface transition-colors"
                      >
                        {expandedId === c._id ? <X size={14}/> : <Trophy size={14}/>}
                        {expandedId === c._id ? 'Hide Submissions' : 'View Submissions'}
                      </button>

                      {expandedId === c._id && (
                        <div className="space-y-2 mt-2 max-h-56 overflow-y-auto">
                          {(submissions[c._id] || []).length === 0
                            ? <p className="text-xs text-gray-500 text-center py-4">No submissions yet</p>
                            : (submissions[c._id] || []).map((s, si) => {
                              const sImg = s.imageUrl ? (s.imageUrl.startsWith('http') ? s.imageUrl : `${API_BASE}${s.imageUrl}`) : null;
                              const aImg = s.artist?.profileImage ? (s.artist.profileImage.startsWith('http') ? s.artist.profileImage : `${API_BASE}${s.artist.profileImage}`) : null;
                              return (
                                <div key={si} className="flex items-center gap-3 p-2 rounded-xl bg-dark">
                                  <div className="w-8 h-8 rounded-full bg-primary/20 overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-bold text-primary">
                                    {aImg ? <img src={aImg} alt="" className="w-full h-full object-cover"/> : s.artist?.username?.[0]?.toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">{s.artist?.username || 'Unknown'}</p>
                                    <p className="text-xs text-gray-500">{new Date(s.submittedAt).toLocaleDateString()}</p>
                                  </div>
                                  {sImg && <img src={sImg} alt="submission" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setSelectedImage(sImg)}/>}
                                  {/* Pick as winner */}
                                  <div className="flex flex-col gap-1">
                                    {[1,2,3].map(rank => (
                                      <button
                                        key={rank}
                                        onClick={() => setWinners(prev => {
                                          const cur = { ...(prev[c._id] || {}) };
                                          if (cur[rank] === (s.artist?._id || s.artist)) { delete cur[rank]; }
                                          else { cur[rank] = s.artist?._id || s.artist; }
                                          return { ...prev, [c._id]: cur };
                                        })}
                                        title={`Set as #${rank}`}
                                        className={`text-xs px-1.5 py-0.5 rounded transition-all ${(winners[c._id]?.[rank] === (s.artist?._id || s.artist)) ? 'bg-yellow-500 text-black font-bold' : 'bg-dark-border text-gray-400 hover:bg-yellow-500/20'}`}
                                      >
                                        {'🥇🥈🥉'[rank-1]}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })
                          }
                          {(submissions[c._id] || []).length > 0 && (
                            <button onClick={() => handlePickWinners(c._id)} className="w-full btn-primary flex items-center justify-center gap-2 mt-2">
                              <Crown size={16}/> Announce Winners
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
      }

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-red-500 bg-black/50 p-2 rounded-full transition-colors" onClick={() => setSelectedImage(null)}>
            <X size={24} />
          </button>
          <img src={selectedImage} alt="Fullscreen View" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
