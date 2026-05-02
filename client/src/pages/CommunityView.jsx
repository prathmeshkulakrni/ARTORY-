import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import {
  Users, Trash2, Image as ImageIcon, ArrowLeft, Plus, X,
  MessageCircle, Lock, Globe, Edit3, Check, UserCheck, UserX, Send, CornerUpLeft
} from 'lucide-react';
import ImageViewerModal from '../components/ImageViewerModal';
import ReportButton from '../components/ReportButton';

const API_BASE = 'http://localhost:5000';

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
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', isPrivate: false });

  // Join requests (admin)
  const [joinRequests, setJoinRequests] = useState([]);

  // Post states
  const [postForm, setPostForm] = useState({ title: '', description: '' });
  const [postFile, setPostFile] = useState(null);
  const [showPostForm, setShowPostForm] = useState(false);

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
      if (isMounted()) { toast.error('Failed to load community'); navigate('/community', { replace: true }); }
    } finally {
      if (isMounted()) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchCommunity(() => active);
    return () => { active = false; };
  }, [id]);

  // Community chat socket
  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('join_community_room', id);
    socket.on('receive_community_message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });
    return () => { socket.off('receive_community_message'); };
  }, [socket, id]);

  // Load chat history when chat tab is opened
  useEffect(() => {
    if (activeTab === 'chat') {
      api.get(`/community/${id}/messages`)
        .then(r => setChatMessages(r.data))
        .catch(() => {});
    }
  }, [activeTab, id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  // Load join requests when admin opens the requests tab
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

  const hasPendingRequest = community?.joinRequests?.some(
    r => (r.user?._id || r.user) === user?._id
  );

  const handleJoin = async () => {
    try {
      const r = await api.post(`/community/${id}/join`);
      if (r.data.requested) {
        toast.success('Join request sent! Waiting for admin approval.');
      } else if (r.data.cancelled) {
        toast.success('Join request cancelled.');
      } else if (r.data.joined) {
        toast.success('Joined community!');
      } else {
        toast.success('Left community');
      }
      fetchCommunity();
    } catch { toast.error('Failed to update membership'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this community?')) return;
    try {
      await api.delete(`/community/${id}`);
      toast.success('Community deleted');
      navigate('/community');
    } catch { toast.error('Failed to delete'); }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.post(`/community/${id}/remove-member`, { memberId });
      toast.success('Member removed');
      fetchCommunity();
    } catch { toast.error('Failed to remove member'); }
  };

  const handleUpdateImages = async () => {
    if (!coverFile) return;
    const fd = new FormData();
    fd.append('coverImage', coverFile);
    try {
      await api.put(`/community/${id}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Cover updated');
      fetchCommunity();
      setCoverFile(null);
    } catch { toast.error('Failed to update cover'); }
  };

  const handleEditSave = async () => {
    try {
      await api.put(`/community/${id}`, {
        name: editForm.name,
        description: editForm.description,
        isPrivate: editForm.isPrivate,
      });
      toast.success('Community updated!');
      setShowEdit(false);
      fetchCommunity();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
  };

  const handleJoinRequest = async (userId, action) => {
    try {
      await api.post(`/community/${id}/join-requests/${userId}/handle`, { action });
      toast.success(action === 'accept' ? 'Member accepted!' : 'Request rejected');
      setJoinRequests(prev => prev.filter(r => (r.user?._id || r.user) !== userId));
      if (action === 'accept') fetchCommunity();
    } catch { toast.error('Failed to handle request'); }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postFile) return toast.error('Image is required');
    const fd = new FormData();
    fd.append('title', postForm.title);
    fd.append('description', postForm.description);
    fd.append('image', postFile);
    try {
      const artworkRes = await api.post('/artwork', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await api.post(`/community/${id}/post`, { artworkId: artworkRes.data._id });
      toast.success('Post added!');
      setShowPostForm(false);
      setPostForm({ title: '', description: '' });
      setPostFile(null);
      fetchCommunity();
    } catch { toast.error('Failed to create post'); }
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
    } catch { toast.error('Failed to send message'); }
  };

  const tabs = ['feed', 'chat', 'members', ...(isAdmin ? ['requests'] : [])];

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
  if (!community) return null;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <button onClick={() => navigate('/community')} className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
        <ArrowLeft size={20} /> Back to Communities
      </button>

      {/* Header */}
      <div className="card p-0 overflow-hidden mb-6">
        <div className="h-48 bg-gradient-to-r from-primary/30 to-accent/30 relative">
          {community?.coverImage && (
            <img src={`${API_BASE}${community.coverImage}`} alt="Cover" className="w-full h-full object-cover" />
          )}
          {isAdmin && (
            <div className="absolute top-4 right-4 bg-black/60 p-2 rounded-lg backdrop-blur-md flex items-center gap-2">
              <label className="cursor-pointer flex items-center gap-2 text-sm text-white hover:text-primary transition-colors">
                <ImageIcon size={16} /> Change Cover
                <input type="file" className="hidden" accept="image/*" onChange={(e) => setCoverFile(e.target.files[0])} />
              </label>
              {coverFile && <button onClick={handleUpdateImages} className="btn-primary text-xs py-1 px-2">Save</button>}
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{community?.name || 'Community'}</h1>
                {community?.isPrivate
                  ? <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full"><Lock size={12}/> Private</span>
                  : <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full"><Globe size={12}/> Public</span>
                }
              </div>
              <span className="badge bg-primary/20 text-primary mb-3 inline-block">{community?.category || 'General'}</span>
              <p className="text-gray-300 max-w-2xl">{community?.description || 'No description yet.'}</p>
            </div>

            <div className="flex flex-col items-end gap-3">
              {isAdmin ? (
                <>
                  <button onClick={() => setShowEdit(!showEdit)} className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold bg-primary/20 text-primary hover:bg-primary hover:text-white transition-all">
                    <Edit3 size={16}/> Edit Community
                  </button>
                  <button onClick={handleDelete} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 size={16}/> Delete Community
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleJoin} className={`px-6 py-2 rounded-xl font-bold transition-all ${
                    isMember ? 'bg-dark-border text-gray-300 hover:bg-red-500/20 hover:text-red-400'
                    : hasPendingRequest ? 'bg-orange-400/10 text-orange-400 hover:bg-orange-400/20'
                    : 'bg-primary text-white hover:bg-primary-hover'
                  }`}>
                    {isMember ? 'Leave Community' : hasPendingRequest ? 'Cancel Request' : 'Join Community'}
                  </button>
                  <ReportButton targetType="community" targetId={community._id} compact />
                </>
              )}
            </div>
          </div>

          {/* Admin Edit Panel */}
          {isAdmin && showEdit && (
            <div className="mt-5 p-5 bg-dark rounded-xl border border-dark-border space-y-4 animate-slide-up">
              <h3 className="font-bold text-white flex items-center gap-2"><Edit3 size={16}/> Edit Community</h3>
              <input
                value={editForm.name}
                onChange={e => setEditForm({...editForm, name: e.target.value})}
                placeholder="Community name"
                className="input"
              />
              <textarea
                value={editForm.description}
                onChange={e => setEditForm({...editForm, description: e.target.value})}
                placeholder="Description"
                className="input h-20 resize-none"
              />
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm font-medium">Privacy:</span>
                <button
                  onClick={() => setEditForm({...editForm, isPrivate: false})}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${!editForm.isPrivate ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <Globe size={14}/> Public
                </button>
                <button
                  onClick={() => setEditForm({...editForm, isPrivate: true})}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${editForm.isPrivate ? 'bg-orange-400/20 text-orange-400 border border-orange-400/40' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <Lock size={14}/> Private
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={handleEditSave} className="btn-primary flex items-center gap-2"><Check size={16}/> Save Changes</button>
                <button onClick={() => setShowEdit(false)} className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition-colors">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-dark-border pb-px">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-6 py-3 text-sm font-semibold capitalize transition-colors border-b-2 flex items-center gap-2 ${activeTab === t ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
            {t === 'chat' && <MessageCircle size={14}/>}
            {t === 'requests' && (
              <span className="flex items-center gap-1">
                {t}
                {community?.joinRequests?.length > 0 && (
                  <span className="ml-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">{community.joinRequests.length}</span>
                )}
              </span>
            )}
            {t !== 'chat' && t !== 'requests' && t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 gap-6">

        {/* ── Feed ── */}
        {activeTab === 'feed' && (
          <>
            {isMember ? (
              <>
                <div className="flex justify-end mb-4">
                  <button onClick={() => setShowPostForm(!showPostForm)} className="btn-primary flex items-center gap-2">
                    {showPostForm ? <><X size={16}/> Cancel</> : <><Plus size={16}/> New Post</>}
                  </button>
                </div>
                {showPostForm && (
                  <form onSubmit={handleCreatePost} className="card mb-6 space-y-4 animate-slide-up">
                    <input value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} placeholder="Post Title" className="input" required />
                    <textarea value={postForm.description} onChange={e => setPostForm({...postForm, description: e.target.value})} placeholder="Description" className="input h-20 resize-none" />
                    <input type="file" accept="image/*" onChange={e => setPostFile(e.target.files[0])} className="input" required />
                    <button type="submit" className="btn-primary">Post to Community</button>
                  </form>
                )}
                {posts.length === 0 ? (
                  <div className="text-center py-16 card"><p className="text-gray-400">No posts yet. Be the first!</p></div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {posts.filter(p => p?._id && p?.imageUrl).map(p => (
                      <div key={p._id} className="aspect-square rounded-xl overflow-hidden group cursor-pointer relative" onClick={() => setSelectedArtwork(p)}>
                        <img src={p.imageUrl.startsWith('http') ? p.imageUrl : `${API_BASE}${p.imageUrl}`} alt={p.title || 'Post'} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <p className="text-white font-semibold text-sm truncate">{p.title || 'Untitled'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 card">
                <Users size={48} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Join to see posts</h3>
                <p className="text-gray-400">
                  {community.isPrivate
                    ? 'This is a private community. Request to join and wait for admin approval.'
                    : 'You need to be a member to view and interact with posts.'}
                </p>
                {!hasPendingRequest && (
                  <button onClick={handleJoin} className="btn-primary mt-4 mx-auto">
                    {community.isPrivate ? 'Request to Join' : 'Join Community'}
                  </button>
                )}
                {hasPendingRequest && (
                  <p className="text-orange-400 mt-4 text-sm font-medium">⏳ Your request is pending admin approval</p>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Community Chat ── */}
        {activeTab === 'chat' && (
          <>
            {isMember ? (
              <div className="card p-0 overflow-hidden flex flex-col" style={{height: '65vh'}}>
                <div className="p-4 border-b border-dark-border flex items-center gap-2">
                  <MessageCircle size={18} className="text-primary" />
                  <h3 className="font-bold text-white">Community Chat</h3>
                  <span className="text-xs text-gray-500">— {members.length} members</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-gray-500 py-10 text-sm">No messages yet. Start the conversation!</div>
                  )}
                  {chatMessages.map((m, i) => {
                    const senderId = m.sender?._id || m.sender;
                    const isMe = senderId === user._id || senderId?.toString() === user._id;
                    const senderName = m.sender?.username || 'Unknown';
                    const senderImg = m.sender?.profileImage;
                    const imgSrc = senderImg ? (senderImg.startsWith('http') ? senderImg : `${API_BASE}${senderImg}`) : null;
                    return (
                      <div key={i} className={`flex gap-2 group ${isMe ? 'flex-row-reverse' : ''}`}>
                        {/* Clickable avatar */}
                        <button
                          onClick={() => senderId && navigate(`/profile/${senderId}`)}
                          className="w-8 h-8 rounded-full bg-primary/30 flex-shrink-0 flex items-center justify-center text-xs font-bold text-primary overflow-hidden hover:ring-2 hover:ring-primary transition-all self-end"
                        >
                          {imgSrc ? <img src={imgSrc} alt="" className="w-full h-full object-cover"/> : senderName[0]?.toUpperCase()}
                        </button>
                        <div className={`max-w-xs flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {!isMe && <span className="text-xs text-gray-500 mb-1">{senderName}</span>}
                          {/* Reply preview */}
                          {m.replyTo?.message && (
                            <div className="mb-1 px-3 py-1.5 rounded-lg bg-dark border-l-4 border-primary/50 text-xs max-w-full">
                              <p className="text-primary/80 font-semibold">{m.replyTo.senderName}</p>
                              <p className="text-gray-500 truncate">{m.replyTo.message}</p>
                            </div>
                          )}
                          <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-br-md' : 'bg-surface text-gray-200 rounded-bl-md'}`}>
                            {m.message}
                            <p className={`text-[10px] mt-1 ${isMe ? 'text-white/50' : 'text-gray-500'}`}>
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        {/* Reply action */}
                        <button
                          onClick={() => setChatReplyTo({ messageId: m._id, message: m.message, senderName })}
                          className={`self-center text-gray-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-all ${isMe ? 'mr-1' : 'ml-1'}`}
                        >
                          <CornerUpLeft size={14}/>
                        </button>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
                {/* Reply preview bar */}
                {chatReplyTo && (
                  <div className="mx-4 mb-2 px-3 py-2 bg-primary/10 border-l-4 border-primary rounded-lg flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-primary font-semibold mb-0.5">↩ Replying to {chatReplyTo.senderName}</p>
                      <p className="text-xs text-gray-400 truncate">{chatReplyTo.message}</p>
                    </div>
                    <button onClick={() => setChatReplyTo(null)} className="text-gray-500 hover:text-white flex-shrink-0"><X size={14}/></button>
                  </div>
                )}
                <form onSubmit={handleSendChatMsg} className="p-4 border-t border-dark-border flex gap-3">
                  <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} placeholder="Message the community..." className="input flex-1 py-2.5"/>
                  <button type="submit" className="btn-primary px-4"><Send size={18}/></button>
                </form>
              </div>
            ) : (
              <div className="text-center py-20 card">
                <MessageCircle size={48} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Members only chat</h3>
                <p className="text-gray-400">Join this community to participate in the chat.</p>
              </div>
            )}
          </>
        )}

        {/* ── Members ── */}
        {activeTab === 'members' && (
          <div className="card">
            <h3 className="text-lg font-bold text-white mb-4">Members ({members.length})</h3>
            <div className="space-y-3">
              {members.map((m, index) => {
                const memberId = m?._id || m;
                const memberUsername = m?.username || 'Unknown user';
                return (
                  <div key={memberId || index} className="flex items-center justify-between p-3 rounded-xl bg-dark hover:bg-[#2a2b2f] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 avatar bg-primary/30 flex items-center justify-center text-primary font-bold">
                        {m?.profileImage
                          ? <img src={m.profileImage.startsWith('http') ? m.profileImage : `${API_BASE}${m.profileImage}`} className="w-full h-full object-cover" alt="" />
                          : memberUsername?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <button onClick={() => memberId && navigate(`/profile/${memberId}`)} className="font-semibold text-white hover:text-primary">
                          {memberUsername}
                        </button>
                        {creatorId === memberId && <span className="block text-xs text-accent">Admin</span>}
                      </div>
                    </div>
                    {isAdmin && creatorId !== memberId && memberId && (
                      <button onClick={() => handleRemoveMember(memberId)} className="text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition-colors">
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Join Requests (Admin Only) ── */}
        {activeTab === 'requests' && isAdmin && (
          <div className="card">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <UserCheck size={18} className="text-primary"/> Join Requests ({joinRequests.length})
            </h3>
            {joinRequests.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No pending join requests.</p>
            ) : (
              <div className="space-y-3">
                {joinRequests.map((req, i) => {
                  const u = req.user;
                  const userId = u?._id || u;
                  const username = u?.username || 'Unknown';
                  return (
                    <div key={userId || i} className="flex items-center justify-between p-4 rounded-xl bg-dark border border-dark-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 avatar bg-primary/30 flex items-center justify-center text-primary font-bold overflow-hidden">
                          {u?.profileImage
                            ? <img src={u.profileImage.startsWith('http') ? u.profileImage : `${API_BASE}${u.profileImage}`} className="w-full h-full object-cover" alt=""/>
                            : username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <button onClick={() => userId && navigate(`/profile/${userId}`)} className="font-semibold text-white hover:text-primary transition-colors">
                            {username}
                          </button>
                          <p className="text-xs text-gray-500">
                            Requested {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString() : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleJoinRequest(userId, 'accept')}
                          className="flex items-center gap-1.5 text-sm text-green-400 hover:text-white px-3 py-1.5 rounded-lg border border-green-500/30 hover:bg-green-500 transition-all">
                          <UserCheck size={14}/> Accept
                        </button>
                        <button onClick={() => handleJoinRequest(userId, 'reject')}
                          className="flex items-center gap-1.5 text-sm text-red-400 hover:text-white px-3 py-1.5 rounded-lg border border-red-500/30 hover:bg-red-500 transition-all">
                          <UserX size={14}/> Reject
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

      <ImageViewerModal isOpen={!!selectedArtwork} onClose={() => setSelectedArtwork(null)} artwork={selectedArtwork} reportTargetType="artwork" />
    </div>
  );
}
