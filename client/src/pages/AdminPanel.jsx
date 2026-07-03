import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Shield, Users, Image as ImageIcon, Layers, Trash2, FileWarning, BadgeCheck, Trophy, Check, Ban, Activity, AlertTriangle, UserCheck, Zap, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

const statCards = [
  { key: 'totalUsers', label: 'Registered Artists', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { key: 'totalArtworks', label: 'Submitted Artworks', icon: ImageIcon, color: 'text-primary', bg: 'bg-primary/10' },
  { key: 'totalCommunities', label: 'Active Communities', icon: Layers, color: 'text-accent', bg: 'bg-accent/10' }
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState({
    stats: { totalUsers: 0, totalArtworks: 0, totalCommunities: 0 },
    users: [],
    artworks: [],
    communities: [],
    reports: [],
    verificationRequests: [],
    competitionRequests: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setDashboard(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load command center');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleDelete = async (type, id) => {
    const label = type.slice(0, -1);
    if (!window.confirm(`Critical: Permanent deletion of ${label}. Proceed?`)) return;

    try {
      await api.delete(`/admin/${type}/${id}`);
      setDashboard((prev) => ({
        ...prev,
        [type]: prev[type].filter((item) => item._id !== id),
        stats: {
            ...prev.stats,
            totalUsers: type === 'users' ? Math.max(0, prev.stats.totalUsers - 1) : prev.stats.totalUsers,
            totalArtworks: type === 'artworks' ? Math.max(0, prev.stats.totalArtworks - 1) : prev.stats.totalArtworks,
            totalCommunities: type === 'communities' ? Math.max(0, prev.stats.totalCommunities - 1) : prev.stats.totalCommunities
        }
      }));
      toast.success(`${label} record purged`);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to purge ${label}`);
    }
  };

  const reviewReport = async (id) => {
    try {
      await api.put(`/admin/reports/${id}/review`);
      setDashboard((prev) => ({
        ...prev,
        reports: prev.reports.map((item) => item._id === id ? { ...item, status: 'reviewed' } : item)
      }));
      toast.success('Security report resolved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update report');
    }
  };

  const reviewVerification = async (id, status) => {
    try {
      await api.put(`/verification/${id}/review`, { status });
      setDashboard((prev) => ({
        ...prev,
        verificationRequests: prev.verificationRequests.map((item) => item._id === id ? { ...item, status } : item)
      }));
      toast.success(`Identity ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify identity');
    }
  };

  const reviewCompetition = async (id, status) => {
    try {
      await api.put(`/competition/${id}/approve`, { status });
      setDashboard((prev) => ({
        ...prev,
        competitionRequests: prev.competitionRequests.map((item) => item._id === id ? { ...item, status } : item)
      }));
      toast.success(`Competition ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to authorize competition');
    }
  };

  const fileSrc = (path) => path?.startsWith('http') ? path : `${API_BASE}${path}`;
  const openProfile = (userId) => { if (userId) navigate(`/profile/${userId}`); };

  const renderTargetSummary = (report) => {
    const target = report.target;
    if (!target) return <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mt-2">Target Null - Reference: {report.targetId}</p>;

    const owner = target.artist || target.creator || target.organizer;
    return (
      <div className="mt-3 p-3 rounded-xl bg-dark/40 border border-white/5 space-y-1.5 text-[11px]">
        <div className="flex justify-between">
           <span className="text-gray-500 uppercase font-black tracking-tight">Entity</span>
           <span className="text-white font-bold">{target.title || target.name || target.username || 'Unidentified'}</span>
        </div>
        {owner?.username && (
          <div className="flex justify-between">
            <span className="text-gray-500 uppercase font-black tracking-tight">Proprietor</span>
            <button onClick={() => openProfile(owner._id)} className="text-primary hover:underline font-bold">{owner.username}</button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">Loading Admin Panel...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in space-y-12 pb-20">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-dark-border/40 pb-10">
        <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center text-primary shadow-2xl shadow-primary/10">
               <Shield size={40} strokeWidth={1.5} />
            </div>
            <div>
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest mb-3">
                  <Activity size={12}/> System Active
               </div>
               <h1 className="text-5xl font-black text-white tracking-tighter leading-none">Admin <span className="text-primary italic">Panel</span></h1>
            </div>
        </div>

      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        {statCards.map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className="bg-dark-card border border-white/5 rounded-[2.5rem] p-8 hover:border-primary/30 transition-all group shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{label}</p>
                <div className="flex items-end gap-2 mt-2">
                   <p className="text-5xl font-black text-white tracking-tighter">{dashboard.stats[key] || 0}</p>
                   <div className="mb-1 text-green-500 flex items-center text-[10px] font-black">
                      <Zap size={12}/> +4%
                   </div>
                </div>
              </div>
              <div className={`w-16 h-16 rounded-2xl ${bg} ${color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner`}>
                <Icon size={32} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-dark/40 p-2 rounded-[2rem] border border-white/5 flex-wrap">
        {['users', 'communities', 'artworks', 'reports', 'verification', 'competitions'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-500 hover:text-white hover:bg-surface/40'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="animate-slide-up">
        {activeTab === 'users' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {dashboard.users.map((item) => (
              <div key={item._id} className="bg-dark-card border border-white/5 p-6 rounded-3xl flex items-center justify-between group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center font-black text-primary border border-white/5">
                      {item.username[0].toUpperCase()}
                   </div>
                   <div>
                    <button onClick={() => openProfile(item._id)} className="font-black text-white hover:text-primary transition-colors text-lg tracking-tight">{item.username}</button>
                    <p className="text-xs text-gray-500 font-bold">{item.email}</p>
                    <div className="flex gap-2 mt-2">
                       <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${item.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-surface text-gray-400'}`}>{item.role}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDelete('users', item._id)} className="w-11 h-11 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'communities' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {dashboard.communities.map((item) => (
              <div key={item._id} className="bg-dark-card border border-white/5 p-6 rounded-3xl flex items-center justify-between group hover:border-accent/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-accent/10 border border-white/5 flex items-center justify-center shadow-inner">
                    {item.coverImage ? <img src={`${API_BASE}${item.coverImage}`} alt="" className="w-full h-full object-cover" /> : <Layers size={24} className="text-accent" />}
                  </div>
                  <div>
                    <p className="font-black text-white text-lg tracking-tight">{item.name}</p>
                    <p className="text-[10px] text-accent font-black uppercase tracking-widest">{item.category}</p>
                    <p className="text-xs text-gray-500 font-bold mt-1">{item.members?.length || 0} Artists</p>
                  </div>
                </div>
                <button onClick={() => handleDelete('communities', item._id)} className="w-11 h-11 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'artworks' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {dashboard.artworks.map((item) => (
              <div key={item._id} className="bg-dark-card border border-white/5 p-6 rounded-3xl flex items-center justify-between group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-primary/10 border border-white/5 flex items-center justify-center shadow-inner">
                    {item.imageUrl ? <img src={item.imageUrl.startsWith('http') ? item.imageUrl : `${API_BASE}${item.imageUrl}`} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={28} className="text-primary" />}
                  </div>
                  <div>
                    <p className="font-black text-white text-lg tracking-tight">{item.title || 'Untitled Gallery'}</p>
                    <p className="text-xs text-gray-500 font-bold">
                       by {item.artist?._id ? <button onClick={() => openProfile(item.artist._id)} className="text-primary hover:underline">{item.artist.username}</button> : 'Rogue Creator'}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDelete('artworks', item._id)} className="w-11 h-11 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            {dashboard.reports.map((item) => (
              <div key={item._id} className="bg-dark-card border border-red-500/10 p-8 rounded-[2.5rem] flex items-center justify-between gap-8 group hover:bg-red-500/5 transition-all">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shadow-inner">
                     <AlertTriangle size={28} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                       <h3 className="font-black text-white text-xl tracking-tight uppercase">{item.targetType} Breach</h3>
                       <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.status === 'reviewed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{item.status}</span>
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Reporter: {item.reporter?._id ? <button onClick={() => openProfile(item.reporter._id)} className="text-primary hover:underline font-bold">{item.reporter.username}</button> : 'Anonymous'}</p>
                    <p className="text-sm text-white font-bold bg-dark/40 px-3 py-2 rounded-xl border border-white/5 inline-block">Reason: {item.reason}</p>
                    {item.details && <p className="text-sm text-gray-500 italic mt-2">"{item.details}"</p>}
                    {renderTargetSummary(item)}
                  </div>
                </div>
                {item.status !== 'reviewed' && (
                   <button onClick={() => reviewReport(item._id)} className="bg-primary text-white font-black px-8 py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all shrink-0">
                      Resolve Incident
                   </button>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="space-y-6">
            {dashboard.verificationRequests.map((item) => (
              <div key={item._id} className="bg-dark-card border border-blue-500/10 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-10 group hover:border-blue-500/30 transition-all">
                <div className="flex items-start gap-6 flex-1">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-inner shrink-0">
                     <UserCheck size={32} />
                  </div>
                  <div className="space-y-4 w-full">
                    <div>
                       <button onClick={() => openProfile(item.applicant?._id)} className="text-2xl font-black text-white hover:text-primary transition-colors tracking-tight">{item.applicant?.username}</button>
                       <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">{item.applicant?.email}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[
                        ['ID Manifest', item.aadhaarImage],
                        ['Face Photo', item.passportPhoto],
                        ['Credentials', item.certificateImage || item.profilePhoto]
                      ].filter(([, path]) => path).map(([label, path]) => (
                        <a key={label} href={fileSrc(path)} target="_blank" rel="noreferrer" className="block group/img">
                          <div className="relative rounded-2xl overflow-hidden border border-white/5 aspect-video mb-2 shadow-xl transition-all group-hover/img:border-primary/40">
                             <img src={fileSrc(path)} alt={label} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                <ExternalLink size={20} className="text-white"/>
                             </div>
                          </div>
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest text-center block">{label}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
                
                {item.status === 'pending' ? (
                  <div className="flex flex-col gap-3 w-full md:w-auto">
                    <button onClick={() => reviewVerification(item._id, 'approved')} className="bg-green-500/20 text-green-400 border border-green-500/30 font-black px-8 py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-3">
                       <Check size={16}/> Grant Authorization
                    </button>
                    <button onClick={() => reviewVerification(item._id, 'rejected')} className="bg-red-500/10 text-red-400 border border-red-500/20 font-black px-8 py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3">
                       <Ban size={16}/> Deny Credentials
                    </button>
                  </div>
                ) : (
                  <span className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] ${item.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                     Identity {item.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'competitions' && (
          <div className="space-y-6">
            {dashboard.competitionRequests.map((item) => (
              <div key={item._id} className="bg-dark-card border border-yellow-500/10 p-8 rounded-[3rem] space-y-8 group hover:border-yellow-500/30 transition-all">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-10">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center shadow-inner shrink-0">
                       <Trophy size={32} />
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                         <h3 className="text-3xl font-black text-white tracking-tighter">{item.title}</h3>
                         <span className="px-3 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 text-[10px] font-black uppercase tracking-widest">Competition Request</span>
                      </div>
                      <p className="text-gray-400 font-medium leading-relaxed max-w-2xl">{item.description}</p>
                      
                      <div className="grid sm:grid-cols-2 gap-4 text-[11px] font-black uppercase tracking-widest">
                        <div className="bg-dark/40 p-4 rounded-2xl border border-white/5">
                           <p className="text-gray-500 mb-1">Architect</p>
                           <button onClick={() => openProfile(item.organizer?._id)} className="text-primary hover:underline">{item.organizer?.username || 'Redacted'}</button>
                        </div>
                        <div className="bg-dark/40 p-4 rounded-2xl border border-white/5">
                           <p className="text-gray-500 mb-1">Sector</p>
                           <p className="text-white">{item.category || 'Global'}</p>
                        </div>
                        <div className="bg-dark/40 p-4 rounded-2xl border border-white/5">
                           <p className="text-gray-500 mb-1">Window</p>
                           <p className="text-white">{item.deadline ? new Date(item.deadline).toLocaleDateString() : 'Infinite'}</p>
                        </div>
                        <div className="bg-dark/40 p-4 rounded-2xl border border-white/5">
                           <p className="text-gray-500 mb-1">Prize</p>
                           <p className="text-accent">{item.prize || 'Glory Only'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {item.coverImage && (
                    <div className="w-full lg:w-48 h-32 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shrink-0">
                       <img src={`${API_BASE}${item.coverImage}`} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {item.status === 'pending' && (
                  <div className="flex gap-4 pt-4">
                    <button onClick={() => reviewCompetition(item._id, 'approved')} className="flex-1 bg-green-500/20 text-green-400 border border-green-500/30 font-black py-5 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-3">
                       <Check size={18}/> Approve Competition
                    </button>
                    <button onClick={() => reviewCompetition(item._id, 'rejected')} className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 font-black py-5 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3">
                       <Ban size={18}/> Decommission Req
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
