import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import {
  Users, Trash2, Image as ImageIcon, ArrowLeft, Plus, X,
  MessageCircle, Lock, Globe, Edit3, Check, UserCheck, UserX, Send, CornerUpLeft, Shield, Info, Palette, LayoutGrid, Zap, BadgeCheck, Camera, MoreVertical, Heart, Share2, Target, LogOut, Paperclip, Smile
} from 'lucide-react';
import ImageViewerModal from '../components/ImageViewerModal';
import ReportButton from '../components/ReportButton';
import CreatePostModal from '../components/CreatePostModal';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';
const mediaSrc = (path, version) => {
  if (!path) return '';
  const src = path.startsWith('http') ? path : `${API_BASE}${path}`;
  return version ? `${src}${src.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}` : src;
};

function ChatReplyPreview({ replyTo, onCancel }) {
  if (!replyTo) return null;
  return (
    <div className="mx-6 mb-3 px-5 py-4 bg-primary/5 border-l-[6px] border-primary rounded-[1.5rem] flex items-start justify-between gap-4 animate-slide-up backdrop-blur-3xl shadow-xl border border-white/5">
      <div className="min-w-0">
        <p className="text-[9px] text-primary font-black uppercase tracking-[0.3em] mb-1.5 flex items-center gap-2">
           <CornerUpLeft size={10}/> Targeting Response to {replyTo.senderName}
        </p>
        <p className="text-xs text-gray-400 truncate font-medium italic opacity-80 leading-relaxed">{replyTo.message}</p>
      </div>
      <button onClick={onCancel} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all hover:bg-white/10 shadow-inner">
         <X size={14}/>
      </button>
    </div>
  );
}

export default function CommunityView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedArtwork, setSelectedArtwork] = useState(null);

  // Admin states
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', isPrivate: false });

  // Join requests (admin)
  const [joinRequests, setJoinRequests] = useState([]);

  // Post modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Community chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMsg, setChatMsg] = useState('');
  const [chatReplyTo, setChatReplyTo] = useState(null);
  const chatEndRef = useRef(null);

  const fetchCommunity = async (isMounted = () => true) => {
    try {
      const r = await api.get(`/community/${id}`);
      if (isMounted()) {
        setCommunity(r.data);
        setEditForm({ name: r.data.name, description: r.data.description, isPrivate: r.data.isPrivate });
      }
    } catch {
      if (isMounted()) { toast.error('Failed to load art group'); navigate('/community', { replace: true }); }
    } finally {
      if (isMounted()) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchCommunity(() => active);
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('join_community_room', id);
    socket.on('receive_community_message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });
    return () => { socket.off('receive_community_message'); };
  }, [socket, id]);

  useEffect(() => {
    if (activeTab === 'chat' && isMember) {
      api.get(`/community/${id}/messages`)
        .then(r => setChatMessages(r.data))
        .catch(() => {});
    }
  }, [activeTab, id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  useEffect(() => {
    if (activeTab === 'requests' && isAdmin) {
      api.get(`/community/${id}/join-requests`)
        .then(r => setJoinRequests(r.data))
        .catch(() => {});
    }
  }, [activeTab]);

  const creatorId = community?.creator?._id || community?.creator;
  const members = Array.isArray(community?.members) ? community.members : [];
  const posts = Array.isArray(community?.posts) ? community.posts.filter(Boolean) : [];
  const isAdmin = creatorId === user?._id;
  const isMember = members.some((m) => (m?._id || m) === user?._id);
  const isAdultUser = Number(user?.age) >= 18 || user?.role === 'admin';

  const hasPendingRequest = community?.joinRequests?.some(
    r => (r.user?._id || r.user) === user?._id
  );

  const handleJoin = async () => {
    try {
      const r = await api.post(`/community/${id}/join`);
      if (r.data.requested) {
        toast.success('Join request sent!');
      } else if (r.data.cancelled) {
        toast.success('Join request canceled.');
      } else if (r.data.joined) {
        toast.success('Group created!');
      } else {
        toast.success('Join request canceled');
      }
      fetchCommunity();
    } catch { toast.error('Could not send join request'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to dismantle this group?')) return;
    try {
      await api.delete(`/community/${id}`);
      toast.success('Group dismantled');
      navigate('/community');
    } catch { toast.error('Dismantling sequence failed'); }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Leave this artist?')) return;
    try {
      await api.post(`/community/${id}/remove-member`, { memberId });
      toast.success('Member removed');
      fetchCommunity();
    } catch { toast.error('Decoupling failed'); }
  };

  const handleUpdateImages = async () => {
    if (!coverFile) return;
    const fd = new FormData();
    fd.append('coverImage', coverFile);
    try {
      const { data } = await api.put(`/community/${id}/images`, fd);
      setCommunity(prev => ({ ...(prev || {}), ...data }));
      toast.success('Group cover updated');
      setCoverFile(null);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverPreview('');
      fetchCommunity();
    } catch { toast.error('Update failed'); }
  };

  const handleEditSave = async () => {
    try {
      await api.put(`/community/${id}`, {
        name: editForm.name,
        description: editForm.description,
        isPrivate: editForm.isPrivate,
      });
      toast.success('Art group reconfigured!');
      setShowEdit(false);
      fetchCommunity();
    } catch (err) { toast.error(err.response?.data?.message || 'Reconfiguration failed'); }
  };

  const handleJoinRequest = async (userId, action) => {
    try {
      await api.post(`/community/${id}/join-requests/${userId}/handle`, { action });
      toast.success(action === 'accept' ? 'Member integrated!' : 'Request rejected');
      setJoinRequests(prev => prev.filter(r => (r.user?._id || r.user) !== userId));
      if (action === 'accept') fetchCommunity();
    } catch { toast.error('Sequence error'); }
  };

  // handleCreatePost is now handled inside CreatePostModal

  const handleArtworkDeleted = (artworkId) => {
    setSelectedArtwork(null);
    setCommunity(prev => prev
      ? { ...prev, posts: (prev.posts || []).filter(post => post?._id !== artworkId) }
      : prev
    );
  };

  const handleSendChatMsg = async (e) => {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    try {
      const payload = { message: chatMsg };
      if (chatReplyTo) payload.replyTo = chatReplyTo;
      const res = await api.post(`/community/${id}/messages`, payload);
      if (socket) {
        socket.emit('send_community_message', {
          communityId: id,
          message: chatMsg,
          senderInfo: { _id: user._id, username: user.username, profileImage: user.profileImage },
          replyTo: chatReplyTo || null,
        });
      }
      setChatMessages(prev => [...prev, res.data]);
      setChatMsg('');
      setChatReplyTo(null);
    } catch { toast.error('Message failed'); }
  };

  const tabs = ['feed', 'chat', 'members', ...(isAdmin ? ['requests'] : [])];

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 space-y-8">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-[0_0_30px_rgba(124,58,237,0.3)]"/>
      <p className="text-gray-600 font-black text-[10px] tracking-[0.5em] uppercase animate-pulse">Starting Art Feed...</p>
    </div>
  );
  if (!community) return null;

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-32 px-6 lg:px-8 selection:bg-primary selection:text-white">
      <button onClick={() => navigate('/community')} className="mb-10 flex items-center gap-3 text-gray-500 hover:text-white transition-all group/back">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover/back:border-primary/40 group-hover/back:text-primary transition-all">
           <ArrowLeft size={20} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Back to Community</span>
      </button>

      {/* Cinematic Header */}
      <div className="bg-dark-card border border-white/5 rounded-[4rem] overflow-hidden shadow-[0_60px_120px_-30px_rgba(0,0,0,0.8)] mb-12 relative group/hdr">
        <div className="h-80 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d0f] via-[#0c0d0f]/40 to-transparent z-10" />
          {coverPreview || community?.coverImage ? (
            <img src={coverPreview || mediaSrc(community.coverImage, community.updatedAt)} alt="Cover" className="w-full h-full object-cover transition-transform duration-1000 group-hover/hdr:scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-surface to-accent/20" />
          )}
          
          {isAdmin && (
            <div className="absolute top-8 right-8 z-20 flex items-center gap-4">
              <label className="h-14 px-8 rounded-2xl bg-black/60 backdrop-blur-3xl border border-white/10 flex items-center gap-4 text-xs font-black text-white uppercase tracking-widest hover:bg-primary transition-all cursor-pointer shadow-2xl">
                <Camera size={20} /> Change Architecture
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setCoverFile(file);
                    if (coverPreview) URL.revokeObjectURL(coverPreview);
                    setCoverPreview(URL.createObjectURL(file));
                  }}
                />
              </label>
              {coverFile && (
                <button onClick={handleUpdateImages} className="h-14 px-8 rounded-2xl bg-green-500 text-white font-black uppercase tracking-widest shadow-xl shadow-green-500/20 hover:scale-105 active:scale-95 transition-all">Save Changes</button>
              )}
            </div>
          )}
        </div>

        <div className="p-12 -mt-24 relative z-20">
          <div className="flex flex-col lg:flex-row justify-between items-end gap-10">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-4 flex-wrap">
                 <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                 <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tighter leading-none">{community?.name}</h1>
                 {community?.isPrivate
                  ? <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent bg-accent/10 px-4 py-2 rounded-2xl backdrop-blur-3xl border border-accent/20"><Lock size={12}/> Encrypted</span>
                  : <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-2xl backdrop-blur-3xl border border-primary/20"><Globe size={12}/> Open Hub</span>
                }
              </div>
              <div className="flex items-center gap-4">
                 <span className="px-5 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] border border-primary/20">{community?.category || 'General'}</span>
                 <div className="h-4 w-px bg-white/10" />
                 <div className="flex items-center gap-3 text-gray-500">
                    <Users size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{members.length} Artists</span>
                 </div>
              </div>
              <p className="text-gray-400 text-lg font-medium max-w-3xl leading-relaxed">{community?.description || 'A friendly art group for sharing work and ideas.'}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              {isAdmin ? (
                <>
                  <button onClick={() => setShowEdit(!showEdit)} className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-gradient-to-br from-primary to-accent text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4">
                    <Edit3 size={20}/> Reconfigure
                  </button>
                  <button onClick={handleDelete} className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 font-black text-[11px] uppercase tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-4 group/del">
                    <Trash2 size={20} className="group-hover/del:rotate-12 transition-transform" /> Dismantle
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleJoin} className={`w-full sm:w-auto h-16 px-12 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 ${
                    isMember ? 'bg-surface/60 text-gray-400 hover:bg-red-500 hover:text-white border border-white/5'
                    : hasPendingRequest ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'bg-gradient-to-r from-primary to-accent text-white shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1'
                  }`}>
                    {isMember ? <><LogOut size={20}/> Leave Group</> : hasPendingRequest ? <><Zap size={20} className="animate-pulse"/> Pending</> : <><Zap size={20}/> Join Group</>}
                  </button>
                  <div className="flex items-center gap-4">
                     <button className="h-16 w-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 hover:text-primary transition-all">
                        <Share2 size={24} />
                     </button>
                     <ReportButton targetType="community" targetId={community._id} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Reconfiguration Panel */}
          {isAdmin && showEdit && (
            <div className="mt-12 p-10 bg-[#0c0d0f] rounded-[3rem] border-2 border-white/10 space-y-8 animate-slide-up relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
              <h3 className="text-xl font-black text-white flex items-center gap-4 uppercase tracking-tighter"><Edit3 size={20} className="text-primary"/> Group Configuration</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-2">Art Name</label>
                   <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-dark/60 border-2 border-white/5 rounded-[1.5rem] px-8 py-5 text-sm font-black text-white focus:border-primary/50 transition-all" placeholder="Group name"/>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-2">Privacy</label>
                   <div className="flex bg-dark/60 p-2 rounded-2xl border-2 border-white/5 shadow-inner">
                      <button onClick={() => setEditForm({...editForm, isPrivate: false})} className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!editForm.isPrivate ? 'bg-primary text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}>
                        <Globe size={16}/> Open
                      </button>
                      <button onClick={() => setEditForm({...editForm, isPrivate: true})} className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editForm.isPrivate ? 'bg-accent text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}>
                        <Lock size={16}/> Encrypted
                      </button>
                   </div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-2">Mission Statement</label>
                   <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full bg-dark/60 border-2 border-white/5 rounded-[2rem] px-8 py-6 text-sm font-medium text-white focus:border-primary/50 transition-all h-32 resize-none leading-relaxed" placeholder="Description"/>
                </div>
              </div>
              <div className="flex gap-4 pt-4 relative z-10">
                <button onClick={handleEditSave} className="h-16 px-12 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4">
                   <Check size={20}/> Commit Configuration
                </button>
                <button onClick={() => setShowEdit(false)} className="h-16 px-8 rounded-2xl bg-white/5 text-gray-500 font-black text-[11px] uppercase tracking-widest hover:text-white transition-all">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Art Interface Tabs */}
      <div className="flex flex-wrap gap-10 mb-12 border-b border-white/5 px-10 relative">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`pb-8 text-[11px] font-black uppercase tracking-[0.4em] transition-all relative flex items-center gap-4 group/tab ${activeTab === t ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}>
            {t === 'feed' && <LayoutGrid size={18} className={activeTab === t ? 'text-primary' : ''}/>}
            {t === 'chat' && <MessageCircle size={18} className={activeTab === t ? 'text-primary' : ''}/>}
            {t === 'members' && <Users size={18} className={activeTab === t ? 'text-primary' : ''}/>}
            {t === 'requests' && <Target size={18} className={activeTab === t ? 'text-accent' : ''}/>}
            
            {t}
            
            {t === 'requests' && community?.joinRequests?.length > 0 && (
              <span className="w-6 h-6 bg-accent rounded-lg text-white text-[9px] flex items-center justify-center font-black animate-pulse shadow-lg shadow-accent/20">{community.joinRequests.length}</span>
            )}
            
            {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary shadow-[0_0_20px_rgba(124,58,237,1)] rounded-full animate-fade-in" />}
          </button>
        ))}
      </div>

      {/* Dynamic Module Rendering */}
      <div className="animate-slide-up">

        {/* ── Art Feed ── */}
        {activeTab === 'feed' && (
          <div className="space-y-12">
            {isMember ? (
              <>
                <div className="flex justify-between items-center bg-dark-card border border-white/5 px-10 py-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden group/postbar">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-0 group-hover/postbar:opacity-100 transition-opacity duration-700" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Post Station</span>
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest hidden sm:block">· Share your art with the community</span>
                  </div>
                  <button
                    type="button"
                    id="create-post-btn"
                    onClick={() => setShowCreateModal(true)}
                    className="relative z-10 group/cpbtn h-14 px-10 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all duration-500 flex items-center gap-3 shadow-2xl active:scale-95 bg-gradient-to-r from-primary to-accent text-white shadow-primary/30 hover:shadow-primary/60 hover:-translate-y-1 hover:scale-105"
                  >
                    <span className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center group-hover/cpbtn:rotate-90 transition-transform duration-500">
                      <Plus size={16} className="text-white" />
                    </span>
                    Create Post
                    <span className="w-2 h-2 rounded-full bg-white/60 animate-ping absolute -top-1 -right-1" />
                  </button>
                </div>

                {posts.length === 0 ? (
                  <div className="text-center py-40 bg-dark-card border-2 border-dashed border-white/5 rounded-[4rem] group/zero">
                     <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/zero:opacity-100 transition-opacity" />
                    <div className="w-24 h-24 bg-surface rounded-[2rem] border border-white/5 flex items-center justify-center mx-auto mb-8 shadow-2xl relative z-10">
                       <ImageIcon size={40} className="text-gray-700"/>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-3 tracking-tighter relative z-10">Art Feed Silent</h3>
                    <p className="text-gray-500 font-medium relative z-10">Initiate the first message for this group.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {posts.filter(p => p?._id && p?.imageUrl).map((p, i) => {
                      const artist = p.artist;
                      const artistId = artist?._id || artist;
                      const artistImg = artist?.profileImage ? mediaSrc(artist.profileImage) : null;
                      return (
                      <div key={p._id} className="group/card aspect-[4/5] rounded-[2.5rem] bg-dark-card border border-white/5 cursor-pointer relative shadow-2xl hover:shadow-primary/20 transform hover:-translate-y-2 transition-all duration-700 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }} onClick={() => setSelectedArtwork(p)}>
                        {/* Image wrapper with overflow hidden so image is clipped to card shape */}
                        <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden">
                          <img src={mediaSrc(p.imageUrl)} alt={p.title || 'Post'} className="w-full h-full object-cover transition-transform duration-1000 group-hover/card:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d0f] via-transparent to-transparent opacity-60 group-hover/card:opacity-90 transition-opacity duration-500" />
                        </div>

                        {/* Artist bar — sits above image, NOT clipped */}
                        <button
                          onClick={(e) => { e.stopPropagation(); if (artistId) navigate(`/profile/${artistId}`); }}
                          className="absolute top-4 left-4 right-4 z-30 flex items-center gap-3 rounded-2xl bg-black/60 border border-white/10 px-4 py-3 text-left backdrop-blur-xl transition-all hover:border-primary/50 hover:bg-black/80"
                        >
                          <span className="w-10 h-10 rounded-xl bg-primary/10 border border-white/10 overflow-hidden flex items-center justify-center text-xs font-black text-primary shrink-0">
                            {artistImg ? <img src={artistImg} alt="" className="w-full h-full object-cover" /> : artist?.username?.[0]?.toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-xs font-black text-white truncate hover:text-primary">{artist?.username || 'Artist'}</span>
                            <span className="block text-[8px] font-black uppercase tracking-widest text-gray-500">View profile</span>
                          </span>
                        </button>
                        
                        <div className="absolute bottom-8 left-8 right-8 z-20 translate-y-4 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-500">
                           <div className="flex items-center gap-3 mb-2">
                              <span className="text-[8px] font-black text-primary uppercase tracking-[0.4em] bg-primary/10 px-3 py-1 rounded-lg border border-primary/20 backdrop-blur-md">Message</span>
                              {p.isAdultContent && <span className="text-[8px] font-black text-accent uppercase tracking-[0.4em] bg-accent/10 px-3 py-1 rounded-lg border border-accent/20 backdrop-blur-md">18+</span>}
                           </div>
                           <h4 className="text-xl font-black text-white tracking-tighter truncate">{p.title || 'Untitled Post'}</h4>
                           <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                              <div className="flex items-center gap-2">
                                 <Heart size={14} className="text-red-500 fill-red-500/20" />
                                 <span className="text-[10px] font-black text-white">{p.likes?.length || 0}</span>
                              </div>
                              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{new Date(p.createdAt).toLocaleDateString()}</span>
                           </div>
                        </div>
                        
                        {/* Interactive UI corners */}
                        <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white/20 rounded-tl-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 z-10" />
                        <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white/20 rounded-br-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 z-10" />
                      </div>
                    );})}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-40 bg-dark-card border border-white/5 rounded-[4rem] group/lock relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover/lock:opacity-100 transition-opacity duration-1000" />
                <div className="w-32 h-32 bg-surface rounded-[3rem] border border-white/5 flex items-center justify-center mx-auto mb-10 shadow-2xl relative z-10 group-hover/lock:scale-110 group-hover/lock:rotate-6 transition-all duration-700">
                   <Lock size={56} className="text-gray-700 group-hover/lock:text-accent transition-colors duration-700" />
                </div>
                <div className="space-y-4 relative z-10 px-10">
                   <h3 className="text-3xl font-black text-white tracking-tighter">Message Encrypted</h3>
                   <p className="text-gray-500 max-w-sm mx-auto mb-10 font-medium text-lg leading-relaxed">
                     {community.isPrivate
                       ? 'This group is private. Send a request to join.'
                       : 'Join this group to see posts.'}
                   </p>
                </div>
                {!hasPendingRequest && (
                  <button onClick={handleJoin} className="relative z-10 bg-primary/10 text-primary border-2 border-primary/20 px-12 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-primary hover:text-white transition-all duration-500 shadow-2xl">Start Request</button>
                )}
                {hasPendingRequest && (
                  <div className="relative z-10 inline-flex items-center gap-4 bg-accent/10 border-2 border-accent/20 px-10 py-5 rounded-[2rem] animate-pulse shadow-2xl shadow-accent/20">
                     <Zap size={20} className="text-accent" />
                     <span className="text-[11px] font-black text-accent uppercase tracking-[0.3em]">Art Link Pending...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Art Chat ── */}
        {activeTab === 'chat' && (
          <div className="animate-slide-up">
            {isMember ? (
              <div className="bg-dark-card border border-white/5 rounded-[3.5rem] overflow-hidden flex flex-col shadow-[0_60px_120px_-30px_rgba(0,0,0,0.8)] relative group/chatbox" style={{height: '75vh'}}>
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/chatbox:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                
                <div className="px-12 py-8 border-b border-white/5 bg-surface/30 backdrop-blur-3xl flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-2xl border border-primary/20">
                       <MessageCircle size={32} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-white tracking-tighter leading-none flex items-center gap-4">Group Message Hub <BadgeCheck size={18} className="text-primary fill-primary/10"/></h3>
                       <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> {members.length} Integrated Artists Active
                       </p>
                    </div>
                  </div>

                </div>

                <div className="flex-1 overflow-y-auto px-12 py-10 space-y-10 hide-scrollbar scroll-smooth relative z-10">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-8 opacity-20 group-hover/chatbox:opacity-40 transition-opacity duration-1000">
                       <div className="w-32 h-32 bg-surface/40 rounded-[3rem] border border-dashed border-white/20 flex items-center justify-center">
                          <Zap size={48} className="text-gray-400"/>
                       </div>
                       <p className="text-[11px] font-black uppercase tracking-[0.5em] text-center">No messages yet. Send the first message.</p>
                    </div>
                  ) : (
                    chatMessages.map((m, i) => {
                      const senderId = m.sender?._id || m.sender;
                      const isMe = senderId === user._id || senderId?.toString() === user._id;
                      const sName = m.sender?.username || 'Artist';
                      const sImg = m.sender?.profileImage;
                      const imgSrc = sImg ? (sImg.startsWith('http') ? sImg : `${API_BASE}${sImg}`) : null;
                      
                      return (
                        <div key={i} className={`flex gap-5 group/msg relative ${isMe ? 'flex-row-reverse' : ''} animate-fade-in`}>
                          <button
                            onClick={() => senderId && navigate(`/profile/${senderId}`)}
                            className="w-11 h-11 rounded-[1.25rem] bg-surface/40 flex-shrink-0 flex items-center justify-center text-xs font-black text-primary overflow-hidden border border-white/5 shadow-2xl self-end hover:scale-110 transition-all hover:border-primary/40 group-hover/msg:rotate-3 duration-500"
                          >
                            {imgSrc ? <img src={imgSrc} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center bg-primary/10">{sName[0]?.toUpperCase()}</div>}
                          </button>
                          
                          <div className={`flex flex-col max-w-[80%] md:max-w-[65%] ${isMe ? 'items-end' : 'items-start'} space-y-1.5`}>
                            {!isMe && (
                               <span className="text-[9px] font-black text-gray-500 mb-0.5 ml-3 uppercase tracking-[0.3em] hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/profile/${senderId}`)}>
                                  {sName}
                               </span>
                            )}
                            
                            {m.replyTo?.message && (
                              <div className="mb-1 px-4 py-3 rounded-[1.25rem] bg-white/5 border-l-4 border-primary/40 text-[11px] max-w-full backdrop-blur-md opacity-60 hover:opacity-100 transition-opacity cursor-pointer group/reply">
                                <p className="text-primary font-black uppercase text-[8px] mb-1 tracking-widest">{m.replyTo.senderName}</p>
                                <p className="text-gray-400 truncate italic font-medium">{m.replyTo.message}</p>
                              </div>
                            )}

                            <div className={`relative px-6 py-4 rounded-[2rem] text-[13px] shadow-2xl transition-all duration-500 border ${isMe ? 'bg-gradient-to-br from-primary to-accent text-white border-white/10 rounded-br-md hover:shadow-primary/20' : 'bg-surface/40 border-white/5 text-gray-200 rounded-bl-md hover:bg-surface/60 hover:border-white/10'}`}>
                              <p className="leading-relaxed font-medium tracking-tight whitespace-pre-wrap">{m.message}</p>
                              <div className={`flex items-center gap-2.5 mt-3 justify-end ${isMe ? 'text-white/40' : 'text-gray-500'}`}>
                                <span className="text-[9px] font-black uppercase tracking-tighter italic">
                                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMe && <div className="flex -space-x-1"><Check size={10} className="text-white/60" /><Check size={10} className="text-white/60 -ml-1.5" /></div>}
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setChatReplyTo({ messageId: m._id, message: m.message, senderName: sName })}
                            className={`self-center w-10 h-10 rounded-2xl bg-surface/60 backdrop-blur-3xl flex items-center justify-center text-gray-500 hover:text-primary transition-all border border-white/5 hover:border-primary/20 hover:-translate-y-1 shadow-xl opacity-0 group-hover/msg:opacity-100 ${isMe ? 'mr-2' : 'ml-2'}`}
                          >
                            <CornerUpLeft size={16}/>
                          </button>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="px-12 pb-12 pt-4 relative z-10">
                  <ChatReplyPreview replyTo={chatReplyTo} onCancel={() => setChatReplyTo(null)}/>
                  <form onSubmit={handleSendChatMsg} className="relative flex items-center group/input shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]">
                    <div className="absolute left-6 flex items-center gap-3">
                       <button type="button" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-primary transition-all border border-transparent hover:border-white/10 group/clip">
                          <Paperclip size={20} className="group-hover/clip:rotate-45 transition-transform" />
                       </button>
                    </div>
                    <input 
                      value={chatMsg} 
                      onChange={e => setChatMsg(e.target.value)} 
                      placeholder="Write a group message..." 
                      className="w-full bg-surface/40 backdrop-blur-3xl border-2 border-white/5 rounded-[2.5rem] pl-20 pr-40 py-6 text-[15px] font-medium text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all duration-500 shadow-inner group-focus-within/input:bg-surface/60"
                    />
                    <div className="absolute right-6 flex items-center gap-4">
                       <button type="submit" disabled={!chatMsg.trim()} className="h-14 px-8 bg-gradient-to-r from-primary to-accent rounded-[1.5rem] flex items-center justify-center gap-3 text-white shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-20 disabled:translate-y-0 group/send">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] hidden sm:block">Send</span>
                          <Send size={20} className="group-hover/send:translate-x-1 group-hover/send:-translate-y-1 transition-transform" />
                       </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="text-center py-40 bg-dark-card border border-white/5 rounded-[4rem] group/lock relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/lock:opacity-100 transition-opacity duration-1000" />
                <div className="w-32 h-32 bg-surface rounded-[3rem] border border-white/5 flex items-center justify-center mx-auto mb-10 shadow-2xl relative z-10 group-hover/lock:scale-110 transition-all duration-700">
                   <MessageCircle size={56} className="text-gray-700 group-hover/lock:text-primary transition-colors duration-700" />
                </div>
                <div className="space-y-4 relative z-10 px-10">
                   <h3 className="text-3xl font-black text-white tracking-tighter">Group Communication Locked</h3>
                   <p className="text-gray-500 max-w-sm mx-auto mb-10 font-medium text-lg leading-relaxed">
                     Join this group to use the live chat.
                   </p>
                </div>
                <button onClick={handleJoin} className="relative z-10 bg-primary/10 text-primary border-2 border-primary/20 px-12 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-primary hover:text-white transition-all duration-500 shadow-2xl">Establish Art Link</button>
              </div>
            )}
          </div>
        )}

        {/* ── Integrated Members (Members) ── */}
        {activeTab === 'members' && (
          <div className="bg-dark-card border border-white/5 rounded-[3.5rem] p-12 shadow-2xl animate-slide-up relative group/members">
             <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" />
            <div className="flex items-center justify-between mb-12 relative z-10">
               <div>
                  <h3 className="text-3xl font-black text-white tracking-tighter leading-none">Integrated <span className="text-primary italic">Artists</span></h3>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mt-2">Active members within the group architecture</p>
               </div>
               <div className="bg-primary/10 border border-primary/20 px-6 py-3 rounded-2xl flex items-center gap-4">
                  <Users size={20} className="text-primary" />
                  <span className="text-[11px] font-black text-primary uppercase tracking-widest">{members.length} Members Saved</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
              {members.map((m, index) => {
                const memberId = m?._id || m;
                const mname = m?.username || 'Integrated Artist';
                const isCreator = creatorId === memberId;
                const mimg = m?.profileImage;
                const mimgSrc = mimg ? (mimg.startsWith('http') ? mimg : `${API_BASE}${mimg}`) : null;
                
                return (
                  <div key={memberId || index} className="flex items-center justify-between p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-primary/40 hover:bg-white/10 transition-all duration-700 group/mbr relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/mbr:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-5 relative z-10">
                      <div className="w-16 h-16 rounded-[1.25rem] bg-surface/60 border border-white/5 flex items-center justify-center overflow-hidden group-hover/mbr:scale-105 transition-transform duration-500 shadow-2xl">
                        {mimgSrc ? (
                          <img src={mimgSrc} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-xl">{mname[0]?.toUpperCase()}</div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <button onClick={() => memberId && navigate(`/profile/${memberId}`)} className="text-lg font-black text-white hover:text-primary transition-all tracking-tighter block group-hover/mbr:translate-x-1 duration-500">
                          {mname}
                        </button>
                        {isCreator && (
                          <div className="flex items-center gap-2">
                             <Shield size={10} className="text-primary" />
                             <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Group Architect</span>
                          </div>
                        )}
                        {!isCreator && <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em]">Saved Member</span>}
                      </div>
                    </div>
                    {isAdmin && !isCreator && memberId && (
                      <button onClick={() => handleRemoveMember(memberId)} className="w-12 h-12 rounded-xl bg-red-500/5 text-red-500 border border-red-500/10 opacity-0 group-hover/mbr:opacity-100 hover:bg-red-500 hover:text-white transition-all duration-500 flex items-center justify-center shadow-xl relative z-10">
                        <UserX size={20}/>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Join Requests (Admin Panel) ── */}
        {activeTab === 'requests' && isAdmin && (
          <div className="bg-dark-card border border-white/5 rounded-[3.5rem] p-12 shadow-2xl animate-slide-up relative group/reqs">
             <div className="absolute top-0 left-0 w-96 h-96 bg-accent/5 rounded-full -ml-48 -mt-48 blur-[100px] pointer-events-none" />
            <div className="flex items-center justify-between mb-12 relative z-10">
               <div>
                  <h3 className="text-3xl font-black text-white tracking-tighter leading-none">Art <span className="text-accent italic">Inbound Requests</span></h3>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mt-2">Incoming members awaiting group integration</p>
               </div>
               <div className="bg-accent/10 border border-accent/20 px-6 py-3 rounded-2xl flex items-center gap-4">
                  <Target size={20} className="text-accent" />
                  <span className="text-[11px] font-black text-accent uppercase tracking-widest">{joinRequests.length} Messages Pending</span>
               </div>
            </div>

            {joinRequests.length === 0 ? (
              <div className="text-center py-32 bg-dark/40 rounded-[3rem] border-2 border-dashed border-white/5 group/noreqs">
                 <div className="w-20 h-20 bg-surface rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl">
                    <Check size={32} className="text-gray-700"/>
                 </div>
                 <p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.5em]">Global field saved. No pending inbound members.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                {joinRequests.map((req, i) => {
                  const u = req.user;
                  const userId = u?._id || u;
                  const username = u?.username || 'Integrated Artist';
                  const uimg = u?.profileImage;
                  const uimgSrc = uimg ? (uimg.startsWith('http') ? uimg : `${API_BASE}${uimg}`) : null;
                  
                  return (
                    <div key={userId || i} className="flex items-center justify-between p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:border-accent/40 hover:bg-white/10 transition-all duration-700 group/ritem relative overflow-hidden shadow-2xl">
                      <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover/ritem:opacity-100 transition-opacity" />
                      <div className="flex items-center gap-6 relative z-10">
                        <div className="w-20 h-20 rounded-[1.5rem] bg-surface/60 border border-white/5 flex items-center justify-center overflow-hidden shadow-2xl group-hover/ritem:scale-105 duration-500">
                          {uimgSrc ? (
                            <img src={uimgSrc} className="w-full h-full object-cover" alt=""/>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-accent/10 text-accent font-black text-2xl">{username[0]?.toUpperCase()}</div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <button onClick={() => userId && navigate(`/profile/${userId}`)} className="text-xl font-black text-white hover:text-accent transition-all tracking-tighter block group-hover/ritem:translate-x-1 duration-500">
                            {username}
                          </button>
                          <div className="flex items-center gap-3">
                             <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                             <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                               Inbound Link established {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString() : ''}
                             </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4 relative z-10">
                        <button onClick={() => handleJoinRequest(userId, 'accept')}
                          className="h-14 w-14 rounded-2xl bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white transition-all duration-500 flex items-center justify-center shadow-xl group/acc">
                          <UserCheck size={24} className="group-hover/acc:scale-110 transition-transform" />
                        </button>
                        <button onClick={() => handleJoinRequest(userId, 'reject')}
                          className="h-14 w-14 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all duration-500 flex items-center justify-center shadow-xl group/rej">
                          <UserX size={24} className="group-hover/rej:scale-110 transition-transform" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <ImageViewerModal isOpen={!!selectedArtwork} onClose={() => setSelectedArtwork(null)} artwork={selectedArtwork} reportTargetType="artwork" onDeleted={handleArtworkDeleted} />


      {showCreateModal && (
        <CreatePostModal
          communityId={id}
          isAdultUser={isAdultUser}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchCommunity}
        />
      )}
    </div>
  );
}
