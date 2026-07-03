import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Send, Search, Plus, X, Users, MessageCircle, CornerUpLeft, Edit3, LogOut, UserMinus, Check, MoreVertical, Paperclip, Smile, ShieldCheck, User, Zap, Info, ArrowRight, Shield, Command, Globe, Palette, BadgeCheck, Upload } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

function ReplyPreview({ replyTo, onCancel }) {
  if (!replyTo) return null;
  return (
    <div className="mx-6 mb-4 px-5 py-4 bg-primary/5 border-l-[6px] border-primary rounded-[1.5rem] flex items-start justify-between gap-4 animate-slide-up backdrop-blur-3xl shadow-xl">
      <div className="min-w-0">
        <p className="text-[9px] text-primary font-black uppercase tracking-[0.3em] mb-1.5 flex items-center gap-2">
           <CornerUpLeft size={10}/> Replying to {replyTo.senderName}
        </p>
        <p className="text-xs text-gray-400 truncate font-medium italic opacity-80 leading-relaxed">{replyTo.message}</p>
      </div>
      <button onClick={onCancel} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all hover:bg-white/10 shadow-inner">
         <X size={14}/>
      </button>
    </div>
  );
}

function MessageBubble({ m, isMe, mode, onReply, navigate }) {
  const [showActions, setShowActions] = useState(false);
  const sName = m.sender?.username || 'Artist';
  const sImg = m.sender?.profileImage;
  const senderId = m.sender?._id || m.sender;
  const imgSrc = sImg ? (sImg.startsWith('http') ? sImg : `${API_BASE}${sImg}`) : null;

  return (
    <div
      className={`flex gap-5 group ${isMe ? 'flex-row-reverse' : ''} animate-fade-in relative`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <button
        onClick={() => senderId && navigate(`/profile/${senderId}`)}
        className="w-11 h-11 rounded-[1.25rem] bg-surface/40 flex-shrink-0 flex items-center justify-center text-xs font-black text-primary overflow-hidden border border-white/5 shadow-2xl self-end hover:scale-110 transition-all hover:border-primary/40 group-hover:rotate-3 duration-500"
      >
        {imgSrc ? <img src={imgSrc} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center bg-primary/10">{sName[0]?.toUpperCase()}</div>}
      </button>

      <div className={`flex flex-col max-w-[80%] md:max-w-[65%] ${isMe ? 'items-end' : 'items-start'} space-y-1.5`}>
        {mode === 'groups' && !isMe && (
           <span className="text-[9px] font-black text-gray-500 mb-0.5 ml-3 uppercase tracking-[0.3em] hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/profile/${senderId}`)}>
              {sName}
           </span>
        )}

        {m.replyTo?.message && (
          <div className={`mb-1 px-4 py-3 rounded-[1.25rem] bg-white/5 border-l-4 border-primary/40 text-[11px] max-w-full backdrop-blur-md opacity-60 hover:opacity-100 transition-opacity cursor-pointer group/reply`}>
            <p className="text-primary font-black uppercase text-[8px] mb-1 tracking-widest group-hover/reply:tracking-[0.2em] transition-all">{m.replyTo.senderName}</p>
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

      <div className={`self-center flex items-center gap-2 transition-all duration-500 ${showActions ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} ${isMe ? 'mr-2' : 'ml-2'}`}>
        <button
          onClick={() => onReply({ messageId: m._id, message: m.message, senderName: sName })}
          className="w-10 h-10 rounded-2xl bg-surface/60 backdrop-blur-3xl flex items-center justify-center text-gray-500 hover:text-primary transition-all border border-white/5 hover:border-primary/20 hover:-translate-y-1 shadow-xl"
          title="Reply"
        >
          <CornerUpLeft size={16}/>
        </button>
      </div>
    </div>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [selectedDM, setSelectedDM] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [dmMsg, setDmMsg] = useState('');
  const [dmReplyTo, setDmReplyTo] = useState(null);
  const [typing, setTyping] = useState(false);

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [groupMsg, setGroupMsg] = useState('');
  const [groupReplyTo, setGroupReplyTo] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const [mode, setMode] = useState('dm');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMemberIds, setGroupMemberIds] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState([]);

  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [addMemberResults, setAddMemberResults] = useState([]);

  const endRef = useRef(null);

  useEffect(() => {
    api.get('/chat/conversations').then(r => setConversations(r.data)).catch(() => {});
    api.get('/groups').then(r => setGroups(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (location.state?.openDM) {
      setSelectedDM(location.state.openDM);
      setMode('dm');
    }
  }, [location.state]);

  useEffect(() => {
    if (selectedDM && socket) {
      api.get(`/chat/${selectedDM._id}`).then(r => setDmMessages(r.data));
      socket.emit('join_room', { senderId: user._id, receiverId: selectedDM._id });
      socket.on('receive_message', m => setDmMessages(prev => [...prev, m]));
      socket.on('user_typing', () => setTyping(true));
      socket.on('user_stop_typing', () => setTyping(false));
      return () => { socket.off('receive_message'); socket.off('user_typing'); socket.off('user_stop_typing'); };
    }
  }, [selectedDM, socket, user._id]);

  useEffect(() => {
    if (selectedGroup && socket) {
      api.get(`/groups/${selectedGroup._id}/messages`).then(r => setGroupMessages(r.data));
      socket.emit('join_group_room', selectedGroup._id);
      socket.on('receive_group_message', m => setGroupMessages(prev => [...prev, m]));
      return () => { socket.off('receive_group_message'); };
    }
  }, [selectedGroup, socket]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [dmMessages, groupMessages]);

  const sendDM = async e => {
    e.preventDefault();
    if (!dmMsg.trim() || !selectedDM) return;
    try {
      const payload = { message: dmMsg };
      if (dmReplyTo) payload.replyTo = dmReplyTo;
      const res = await api.post(`/chat/${selectedDM._id}`, payload);
      if (socket) socket.emit('send_message', {
        senderId: user._id, receiverId: selectedDM._id, message: dmMsg,
        senderInfo: { _id: user._id, username: user.username, profileImage: user.profileImage },
        replyTo: dmReplyTo || null,
      });
      setDmMessages(prev => [...prev, res.data]);
      setDmMsg(''); setDmReplyTo(null);
    } catch {}
  };

  const sendGroupMsg = async e => {
    e.preventDefault();
    if (!groupMsg.trim() || !selectedGroup) return;
    try {
      const payload = { message: groupMsg };
      if (groupReplyTo) payload.replyTo = groupReplyTo;
      const res = await api.post(`/groups/${selectedGroup._id}/messages`, payload);
      if (socket) socket.emit('send_group_message', {
        groupId: selectedGroup._id, message: groupMsg,
        senderInfo: { _id: user._id, username: user.username, profileImage: user.profileImage },
        replyTo: groupReplyTo || null,
      });
      setGroupMessages(prev => [...prev, res.data]);
      setGroupMsg(''); setGroupReplyTo(null);
    } catch {}
  };

  const searchUsers = async q => {
    setSearchQ(q);
    if (q.length > 1) {
      const r = await api.get(`/auth/search?q=${q}`);
      setSearchResults(r.data.filter(u => u._id !== user._id));
    } else setSearchResults([]);
  };

  const searchMembers = async q => {
    setMemberSearch(q);
    if (q.length > 1) {
      const r = await api.get(`/auth/search?q=${q}`);
      setMemberSearchResults(r.data.filter(u => u._id !== user._id));
    } else setMemberSearchResults([]);
  };

  const startDM = u => { setSelectedDM(u); setSelectedGroup(null); setMode('dm'); setSearchQ(''); setSearchResults([]); setShowGroupInfo(false); };

  const createGroup = async e => {
    e.preventDefault();
    if (!groupName.trim()) return;
    try {
      const res = await api.post('/groups', { name: groupName, memberIds: groupMemberIds });
      setGroups(prev => [res.data, ...prev]);
      setShowCreateGroup(false); setGroupName(''); setGroupMemberIds([]); setMemberSearch(''); setMemberSearchResults([]);
      setSelectedGroup(res.data); setSelectedDM(null); setMode('groups');
      toast.success('Community created');
    } catch (err) { toast.error(err.response?.data?.message || 'Group initialization failed'); }
  };

  const saveGroupName = async () => {
    if (!newGroupName.trim() || !selectedGroup) return;
    try {
      const res = await api.put(`/groups/${selectedGroup._id}`, { name: newGroupName });
      setSelectedGroup(res.data);
      setGroups(prev => prev.map(g => g._id === res.data._id ? res.data : g));
      setEditingGroupName(false);
      toast.success('Group name updated');
    } catch { toast.error('Update failed'); }
  };

  const leaveGroup = async () => {
    if (!selectedGroup) return;
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await api.post(`/groups/${selectedGroup._id}/leave`);
      setGroups(prev => prev.filter(g => g._id !== selectedGroup._id));
      setSelectedGroup(null); setShowGroupInfo(false);
      toast.success('Leaved successfully');
    } catch (err) { toast.error(err.response?.data?.message || 'Decoupling sequence failed'); }
  };

  const removeMemberFromGroup = async userId => {
    if (!selectedGroup) return;
    try {
      await api.delete(`/groups/${selectedGroup._id}/members/${userId}`);
      const updated = { ...selectedGroup, members: selectedGroup.members.filter(m => (m._id || m) !== userId) };
      setSelectedGroup(updated);
      setGroups(prev => prev.map(g => g._id === selectedGroup._id ? updated : g));
      toast.success('Member removed from community');
    } catch { toast.error('Could not remove member'); }
  };

  const toggleGroupMember = uid => {
    setGroupMemberIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  const searchAddMembers = async q => {
    setAddMemberSearch(q);
    if (q.length > 1) {
      const r = await api.get(`/auth/search?q=${q}`);
      setAddMemberResults(r.data.filter(u => u._id !== user._id && !selectedGroup?.members.some(m => (m._id || m) === u._id)));
    } else setAddMemberResults([]);
  };

  const addMemberToGroup = async userId => {
    if (!selectedGroup) return;
    try {
      const res = await api.post(`/groups/${selectedGroup._id}/members`, { userId });
      setSelectedGroup(res.data);
      setGroups(prev => prev.map(g => g._id === selectedGroup._id ? res.data : g));
      setShowAddMember(false);
      setAddMemberSearch('');
      setAddMemberResults([]);
      toast.success('Artist added to group');
    } catch { toast.error('Could not add artist'); }
  };

  const getImg = u => u?.profileImage ? (u.profileImage.startsWith('http') ? u.profileImage : `${API_BASE}${u.profileImage}`) : null;

  const Avatar = ({ u, size = 12, clickable = false }) => {
    const id = u?._id || u;
    const name = u?.username || u?.name || 'V';
    const imgSrc = getImg(u);
    const dimension = `${size * 0.25}rem`;
    const cls = `rounded-[1.25rem] flex-shrink-0 overflow-hidden flex items-center justify-center font-black text-xs border border-white/5 shadow-2xl relative group-hover:scale-105 transition-transform duration-500`;
    return imgSrc
      ? <img src={imgSrc} style={{ width: dimension, height: dimension }} className={`${cls} object-cover ${clickable ? 'cursor-pointer hover:border-primary/40' : ''}`} alt="" onClick={clickable ? () => navigate(`/profile/${id}`) : undefined}/>
      : <div style={{ width: dimension, height: dimension }} className={`${cls} bg-primary/10 text-primary ${clickable ? 'cursor-pointer hover:border-primary/40' : ''}`} onClick={clickable ? () => navigate(`/profile/${id}`) : undefined}>{name[0].toUpperCase()}</div>;
  };

  const isGroupAdmin = selectedGroup && (selectedGroup.creator?._id || selectedGroup.creator) === user._id;
  const currentMessages = mode === 'dm' ? dmMessages : groupMessages;
  const currentSelected = mode === 'dm' ? selectedDM : selectedGroup;

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-12rem)] xl:h-[calc(100vh-12rem)] gap-8 animate-fade-in px-4 lg:px-0 selection:bg-primary selection:text-white">
      {/* Sidebar - Artist Console */}
      <div className="w-full xl:w-[400px] min-h-[520px] xl:min-h-0 flex flex-col bg-dark-card border border-white/5 rounded-[2.5rem] xl:rounded-[3.5rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] relative group">
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
        
        <div className="p-10 pb-6 space-y-8 relative z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-4 leading-none">
               Art <span className="text-primary italic">Links</span>
            </h2>
            <button onClick={() => setShowCreateGroup(true)} title="Join Group"
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all group/plus">
              <Plus size={22} className="group-hover/plus:rotate-90 transition-transform duration-500" />
            </button>
          </div>
          
          <div className="relative group/search">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/search:text-primary transition-colors duration-500"/>
            <input 
              value={searchQ} 
              onChange={e => searchUsers(e.target.value)} 
              placeholder="Search Community..." 
              className="w-full bg-surface/40 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-[13px] font-medium text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all duration-500 shadow-inner"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="relative z-[50] -mt-4">
               <div className="bg-surface/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-3 space-y-2 max-h-64 overflow-y-auto shadow-2xl animate-slide-up">
                {searchResults.map(u => (
                  <div key={u._id} onClick={() => startDM(u)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/5 transition-all group">
                    <Avatar u={u} size={10}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white group-hover:text-primary transition-colors">{u.username}</p>
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-0.5">Start</p>
                    </div>
                    <ArrowRight size={14} className="text-gray-700 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex px-10 gap-8 border-b border-white/5 relative z-10">
          {['dm','groups'].map(m => (
            <button key={m} onClick={() => setMode(m)} className={`pb-6 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-all relative group/tab ${mode === m ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}>
              {m === 'dm' ? <><MessageCircle size={16} className={`${mode === m ? 'text-primary' : ''}`} /> Direct</> : <><Users size={16} className={`${mode === m ? 'text-primary' : ''}`} /> Community</>}
              {mode === m && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary shadow-[0_0_15px_rgba(124,58,237,0.5)] rounded-full animate-fade-in" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-3 relative z-10">
          {mode === 'dm' && (conversations.length === 0
            ? <div className="flex flex-col items-center justify-center py-20 text-gray-600 space-y-6 opacity-30">
                <div className="w-20 h-20 bg-surface/40 rounded-[2rem] flex items-center justify-center border border-dashed border-white/20">
                   <MessageCircle size={32}/>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center max-w-[150px] leading-relaxed">No chats yet</p>
              </div>
            : conversations.map((c, i) => (
              <div key={i} onClick={() => startDM(c.partner)} className={`flex items-center gap-5 p-5 rounded-[2.25rem] cursor-pointer transition-all duration-500 border group/item relative overflow-hidden ${selectedDM?._id === c.partner._id ? 'bg-surface border-white/10 shadow-2xl' : 'border-transparent hover:bg-surface/30'}`}>
                {selectedDM?._id === c.partner._id && <div className="absolute inset-y-0 left-0 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(124,58,237,1)]" />}
                <div className="relative shrink-0">
                  <Avatar u={c.partner} size={14}/>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-[3px] border-dark-card rounded-full shadow-lg animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-black text-white group-hover/item:text-primary transition-colors truncate">{c.partner.username}</p>
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">
                      {c.lastMessage ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium truncate opacity-80 group-hover/item:opacity-100 transition-opacity">
                    {c.lastMessage?.message || 'No messages yet'}
                  </p>
                </div>
              </div>
            ))
          )}
          {mode === 'groups' && (groups.length === 0
            ? <div className="flex flex-col items-center justify-center py-20 text-gray-600 space-y-6 opacity-30">
                <div className="w-20 h-20 bg-surface/40 rounded-[2rem] flex items-center justify-center border border-dashed border-white/20">
                   <Users size={32}/>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center max-w-[180px] leading-relaxed">No active communities detected</p>
              </div>
            : groups.map(g => (
              <div key={g._id} onClick={() => { setSelectedGroup(g); setSelectedDM(null); setShowGroupInfo(false); }} className={`flex items-center gap-5 p-5 rounded-[2.25rem] cursor-pointer transition-all duration-500 border group/item relative overflow-hidden ${selectedGroup?._id === g._id ? 'bg-surface border-white/10 shadow-2xl' : 'border-transparent hover:bg-surface/30'}`}>
                {selectedGroup?._id === g._id && <div className="absolute inset-y-0 left-0 w-1 bg-accent rounded-full shadow-[0_0_10px_rgba(236,72,153,1)]" />}
                <div className="w-14 h-14 rounded-[1.25rem] bg-accent/5 border border-accent/20 flex items-center justify-center flex-shrink-0 shadow-inner group-hover/item:scale-105 transition-transform duration-500">
                   <Users size={24} className="text-accent opacity-60 group-hover/item:opacity-100 transition-opacity"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-black text-white group-hover/item:text-accent transition-colors truncate">{g.name}</p>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-accent/10 border border-accent/20">
                       <span className="text-[8px] font-black text-accent uppercase tracking-tighter">{g.members?.length || 0} Members</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest opacity-60">Group Chat</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Hub - Admin Panel */}
      <div className="flex-1 flex flex-col bg-dark-card border border-white/5 rounded-[4rem] overflow-hidden shadow-[0_60px_120px_-30px_rgba(0,0,0,0.9)] relative group/main">
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/main:opacity-100 transition-opacity duration-1000 pointer-events-none" />
        
        {currentSelected ? (
          <>
            {/* Chat Interface Header */}
            <div className="flex items-center justify-between px-12 py-8 border-b border-white/5 bg-surface/30 backdrop-blur-3xl relative z-10">
              <div className="flex items-center gap-6">
                {mode === 'dm' ? (
                  <>
                    <div className="relative group/hdr">
                      <Avatar u={selectedDM} size={14} clickable/>
                      <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-green-500 border-[3.5px] border-dark-card rounded-full shadow-lg animate-pulse" />
                    </div>
                    <div className="space-y-1.5">
                      <button onClick={() => navigate(`/profile/${selectedDM._id}`)} className="font-black text-white hover:text-primary transition-all tracking-tighter text-2xl leading-none flex items-center gap-3">
                         {selectedDM.username} <BadgeCheck size={20} className="text-primary fill-primary/10"/>
                      </button>
                      {typing ? (
                        <div className="flex items-center gap-3">
                           <div className="flex gap-1">
                              <span className="w-1 h-1 rounded-full bg-primary animate-bounce" />
                              <span className="w-1 h-1 rounded-full bg-primary animate-bounce delay-100" />
                              <span className="w-1 h-1 rounded-full bg-primary animate-bounce delay-200" />
                           </div>
                           <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em]">Processing Output...</p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-green-500/80 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Secure Art Link Active
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-[1.5rem] bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 shadow-2xl">
                       <Users size={32} className="text-accent opacity-80"/>
                    </div>
                    <div className="space-y-1.5">
                      <button onClick={() => setShowGroupInfo(!showGroupInfo)} className="font-black text-white hover:text-accent transition-all tracking-tighter text-2xl leading-none flex items-center gap-3 group/grp">
                        {selectedGroup.name} <Command size={18} className="text-accent group-hover/grp:rotate-45 transition-transform" />
                      </button>
                      <div className="flex items-center gap-4">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                           <Globe size={12} className="text-accent"/> Global Group
                        </p>
                        <div className="h-3 w-px bg-white/10" />
                        <p className="text-[10px] text-accent font-black uppercase tracking-[0.3em]">
                           {selectedGroup.members?.length || 0} Selected Members
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

            </div>

            <div className="flex flex-1 overflow-hidden relative z-10">
              {/* Central Art Feed */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-12 py-12 space-y-10 hide-scrollbar scroll-smooth">
                  {currentMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-8 opacity-20 group-hover:opacity-40 transition-opacity duration-1000">
                       <div className="w-32 h-32 bg-surface/40 rounded-[3rem] border border-dashed border-white/20 flex items-center justify-center">
                          <Zap size={48} className="text-gray-400"/>
                       </div>
                       <p className="text-sm font-black uppercase tracking-[0.5em] text-center">Awaiting Initial Message...</p>
                    </div>
                  ) : (
                    currentMessages.map((m, i) => {
                      const senderId = m.sender?._id || m.sender;
                      const isMe = senderId === user._id || senderId?.toString() === user._id;
                      return (
                        <MessageBubble key={i} m={m} isMe={isMe} mode={mode} navigate={navigate}
                          onReply={r => { if (mode === 'dm') setDmReplyTo(r); else setGroupReplyTo(r); }}
                        />
                      );
                    })
                  )}
                  <div ref={endRef}/>
                </div>

                {/* Input Art Bridge */}
                <div className="px-12 pb-12 pt-4">
                  <ReplyPreview replyTo={mode === 'dm' ? dmReplyTo : groupReplyTo} onCancel={() => mode === 'dm' ? setDmReplyTo(null) : setGroupReplyTo(null)}/>
                  <form onSubmit={mode === 'dm' ? sendDM : sendGroupMsg} className="relative flex items-center group/input shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]">
                    <div className="absolute left-6 flex items-center gap-3">
                       <button type="button" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-primary transition-all border border-transparent hover:border-white/10 group/clip">
                          <Paperclip size={20} className="group-hover/clip:rotate-45 transition-transform" />
                       </button>
                    </div>
                    <input
                      value={mode === 'dm' ? dmMsg : groupMsg}
                      onChange={e => {
                        if (mode === 'dm') { setDmMsg(e.target.value); if (socket && selectedDM) socket.emit('typing', { senderId: user._id, receiverId: selectedDM._id }); }
                        else setGroupMsg(e.target.value);
                      }}
                      onBlur={() => { if (mode === 'dm' && socket && selectedDM) socket.emit('stop_typing', { senderId: user._id, receiverId: selectedDM._id }); }}
                      placeholder={mode === 'dm' ? 'Type a message...' : `Sending to group: ${selectedGroup?.name}...`}
                      className="w-full bg-surface/40 backdrop-blur-3xl border-2 border-white/5 rounded-[2.5rem] pl-20 pr-40 py-6 text-[15px] font-medium text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all duration-500 shadow-inner group-focus-within/input:bg-surface/60"
                    />
                    <div className="absolute right-6 flex items-center gap-4">

                       <button type="submit" disabled={!(mode === 'dm' ? dmMsg : groupMsg).trim()} className="h-14 px-8 bg-gradient-to-r from-primary to-accent rounded-[1.5rem] flex items-center justify-center gap-3 text-white shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-20 disabled:translate-y-0 group/send">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] hidden sm:block">Send</span>
                          <Send size={20} className="group-hover/send:translate-x-1 group-hover/send:-translate-y-1 transition-transform" />
                       </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Community Intelligence Panel */}
              {mode === 'groups' && showGroupInfo && selectedGroup && (
                <div className="w-[380px] border-l border-white/5 bg-surface/20 backdrop-blur-3xl flex flex-col overflow-hidden animate-slide-right relative">
                  <div className="absolute inset-0 bg-accent/5 opacity-30 pointer-events-none" />
                  
                  <div className="p-10 border-b border-white/5 relative z-10">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] flex items-center gap-3">
                         <Info size={16} className="text-accent"/> Group Intel
                      </h3>
                      <button onClick={() => setShowGroupInfo(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-600 hover:text-white transition-all"><X size={20}/></button>
                    </div>
                    
                    <div className="flex flex-col items-center text-center mb-10">
                       <div className="w-28 h-28 rounded-[2.5rem] bg-accent/10 border border-accent/20 flex items-center justify-center mb-6 shadow-[0_30px_60px_-15px_rgba(236,72,153,0.3)] relative group/logo">
                          <Users size={48} className="text-accent group-hover/logo:scale-110 transition-transform duration-700"/>
                          <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full -z-10 opacity-40 group-hover/logo:opacity-100 transition-opacity" />
                       </div>
                       {isGroupAdmin && editingGroupName ? (
                        <div className="flex flex-col gap-4 w-full animate-fade-in">
                          <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full bg-dark/60 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-white focus:border-accent transition-all text-center" placeholder="New Group Name"/>
                          <div className="flex gap-3">
                             <button onClick={saveGroupName} className="flex-1 bg-accent text-white font-black text-[9px] uppercase tracking-[0.3em] py-3.5 rounded-xl shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all">Save</button>
                             <button onClick={() => setEditingGroupName(false)} className="flex-1 bg-white/5 text-gray-400 font-black text-[9px] uppercase tracking-[0.3em] py-3.5 rounded-xl hover:text-white transition-all">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="group/name relative px-8">
                          <h4 className="text-2xl font-black text-white mb-2 tracking-tighter leading-tight">{selectedGroup.name}</h4>
                          <p className="text-[9px] font-black text-accent uppercase tracking-[0.4em] italic">Open Group</p>
                          {isGroupAdmin && (
                            <button onClick={() => { setNewGroupName(selectedGroup.name); setEditingGroupName(true); }} className="absolute -right-2 top-1 text-gray-600 hover:text-accent transition-all opacity-0 group-hover/name:opacity-100 bg-white/5 p-2 rounded-lg"><Edit3 size={14}/></button>
                          )}
                        </div>
                      )}
                    </div>

                    {!isGroupAdmin && (
                      <button onClick={leaveGroup} className="w-full flex items-center justify-center gap-4 text-[10px] font-black text-red-400 uppercase tracking-[0.3em] bg-red-500/5 hover:bg-red-500 hover:text-white border border-red-500/20 py-5 rounded-[1.5rem] transition-all duration-500 group/exit shadow-2xl">
                        <LogOut size={18} className="group-hover/exit:-translate-x-2 transition-transform" /> Leave Group
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-8 hide-scrollbar relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Members ({selectedGroup.members?.length || 0})</p>
                      {isGroupAdmin && (
                        <button onClick={() => setShowAddMember(true)} className="flex items-center gap-2 text-[9px] font-black text-primary uppercase tracking-[0.3em] hover:text-white transition-all bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                          <Plus size={12}/> Add
                        </button>
                      )}
                    </div>
                    
                    {showAddMember && (
                      <div className="bg-surface/80 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-primary/30 animate-slide-up shadow-2xl mb-8 relative group/add">
                        <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] pointer-events-none" />
                        <div className="flex items-center justify-between mb-6 relative z-10">
                          <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2"><Zap size={14} className="text-primary animate-pulse"/> New Artist</span>
                          <button onClick={() => { setShowAddMember(false); setAddMemberSearch(''); setAddMemberResults([]); }} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all"><X size={14}/></button>
                        </div>
                        <div className="relative mb-6 z-10">
                          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"/>
                          <input placeholder="Search artists..." className="w-full bg-dark/60 border border-white/5 rounded-xl pl-12 pr-4 py-4 text-xs font-black text-white placeholder-gray-700 focus:border-primary/50 transition-all shadow-inner" value={addMemberSearch} onChange={e => searchAddMembers(e.target.value)}/>
                        </div>
                        {addMemberResults.length > 0 && (
                          <div className="space-y-3 max-h-56 overflow-y-auto hide-scrollbar pr-2 relative z-10">
                            {addMemberResults.map(u => (
                              <div key={u._id} onClick={() => addMemberToGroup(u._id)} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 hover:bg-primary border border-transparent hover:border-white/10 cursor-pointer transition-all duration-500 group/res">
                                <Avatar u={u} size={10}/>
                                <span className="text-xs font-black text-white flex-1 truncate group-hover/res:translate-x-1 transition-transform">{u.username}</span>
                                <Plus size={14} className="text-primary group-hover/res:text-white group-hover/res:rotate-90 transition-all" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-4">
                      {(selectedGroup.members || []).map((m, i) => {
                        const mid = m?._id || m;
                        const mname = m?.username || 'Artist';
                        const isCreator = (selectedGroup.creator?._id || selectedGroup.creator) === mid;
                        return (
                          <div key={mid || i} className="flex items-center gap-4 p-4 rounded-[1.75rem] bg-white/5 border border-transparent hover:border-white/10 hover:bg-white/10 transition-all duration-500 group/mbr relative overflow-hidden">
                            <Avatar u={m} size={12} clickable/>
                            <div className="flex-1 min-w-0">
                              <button onClick={() => mid && navigate(`/profile/${mid}`)} className="text-sm font-black text-white hover:text-primary transition-colors truncate block tracking-tight">{mname}</button>
                              {isCreator && (
                                <div className="flex items-center gap-2 mt-1">
                                   <Shield size={10} className="text-primary" />
                                   <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Group Owner</span>
                                </div>
                              )}
                            </div>
                            {isGroupAdmin && !isCreator && (
                              <button onClick={() => removeMemberFromGroup(mid)} title="Remove Member" className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 opacity-0 group-hover/mbr:opacity-100 hover:bg-red-500 hover:text-white transition-all duration-500 flex items-center justify-center shadow-lg">
                                 <UserMinus size={18}/>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="max-w-md animate-slide-up relative z-10 space-y-10">
              <div className="w-32 h-32 bg-surface/40 rounded-[3rem] flex items-center justify-center mx-auto shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] relative group/empty border border-white/5">
                 <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover/empty:opacity-100 transition-opacity duration-1000" />
                 <MessageCircle size={56} className="text-gray-700 relative z-10 group-hover/empty:scale-110 group-hover/empty:text-primary transition-all duration-1000"/>
              </div>
              <div className="space-y-4">
                 <h3 className="text-4xl font-black text-white tracking-tighter leading-tight">Art Link <span className="text-primary italic">Standby</span></h3>
                 <p className="text-gray-500 font-medium text-lg leading-relaxed px-10">Start a chat or create a group to begin.</p>
              </div>
              <button onClick={() => setShowCreateGroup(true)} className="h-20 px-16 bg-gradient-to-r from-primary to-accent text-white font-black rounded-[2rem] text-[11px] uppercase tracking-[0.4em] shadow-[0_30px_60px_-15px_rgba(124,58,237,0.5)] hover:shadow-primary/70 hover:scale-105 active:scale-95 transition-all duration-500 flex items-center justify-center gap-6 mx-auto">
                Create Group <ArrowRight size={24} className="animate-bounce-x"/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Join Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-dark/95 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl animate-fade-in selection:bg-accent selection:text-white">
          <div className="bg-[#0c0d0f] border-2 border-white/10 rounded-[4rem] p-16 w-full max-w-2xl shadow-[0_0_120px_rgba(0,0,0,0.8)] animate-slide-up relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full -mr-40 -mt-40 blur-[100px] animate-pulse" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full -ml-32 -mb-32 blur-[100px] animate-pulse delay-1000" />
            
            <div className="flex justify-between items-start mb-14 relative z-10">
              <div className="space-y-3">
                <h3 className="text-5xl font-black text-white tracking-tighter leading-none flex items-center gap-6">
                   <Users size={48} className="text-primary"/> New <span className="text-primary italic">Group</span>
                </h3>
                <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.5em] ml-1">Initializing public art hub architecture</p>
              </div>
              <button onClick={() => setShowCreateGroup(false)} className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all hover:bg-white/10 hover:rotate-90 duration-500">
                 <X size={32}/>
              </button>
            </div>
            
            <form onSubmit={createGroup} className="space-y-12 relative z-10">
              <div className="space-y-4">
                 <div className="flex items-center gap-3 ml-2">
                    <Palette size={16} className="text-primary" />
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Group Name</label>
                 </div>
                 <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Watercolor Friends" className="w-full bg-surface/40 border-2 border-white/5 rounded-[2rem] px-10 py-7 text-xl font-black text-white focus:border-primary/50 transition-all duration-500 shadow-inner tracking-tight" required/>
              </div>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                   <div className="flex items-center gap-3">
                      <Zap size={16} className="text-primary animate-pulse"/>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Member Members</label>
                   </div>
                   <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">{groupMemberIds.length} members added</span>
                </div>
                
                <div className="relative group/add">
                  <Search size={22} className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/add:text-primary transition-colors duration-500"/>
                  <input placeholder="Search artists..." className="w-full bg-surface/40 border-2 border-white/5 rounded-[2rem] pl-20 pr-10 py-7 text-sm font-black text-white focus:border-primary/50 transition-all duration-500 shadow-inner" value={memberSearch} onChange={e => searchMembers(e.target.value)}/>
                </div>
                
                {memberSearchResults.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[280px] overflow-y-auto hide-scrollbar border-2 border-white/5 rounded-[3rem] p-8 bg-black/40 shadow-inner">
                    {memberSearchResults.map(u => (
                      <div key={u._id} onClick={() => toggleGroupMember(u._id)} className={`flex items-center gap-5 p-5 rounded-[2rem] cursor-pointer transition-all duration-500 border group/mitem ${groupMemberIds.includes(u._id) ? 'bg-primary border-primary shadow-[0_15px_30px_-10px_rgba(124,58,237,0.4)]' : 'bg-white/5 border-transparent hover:border-white/20'}`}>
                        <div className="relative shrink-0">
                           <Avatar u={u} size={11}/>
                           {groupMemberIds.includes(u._id) && (
                              <div className="absolute -top-2 -right-2 bg-white text-primary rounded-full p-1 shadow-lg">
                                 <Check size={12} strokeWidth={4}/>
                              </div>
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                           <span className={`text-sm font-black transition-colors duration-500 ${groupMemberIds.includes(u._id) ? 'text-white' : 'text-white group-hover/mitem:text-primary'}`}>{u.username}</span>
                           <p className={`text-[8px] font-black uppercase tracking-widest mt-1 ${groupMemberIds.includes(u._id) ? 'text-white/60' : 'text-gray-600'}`}>{groupMemberIds.includes(u._id) ? 'Member Read' : 'Tap to add'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-8 pt-6">
                <button type="submit" className="flex-1 h-24 bg-gradient-to-r from-primary to-accent text-white font-black rounded-[2.5rem] text-[12px] uppercase tracking-[0.4em] shadow-[0_30px_60px_-15px_rgba(124,58,237,0.5)] hover:shadow-primary/70 hover:scale-[1.02] active:scale-95 transition-all duration-500 flex items-center justify-center gap-6">
                   Create Group <ArrowRight size={28} className="animate-bounce-x"/>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
