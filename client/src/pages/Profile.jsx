import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Camera, Edit3, Save, UserPlus, UserCheck, BadgeCheck, MessageCircle, MoreVertical, MapPin, Link as LinkIcon, Calendar, Image as ImageIcon, Star, Folder, Shield, Zap, Sparkles, ArrowRight, Check, X, Target, Palette, Clock, Upload, Trophy } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import ImageViewerModal from '../components/ImageViewerModal';
import ReportButton from '../components/ReportButton';
import ArtistReviewSection from '../components/ArtistReviewSection';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isOwnProfile = !id || id === user?._id;

  const [profile, setProfile] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: '', bio: '', skills: '' });
  const [tab, setTab] = useState('artworks');
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationFiles, setVerificationFiles] = useState({ aadhaarImage: null, passportPhoto: null, certificateImage: null });
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      toast.error('The optical module is currently offline');
      setShowCamera(false);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasRef.current.toBlob((blob) => {
        const file = new File([blob], 'passport.jpg', { type: 'image/jpeg' });
        setVerificationFiles(prev => ({ ...prev, passportPhoto: file }));
        stopCamera();
      }, 'image/jpeg');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    setShowCamera(false);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const targetId = id || user?._id;
        if (!targetId) return;
        const res = isOwnProfile ? await api.get('/auth/me') : await api.get(`/auth/user/${targetId}`);
        setProfile(res.data);
        setArtworks(res.data.artworks || []);
        if (isOwnProfile) {
          setForm({ username: res.data.username, bio: res.data.bio || '', skills: (res.data.skills || []).join(', ') });
        } else {
          setIsFollowing(res.data.followers?.some(f => f._id === user?._id));
        }
      } catch {
        toast.error('Could not load identity check');
      }
    };
    fetchProfile();
  }, [id, user, isOwnProfile]);

  useEffect(() => {
    if (!isOwnProfile) return;
    api.get('/verification/me').then((res) => setVerificationStatus(res.data)).catch(() => {});
  }, [isOwnProfile]);

  const handleSave = async () => {
    try {
      const res = await api.put('/auth/profile', { ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) });
      setProfile(res.data);
      updateUser(res.data);
      setEditing(false);
      toast.success('Identity profile saved!');
    } catch { toast.error('Drawnization failed'); }
  };

  const handleProfileImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('profileImage', file);
    try {
      const res = await api.put('/auth/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile({ ...profile, profileImage: res.data.profileImage, isVerified: res.data.isVerified });
      updateUser(res.data);
      toast.success('Visual representation updated!');
    } catch { toast.error('Visual update failed'); }
  };

  const handleFollow = async () => {
    try {
      const res = await api.post(`/social/follow/${profile._id}`);
      setIsFollowing(res.data.following);
      setProfile(prev => ({
        ...prev,
        followers: res.data.following
          ? [...(prev.followers || []), { _id: user._id }]
          : (prev.followers || []).filter(f => f._id !== user._id)
      }));
    } catch { toast.error('Could not update follow status'); }
  };

  const handleArtworkDeleted = (artworkId) => {
    setArtworks(prev => prev.filter(art => art._id !== artworkId));
    setSelectedArtwork(null);
  };

  const submitVerification = async (e) => {
    e.preventDefault();
    if (!verificationFiles.passportPhoto) { toast.error('Optical biometric data is required'); return; }
    const formData = new FormData();
    formData.append('aadhaarImage', verificationFiles.aadhaarImage);
    formData.append('passportPhoto', verificationFiles.passportPhoto);
    formData.append('certificateImage', verificationFiles.certificateImage);
    try {
      const { data } = await api.post('/verification', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setVerificationStatus(data);
      toast.success('Artist status requested');
    } catch (err) { toast.error(err.response?.data?.message || 'Verification request failed'); }
  };

  if (!profile) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-6">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-[1.5rem] animate-spin"/>
      <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">Retrieving Profile Matrix...</p>
    </div>
  );

  const imgSrc = profile.profileImage ? (profile.profileImage.startsWith('http') ? profile.profileImage : `${API_BASE}${profile.profileImage}`) : null;

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-20 px-4 md:px-0 selection:bg-primary selection:text-white">
      {/* Dynamic Profile Hero Header */}
      <div className="relative h-[400px] md:h-[500px] rounded-[3.5rem] overflow-hidden mb-32 group shadow-2xl">
        <div className="absolute inset-0 bg-dark">
           <img 
            src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-[2s]" 
            alt="cover" 
           />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
        
        {/* Animated UI Overlay */}
        <div className="absolute top-10 left-10 right-10 flex justify-between items-start pointer-events-none">
           <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-dark/40 backdrop-blur-3xl border border-white/5">
              <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Network Active</p>
           </div>
           <div className="px-6 py-3 rounded-2xl bg-dark/40 backdrop-blur-3xl border border-white/5">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Artist Gallery #{profile._id?.slice(-8).toUpperCase()}</p>
           </div>
        </div>

        {/* Profile Identity Console */}
        <div className="absolute inset-0 px-12 flex flex-col lg:flex-row items-center justify-between gap-10">
           <div className="flex flex-col lg:flex-row items-end gap-10 w-full lg:w-auto">
             <div className="relative group/avatar">
               <div className="w-48 h-48 md:w-64 md:h-64 rounded-[3.5rem] border-[12px] border-dark bg-surface shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center transform group-hover/avatar:-rotate-2 transition-transform duration-700 relative">
                 {imgSrc ? (
                   <img src={imgSrc} className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-1000" alt="" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-7xl font-black text-primary bg-gradient-to-br from-primary/10 to-accent/10">
                     {profile.username?.[0]?.toUpperCase()}
                   </div>
                 )}
                 {profile.isVerified && (
                   <div className="absolute top-4 right-4 bg-primary p-2 rounded-2xl shadow-2xl border border-white/20">
                      <BadgeCheck size={20} className="text-white"/>
                   </div>
                 )}
               </div>
               {isOwnProfile && (
                 <label className="absolute inset-0 flex items-center justify-center bg-primary/40 backdrop-blur-sm rounded-[3rem] opacity-0 group-hover/avatar:opacity-100 cursor-pointer transition-all duration-500 scale-95 group-hover/avatar:scale-100">
                   <div className="flex flex-col items-center gap-3">
                      <Camera size={44} className="text-white" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Update Bio-ID</span>
                   </div>
                   <input type="file" accept="image/*" onChange={handleProfileImage} className="hidden" />
                 </label>
               )}
             </div>
             
             <div className="text-center lg:text-left space-y-4">
               <div className="space-y-1">
                 <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none group-hover:text-primary transition-colors">
                   {profile.username}
                 </h1>
                 <p className="text-primary font-black text-lg uppercase tracking-[0.2em] opacity-80 italic">@{profile.username?.toLowerCase()}</p>
               </div>
               <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
                 <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    <MapPin size={16} className="text-primary"/>
                    <span className="text-xs font-black text-gray-300 uppercase tracking-widest">Global Sector</span>
                 </div>
                 <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    <Calendar size={16} className="text-primary"/>
                    <span className="text-xs font-black text-gray-300 uppercase tracking-widest">Submitted {new Date(profile.createdAt).getFullYear()}</span>
                 </div>
               </div>
             </div>
           </div>

           <div className="flex items-center gap-5">
             {isOwnProfile ? (
               <button onClick={() => editing ? handleSave() : setEditing(true)} className="h-16 px-12 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] bg-gradient-to-r from-primary to-accent text-white shadow-[0_20px_50px_-10px_rgba(124,58,237,0.5)] hover:shadow-primary/60 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-4">
                 {editing ? <><Save size={20}/> Save Profile</> : <><Edit3 size={20}/> Edit Profile</>}
               </button>
             ) : (
               <>
                 <button onClick={handleFollow} className={`h-16 px-12 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center gap-4 shadow-2xl ${isFollowing ? 'bg-surface/60 border border-white/10 text-white hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20' : 'bg-gradient-to-r from-primary to-accent text-white hover:shadow-primary/40 hover:-translate-y-1'}`}>
                   {isFollowing ? <><UserCheck size={20}/> Art Linked</> : <><UserPlus size={20}/> Link Identity</>}
                 </button>
                 <button onClick={() => navigate('/chat', { state: { openDM: profile } })} className="h-16 w-16 rounded-[1.5rem] bg-surface/40 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:border-primary/50 transition-all text-gray-400 hover:text-white hover:-translate-y-1 group">
                   <MessageCircle size={26} className="group-hover:rotate-12 transition-transform"/>
                 </button>
               </>
             )}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
        {/* Global Intelligence Sidebar */}
        <div className="lg:col-span-4 space-y-10">
           {/* Biometric Stats Console */}
           <div className="bg-dark-card border border-white/5 rounded-[3rem] p-10 flex justify-around items-center shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="text-center group/stat cursor-pointer relative z-10">
               <p className="text-4xl font-black text-white group-hover/stat:text-primary transition-colors tracking-tighter">{artworks.length}</p>
               <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mt-2">Gallery</p>
             </div>
             <div className="h-12 w-px bg-white/5" />
             <div className="text-center group/stat cursor-pointer relative z-10">
               <p className="text-4xl font-black text-white group-hover/stat:text-primary transition-colors tracking-tighter">{profile.followers?.length || 0}</p>
               <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mt-2">Members</p>
             </div>
             <div className="h-12 w-px bg-white/5" />
             <div className="text-center group/stat cursor-pointer relative z-10">
               <p className="text-4xl font-black text-white group-hover/stat:text-primary transition-colors tracking-tighter">{profile.following?.length || 0}</p>
               <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mt-2">Links</p>
             </div>
           </div>

           {/* Artist Bio Card */}
           <div className="bg-dark-card border border-white/5 rounded-[3.5rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
             <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent/5 rounded-full blur-[60px]" />
             
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-3">
                     <Shield size={16} className="text-primary" /> Artist Intelligence
                   </h3>
                   {isOwnProfile && !editing && <Edit3 size={14} className="text-gray-700 cursor-pointer hover:text-primary transition-colors" onClick={() => setEditing(true)}/>}
                </div>
                {editing ? (
                   <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="w-full bg-surface/40 border border-white/10 rounded-[2rem] p-6 text-[13px] font-medium text-white resize-none h-40 focus:border-primary/50 transition-all outline-none leading-relaxed" placeholder="Write a short bio..." />
                ) : (
                   <p className="text-gray-400 font-medium text-sm leading-[1.8] tracking-tight">{profile.bio || "This artist has not yet defined their bio."}</p>
                )}
             </div>

             {profile.skills?.length > 0 && (
               <div className="space-y-6">
                 <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Technical Proficiencies</h3>
                 <div className="flex flex-wrap gap-3">
                   {profile.skills.map((s, i) => (
                     <div key={i} className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary/5 border border-primary/20 hover:border-primary/50 transition-all group/skill">
                        <Zap size={12} className="text-primary group-hover/skill:scale-125 transition-transform" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{s}</span>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             <div className="space-y-4 pt-8 border-t border-white/5">
                <div className="flex items-center gap-4 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-primary transition-colors cursor-pointer group">
                  <Target size={18} className="text-primary group-hover:rotate-45 transition-transform" /> <span>Global Grid: Sector-01</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-primary transition-colors cursor-pointer group">
                  <LinkIcon size={18} className="text-primary group-hover:rotate-12 transition-transform" /> <span>artory.io/{profile.username?.toLowerCase()}</span>
                </div>
             </div>
             
             {!isOwnProfile && <div className="pt-4"><ReportButton targetType="user" targetId={profile._id} compact /></div>}
           </div>
           
           {isOwnProfile && editing && (
              <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-10 space-y-6 animate-slide-up shadow-2xl">
                <div className="flex items-center gap-4 mb-2">
                   <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center"><Palette size={20} className="text-primary"/></div>
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Identity Matrix</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-2">Username Override</label>
                  <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full bg-surface/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-black focus:border-primary/50 transition-all outline-none" placeholder="Username" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-2">Proficiencies (Separated)</label>
                  <input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} className="w-full bg-surface/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-black focus:border-primary/50 transition-all outline-none" placeholder="Skills (comma separated)" />
                </div>
              </div>
           )}
        </div>

        {/* Art Feed Content */}
        <div className="lg:col-span-8">
           <div className="flex items-center gap-10 mb-12 border-b border-white/5 relative">
             {[
               { id: 'artworks', icon: ImageIcon, label: 'Portfolio Matrix' },
               { id: 'reviews', icon: Star, label: 'Peer Reviews' },
               { id: 'about', icon: Sparkles, label: 'Authentication' }
             ].map(t => (
               <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-3 pb-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-[4px] -mb-[4px] relative group ${tab === t.id ? 'text-white border-primary' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
                 <t.icon size={18} className={`${tab === t.id ? 'text-primary' : ''} transition-colors`} /> 
                 {t.label}
                 {tab === t.id && <div className="absolute -bottom-[4px] left-0 right-0 h-4 bg-primary blur-md opacity-30" />}
               </button>
             ))}
           </div>

           <div className="animate-fade-in">
             {tab === 'artworks' && (
               artworks.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-32 bg-dark-card border border-dashed border-white/10 rounded-[4rem] group hover:border-primary/30 transition-all duration-700">
                   <div className="w-24 h-24 bg-surface rounded-[2rem] flex items-center justify-center mb-10 shadow-inner group-hover:scale-110 transition-transform">
                     <ImageIcon size={48} className="text-gray-700" />
                   </div>
                   <p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.4em]">No gallerys documented yet.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                   {artworks.map((a, idx) => (
                     <div key={a._id} className="aspect-[4/5] rounded-[2.5rem] overflow-hidden group cursor-pointer relative shadow-2xl transform animate-slide-up hover:-translate-y-3 transition-all duration-700 border border-white/5 hover:border-primary/40" style={{ animationDelay: `${idx * 80}ms` }} onClick={() => setSelectedArtwork(a)}>
                       <img src={a.imageUrl?.startsWith('http') ? a.imageUrl : `${API_BASE}${a.imageUrl}`} alt={a.title} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-125" loading="lazy" />
                       <div className="absolute inset-0 bg-gradient-to-t from-dark/95 via-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                         <div className="space-y-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                           <p className="text-white font-black text-xl tracking-tighter truncate leading-none">{a.title}</p>
                           <div className="flex items-center gap-5 pt-2">
                             <span className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest"><Star size={14} className="fill-primary"/> {a.likes?.length || 0}</span>
                             <span className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest"><MessageCircle size={14}/> {a.comments?.length || 0}</span>
                           </div>
                           <button className="w-full py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-white hover:bg-primary transition-all">View Artwork</button>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )
             )}

             {tab === 'reviews' && (
                <div className="bg-dark-card border border-white/5 rounded-[3.5rem] p-10 shadow-2xl">
                   <ArtistReviewSection artistId={profile._id} />
                </div>
             )}



             {tab === 'about' && (
               <div className="space-y-12">
                 <div className="bg-dark-card border border-white/5 rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -z-10" />
                    
                    <h3 className="text-3xl font-black text-white mb-10 tracking-tighter flex items-center gap-4">
                       <Shield size={32} className="text-primary"/> Verification
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-6">
                         <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] ml-2">Clearance Status</p>
                         <div className={`p-8 rounded-[2.5rem] border-2 transition-all duration-700 ${profile.isVerified ? 'bg-primary/5 border-primary/30 text-primary shadow-[0_20px_60px_-15px_rgba(124,58,237,0.3)]' : 'bg-surface/20 border-white/5 text-gray-500 hover:border-white/10'}`}>
                           <div className="flex items-center gap-6">
                             <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 ${profile.isVerified ? 'bg-primary/20 rotate-12' : 'bg-dark-card'}`}>
                               {profile.isVerified ? <BadgeCheck size={36}/> : <Target size={36} className="opacity-20"/>}
                             </div>
                             <div className="space-y-1">
                               <p className="text-xl font-black uppercase tracking-tight">{profile.isVerified ? 'Master Artist' : 'Associate Level'}</p>
                               <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{profile.isVerified ? 'Verified Account' : 'Standard Account'}</p>
                             </div>
                           </div>
                         </div>
                       </div>
                       
                       <div className="space-y-6">
                         <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] ml-2">Artwork</p>
                         <div className="space-y-6 p-4">
                           {profile.email && (
                             <div className="group cursor-pointer">
                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] mb-2 group-hover:text-primary transition-colors">Art Address</p>
                                <p className="text-white font-black text-sm tracking-widest bg-surface/40 px-5 py-3 rounded-xl border border-white/5 inline-block">{profile.email}</p>
                             </div>
                           )}
                           {profile.artInterests?.length > 0 && (
                             <div className="space-y-4">
                               <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] mb-2">Interest Vectors</p>
                               <div className="flex flex-wrap gap-3">{profile.artInterests.map((i, idx) => <span key={idx} className="text-[10px] font-black px-4 py-2.5 rounded-xl bg-accent/5 text-accent border border-accent/20 hover:bg-accent hover:text-white transition-all duration-500 cursor-pointer">{i}</span>)}</div>
                             </div>
                           )}
                         </div>
                       </div>
                    </div>

                    {isOwnProfile && !profile.isVerified && (
                      <div className="mt-16 pt-16 border-t border-white/5">
                        <div className="flex flex-col xl:flex-row gap-16">
                          <div className="flex-1 space-y-8">
                             <div className="space-y-4">
                                <h4 className="text-4xl font-black text-white tracking-tighter leading-none">Start <span className="text-primary italic">Verification</span></h4>
                                <p className="text-gray-400 font-medium text-lg max-w-xl leading-relaxed">Verify your identity to unlock more account features.</p>
                             </div>
                             
                             {verificationStatus ? (
                               <div className="p-8 bg-primary/5 border border-primary/20 rounded-[2.5rem] flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                                 <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                                 <div className="w-16 h-16 bg-primary/20 rounded-[1.5rem] flex items-center justify-center text-primary relative z-10"><Clock size={32} className="animate-spin-slow"/></div>
                                 <div className="relative z-10">
                                   <p className="text-xl font-black text-white uppercase tracking-tighter">Status: <span className="text-primary">{verificationStatus.status} Status</span></p>
                                   <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mt-1">Global command is currently analyzing your identity matrix.</p>
                                 </div>
                               </div>
                             ) : (
                               <form onSubmit={submitVerification} className="space-y-10">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                   <div className="space-y-3">
                                     <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-3">Bio-ID Documentation</label>
                                     <div className="relative group/input">
                                        <input type="file" accept="image/*" className="w-full h-16 bg-surface/40 border border-white/5 rounded-2xl px-6 py-4 text-[10px] font-black text-white file:hidden cursor-pointer hover:border-primary/40 transition-all uppercase tracking-widest" onChange={(e) => setVerificationFiles({ ...verificationFiles, aadhaarImage: e.target.files[0] })} required />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-700 group-hover/input:text-primary transition-colors pointer-events-none"><Upload size={20}/></div>
                                     </div>
                                   </div>
                                   <div className="space-y-3">
                                     <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-3">Achievement Credentials</label>
                                     <div className="relative group/input">
                                        <input type="file" accept="image/*" className="w-full h-16 bg-surface/40 border border-white/5 rounded-2xl px-6 py-4 text-[10px] font-black text-white file:hidden cursor-pointer hover:border-primary/40 transition-all uppercase tracking-widest" onChange={(e) => setVerificationFiles({ ...verificationFiles, certificateImage: e.target.files[0] })} required />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-700 group-hover/input:text-primary transition-colors pointer-events-none"><Upload size={20}/></div>
                                     </div>
                                   </div>
                                 </div>
                                 
                                 <div className="bg-dark/40 rounded-[3rem] p-10 border border-white/5 shadow-inner space-y-8 relative overflow-hidden group/camera">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[50px] -z-10 group-hover/camera:bg-primary/10 transition-colors" />
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Live Optical Biometric Capture</span>
                                      <Zap size={16} className="text-primary animate-pulse"/>
                                    </div>

                                    {!verificationFiles.passportPhoto && (
                                      <button type="button" onClick={startCamera} className="w-full py-8 rounded-[2rem] bg-surface/40 border border-white/5 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-4 group/cam-btn">
                                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover/cam-btn:bg-primary group-hover/cam-btn:text-white transition-all text-primary">
                                           <Camera size={32} />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Activate Biometric Capture</span>
                                      </button>
                                    )}

                                    {verificationFiles.passportPhoto && (
                                      <div className="flex flex-col items-center space-y-6 animate-fade-in py-6">
                                        <div className="flex items-center gap-6 bg-green-500/10 border border-green-500/20 p-8 rounded-[2rem] w-full">
                                          <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400 shadow-inner"><Check size={36}/></div>
                                          <div className="flex-1">
                                            <p className="text-xl font-black text-white uppercase tracking-tighter">Photo Saved</p>
                                            <p className="text-[9px] font-bold text-green-500/60 uppercase tracking-widest mt-1">Data integrity verified. Ready for message.</p>
                                          </div>
                                          <button type="button" onClick={() => { setVerificationFiles({ ...verificationFiles, passportPhoto: null }); startCamera(); }} className="h-12 px-6 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-primary hover:bg-primary hover:text-white transition-all uppercase tracking-widest">Retake</button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                 
                                 <button type="submit" className="w-full h-20 bg-gradient-to-r from-primary to-accent text-white font-black rounded-[2rem] text-[12px] uppercase tracking-[0.4em] shadow-[0_30px_60px_-15px_rgba(124,58,237,0.5)] hover:shadow-primary/70 hover:scale-[1.01] transition-all active:scale-[0.98] flex items-center justify-center gap-6">
                                   Send Application <ArrowRight size={24} className="animate-bounce-x"/>
                                 </button>
                               </form>
                             )}
                          </div>
                          
                          <div className="hidden xl:block w-80 shrink-0 space-y-8">
                             <div className="bg-surface/40 rounded-[3rem] p-10 border border-white/5 shadow-2xl space-y-8">
                                <div className="w-20 h-20 bg-primary/10 rounded-[1.5rem] flex items-center justify-center"><Trophy size={44} className="text-primary opacity-60" /></div>
                                <div className="space-y-4">
                                   <h5 className="font-black text-white text-lg tracking-tighter">Verified Account Benefits</h5>
                                   <ul className="text-[10px] font-black text-gray-500 space-y-5 uppercase tracking-[0.2em]">
                                     <li className="flex gap-4 items-start"><Sparkles size={16} className="text-primary shrink-0"/> Verified Artist Badge</li>
                                     <li className="flex gap-4 items-start"><Zap size={16} className="text-primary shrink-0"/> Search Priority</li>
                                     <li className="flex gap-4 items-start"><Shield size={16} className="text-primary shrink-0"/> Early Gallery Access</li>
                                     <li className="flex gap-4 items-start"><MessageCircle size={16} className="text-primary shrink-0"/> Direct Support</li>
                                   </ul>
                                </div>
                                <div className="pt-4">
                                   <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                      <div className="h-full w-2/3 bg-primary animate-pulse" />
                                   </div>
                                   <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest mt-4">Security Level: High</p>
                                </div>
                             </div>

                             <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-[2.5rem] border border-primary/20 p-8">
                                <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-4">Network Integrity</p>
                                <p className="text-[11px] font-medium text-gray-400 leading-relaxed italic">"Verification ensures the absolute authenticity of the global artist group."</p>
                             </div>
                          </div>
                        </div>
                      </div>
                    )}
                 </div>
               </div>
             )}
           </div>
        </div>
      </div>

      <ImageViewerModal isOpen={!!selectedArtwork} onClose={() => setSelectedArtwork(null)} artwork={selectedArtwork} reportTargetType="artwork" onDeleted={handleArtworkDeleted} />

      {/* Full-Screen Cinematic Biometric Capture Overlay */}
      {showCamera && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="bg-[#0c0d0f] border-2 border-primary/30 rounded-[3rem] p-10 max-w-4xl w-full mx-4 shadow-[0_0_120px_rgba(124,58,237,0.25)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Camera size={22} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tighter">Live Optical Biometric Capture</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                    <p className="text-[9px] font-black text-green-500 uppercase tracking-[0.3em]">Hardware Link Active</p>
                  </div>
                </div>
              </div>
              <button type="button" onClick={stopCamera} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Full-Size Video Preview */}
            <div className="relative rounded-[2.5rem] overflow-hidden bg-black shadow-2xl border border-primary/20 mb-8 z-10" style={{aspectRatio:'16/9'}}>
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              {/* Scanning overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-8 border border-primary/30 rounded-3xl" />
                <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-2xl" />
                <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-2xl" />
                <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-2xl" />
                <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-2xl" />
                <div className="absolute inset-x-0 top-1/2 h-px bg-primary/40 animate-pulse" />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              {/* Live badge */}
              <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Live</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 relative z-10">
              <button type="button" onClick={takePhoto} className="flex-1 h-16 bg-gradient-to-r from-primary to-accent text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                <Zap size={18} /> Execute Capture
              </button>
              <button type="button" onClick={stopCamera} className="px-10 h-16 bg-surface/60 border border-white/5 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:text-white hover:bg-surface transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
