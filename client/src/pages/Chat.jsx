import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { Send, Search, Plus, X, Users, MessageCircle, CornerUpLeft, Edit3, LogOut, UserMinus, Check } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

function ReplyPreview({ replyTo, onCancel }) {
  if (!replyTo) return null;
  return (
    <div className="mx-4 mb-2 px-3 py-2 bg-primary/10 border-l-4 border-primary rounded-lg flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs text-primary font-semibold mb-0.5">↩ Replying to {replyTo.senderName}</p>
        <p className="text-xs text-gray-400 truncate">{replyTo.message}</p>
      </div>
      <button onClick={onCancel} className="text-gray-500 hover:text-white flex-shrink-0"><X size={14}/></button>
    </div>
  );
}

function MessageBubble({ m, isMe, mode, onReply, navigate }) {
  const [showActions, setShowActions] = useState(false);
  const sName = m.sender?.username || 'Unknown';
  const sImg = m.sender?.profileImage;
  const senderId = m.sender?._id || m.sender;
  const imgSrc = sImg ? (sImg.startsWith('http') ? sImg : `${API_BASE}${sImg}`) : null;

  return (
    <div
      className={`flex gap-2 group ${isMe ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar — clickable to profile */}
      <button
        onClick={() => senderId && navigate(`/profile/${senderId}`)}
        className="w-8 h-8 rounded-full bg-primary/30 flex-shrink-0 flex items-center justify-center text-xs font-bold text-primary overflow-hidden hover:ring-2 hover:ring-primary transition-all self-end"
        title={`View ${sName}'s profile`}
      >
        {imgSrc ? <img src={imgSrc} alt="" className="w-full h-full object-cover"/> : sName[0]?.toUpperCase()}
      </button>

      <div className={`flex flex-col max-w-xs ${isMe ? 'items-end' : 'items-start'}`}>
        {mode === 'groups' && !isMe && <span className="text-xs text-gray-500 mb-1">{sName}</span>}

        {/* Reply preview */}
        {m.replyTo?.message && (
          <div className={`mb-1 px-3 py-1.5 rounded-lg bg-dark border-l-4 border-primary/50 text-xs max-w-full`}>
            <p className="text-primary/80 font-semibold">{m.replyTo.senderName}</p>
            <p className="text-gray-500 truncate">{m.replyTo.message}</p>
          </div>
        )}

        <div className={`relative px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-br-md' : 'bg-surface text-gray-200 rounded-bl-md'}`}>
          {m.message}
          <p className={`text-[10px] mt-1 ${isMe ? 'text-white/50' : 'text-gray-500'}`}>
            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Reply action button */}
      {showActions && (
        <button
          onClick={() => onReply({ messageId: m._id, message: m.message, senderName: sName })}
          className={`self-center text-gray-500 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 ${isMe ? 'mr-1' : 'ml-1'}`}
          title="Reply"
        >
          <CornerUpLeft size={15}/>
        </button>
      )}
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

  // Handle Message button from Profile page
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
  }, [selectedDM, socket]);

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
    } catch (err) { alert(err.response?.data?.message || 'Failed to create group'); }
  };

  const saveGroupName = async () => {
    if (!newGroupName.trim() || !selectedGroup) return;
    try {
      const res = await api.put(`/groups/${selectedGroup._id}`, { name: newGroupName });
      setSelectedGroup(res.data);
      setGroups(prev => prev.map(g => g._id === res.data._id ? res.data : g));
      setEditingGroupName(false);
    } catch { alert('Failed to update group name'); }
  };

  const leaveGroup = async () => {
    if (!selectedGroup) return;
    if (!window.confirm('Leave this group?')) return;
    try {
      await api.post(`/groups/${selectedGroup._id}/leave`);
      setGroups(prev => prev.filter(g => g._id !== selectedGroup._id));
      setSelectedGroup(null); setShowGroupInfo(false);
    } catch (err) { alert(err.response?.data?.message || 'Failed to leave group'); }
  };

  const removeMemberFromGroup = async userId => {
    if (!selectedGroup) return;
    try {
      const res = await api.delete(`/groups/${selectedGroup._id}/members/${userId}`);
      const updated = { ...selectedGroup, members: selectedGroup.members.filter(m => (m._id || m) !== userId) };
      setSelectedGroup(updated);
      setGroups(prev => prev.map(g => g._id === selectedGroup._id ? updated : g));
    } catch { alert('Failed to remove member'); }
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
    } catch { alert('Failed to add member'); }
  };

  const getImg = u => u?.profileImage ? (u.profileImage.startsWith('http') ? u.profileImage : `${API_BASE}${u.profileImage}`) : null;

  const Avatar = ({ u, size = 10, clickable = false }) => {
    const id = u?._id || u;
    const name = u?.username || u?.name || '?';
    const imgSrc = getImg(u);
    const cls = `w-${size} h-${size} rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-sm`;
    return imgSrc
      ? <img src={imgSrc} className={`${cls} object-cover ${clickable ? 'cursor-pointer hover:ring-2 hover:ring-primary' : ''}`} alt="" onClick={clickable ? () => navigate(`/profile/${id}`) : undefined}/>
      : <div className={`${cls} bg-primary/30 text-primary ${clickable ? 'cursor-pointer hover:ring-2 hover:ring-primary' : ''}`} onClick={clickable ? () => navigate(`/profile/${id}`) : undefined}>{name[0].toUpperCase()}</div>;
  };

  const isGroupAdmin = selectedGroup && (selectedGroup.creator?._id || selectedGroup.creator) === user._id;
  const currentMessages = mode === 'dm' ? dmMessages : groupMessages;
  const currentSelected = mode === 'dm' ? selectedDM : selectedGroup;

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4 animate-fade-in">
      {/* ── Sidebar ── */}
      <div className="w-72 flex flex-col card p-0 overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">Messages</h2>
            <button onClick={() => setShowCreateGroup(true)} title="New Group"
              className="flex items-center gap-1 text-xs text-primary hover:text-white bg-primary/10 hover:bg-primary px-2 py-1 rounded-lg transition-all">
              <Plus size={13}/> Group
            </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
            <input value={searchQ} onChange={e => searchUsers(e.target.value)} placeholder="Search users..." className="input pl-9 py-2 text-sm"/>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {searchResults.map(u => (
                <div key={u._id} onClick={() => startDM(u)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface cursor-pointer">
                  <Avatar u={u} size={8}/><span className="text-sm text-white">{u.username}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex border-b border-dark-border">
          {['dm','groups'].map(m => (
            <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${mode === m ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'}`}>
              {m === 'dm' ? <><MessageCircle size={14}/> Direct</> : <><Users size={14}/> Groups</>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {mode === 'dm' && (conversations.length === 0
            ? <div className="text-center py-10 text-gray-500 text-sm">No conversations yet</div>
            : conversations.map((c, i) => (
              <div key={i} onClick={() => startDM(c.partner)} className={`flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-surface ${selectedDM?._id === c.partner._id ? 'bg-surface border-l-2 border-primary' : ''}`}>
                <Avatar u={c.partner} size={10}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{c.partner.username}</p>
                  <p className="text-xs text-gray-500 truncate">{c.lastMessage?.message}</p>
                </div>
              </div>
            ))
          )}
          {mode === 'groups' && (groups.length === 0
            ? <div className="text-center py-10 text-gray-500 text-sm">No groups yet. Create one!</div>
            : groups.map(g => (
              <div key={g._id} onClick={() => { setSelectedGroup(g); setSelectedDM(null); setShowGroupInfo(false); }} className={`flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-surface ${selectedGroup?._id === g._id ? 'bg-surface border-l-2 border-primary' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0"><Users size={18} className="text-accent"/></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{g.name}</p>
                  <p className="text-xs text-gray-500">{g.members?.length || 0} members</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className="flex-1 flex flex-col card p-0 overflow-hidden">
        {currentSelected ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-dark-border">
              {mode === 'dm' ? (
                <>
                  <button onClick={() => navigate(`/profile/${selectedDM._id}`)} className="hover:opacity-80 transition-opacity"><Avatar u={selectedDM} size={10}/></button>
                  <div className="flex-1">
                    <button onClick={() => navigate(`/profile/${selectedDM._id}`)} className="font-semibold text-white hover:text-primary">{selectedDM.username}</button>
                    {typing && <p className="text-xs text-primary animate-pulse">typing...</p>}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0"><Users size={18} className="text-accent"/></div>
                  <div className="flex-1">
                    <button onClick={() => setShowGroupInfo(!showGroupInfo)} className="font-semibold text-white hover:text-primary transition-colors">
                      {selectedGroup.name}
                    </button>
                    <p className="text-xs text-gray-500">{selectedGroup.members?.length || 0} members — click name to see info</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Messages pane */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {currentMessages.map((m, i) => {
                    const senderId = m.sender?._id || m.sender;
                    const isMe = senderId === user._id || senderId?.toString() === user._id;
                    return (
                      <MessageBubble key={i} m={m} isMe={isMe} mode={mode} navigate={navigate}
                        onReply={r => { if (mode === 'dm') setDmReplyTo(r); else setGroupReplyTo(r); }}
                      />
                    );
                  })}
                  <div ref={endRef}/>
                </div>

                <ReplyPreview replyTo={mode === 'dm' ? dmReplyTo : groupReplyTo} onCancel={() => mode === 'dm' ? setDmReplyTo(null) : setGroupReplyTo(null)}/>
                <form onSubmit={mode === 'dm' ? sendDM : sendGroupMsg} className="p-4 border-t border-dark-border flex gap-3">
                  <input
                    value={mode === 'dm' ? dmMsg : groupMsg}
                    onChange={e => {
                      if (mode === 'dm') { setDmMsg(e.target.value); if (socket && selectedDM) socket.emit('typing', { senderId: user._id, receiverId: selectedDM._id }); }
                      else setGroupMsg(e.target.value);
                    }}
                    onBlur={() => { if (mode === 'dm' && socket && selectedDM) socket.emit('stop_typing', { senderId: user._id, receiverId: selectedDM._id }); }}
                    placeholder={mode === 'dm' ? 'Type a message...' : `Message ${selectedGroup?.name}...`}
                    className="input flex-1 py-2.5"
                  />
                  <button type="submit" className="btn-primary px-4"><Send size={18}/></button>
                </form>
              </div>

              {/* Group Info Panel */}
              {mode === 'groups' && showGroupInfo && selectedGroup && (
                <div className="w-64 border-l border-dark-border flex flex-col overflow-y-auto">
                  <div className="p-4 border-b border-dark-border">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-white text-sm">Group Info</h3>
                      <button onClick={() => setShowGroupInfo(false)} className="text-gray-500 hover:text-white"><X size={16}/></button>
                    </div>
                    {/* Group name edit */}
                    {isGroupAdmin && editingGroupName ? (
                      <div className="flex gap-2">
                        <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="input flex-1 py-1 text-sm" placeholder="Group name"/>
                        <button onClick={saveGroupName} className="text-green-400 hover:text-green-300"><Check size={16}/></button>
                        <button onClick={() => setEditingGroupName(false)} className="text-gray-500 hover:text-white"><X size={16}/></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold flex-1">{selectedGroup.name}</p>
                        {isGroupAdmin && (
                          <button onClick={() => { setNewGroupName(selectedGroup.name); setEditingGroupName(true); }} className="text-gray-500 hover:text-primary"><Edit3 size={14}/></button>
                        )}
                      </div>
                    )}
                    {!isGroupAdmin && (
                      <button onClick={leaveGroup} className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-red-400 hover:text-white hover:bg-red-500 border border-red-500/30 py-1.5 rounded-xl transition-all">
                        <LogOut size={14}/> Leave Group
                      </button>
                    )}
                  </div>
                  {/* Members list */}
                  <div className="p-3 flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500 font-semibold uppercase">Members ({selectedGroup.members?.length || 0})</p>
                      {isGroupAdmin && (
                        <button onClick={() => setShowAddMember(true)} className="text-xs text-primary hover:text-white bg-primary/10 hover:bg-primary px-2 py-1 rounded-lg transition-all flex items-center gap-1">
                          <Plus size={12}/> Add
                        </button>
                      )}
                    </div>
                    
                    {showAddMember && (
                      <div className="mb-3 bg-dark p-2 rounded-xl border border-dark-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400">Add Member</span>
                          <button onClick={() => { setShowAddMember(false); setAddMemberSearch(''); setAddMemberResults([]); }} className="text-gray-500 hover:text-white"><X size={12}/></button>
                        </div>
                        <div className="relative mb-2">
                          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"/>
                          <input placeholder="Search users..." className="input pl-7 py-1 text-xs" value={addMemberSearch} onChange={e => searchAddMembers(e.target.value)}/>
                        </div>
                        {addMemberResults.length > 0 && (
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {addMemberResults.map(u => (
                              <div key={u._id} onClick={() => addMemberToGroup(u._id)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface cursor-pointer">
                                <Avatar u={u} size={6}/><span className="text-xs text-white flex-1 truncate">{u.username}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      {(selectedGroup.members || []).map((m, i) => {
                        const mid = m?._id || m;
                        const mname = m?.username || 'Unknown';
                        const isCreator = (selectedGroup.creator?._id || selectedGroup.creator) === mid;
                        return (
                          <div key={mid || i} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface">
                            <Avatar u={m} size={8} clickable/>
                            <div className="flex-1 min-w-0">
                              <button onClick={() => mid && navigate(`/profile/${mid}`)} className="text-sm text-white hover:text-primary truncate block">{mname}</button>
                              {isCreator && <span className="text-xs text-accent">Admin</span>}
                            </div>
                            {isGroupAdmin && !isCreator && (
                              <button onClick={() => removeMemberFromGroup(mid)} title="Remove" className="text-gray-600 hover:text-red-400 transition-colors"><UserMinus size={14}/></button>
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
          <div className="flex-1 flex items-center justify-center text-center text-gray-500">
            <div>
              <p className="text-5xl mb-3">💬</p>
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">or search for a user to start chatting</p>
              <button onClick={() => setShowCreateGroup(true)} className="mt-4 flex items-center gap-2 mx-auto text-sm text-primary hover:text-white bg-primary/10 hover:bg-primary px-4 py-2 rounded-xl transition-all">
                <Plus size={16}/> Create a Group
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create Group Modal ── */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1a1b1e] border border-dark-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Users size={18} className="text-primary"/> Create Group</h3>
              <button onClick={() => setShowCreateGroup(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
            </div>
            <form onSubmit={createGroup} className="space-y-4">
              <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name" className="input" required/>
              <div>
                <p className="text-sm text-gray-400 mb-2">Add members:</p>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                  <input placeholder="Search users..." className="input pl-9 py-2 text-sm" value={memberSearch} onChange={e => searchMembers(e.target.value)}/>
                </div>
                {memberSearchResults.length > 0 && (
                  <div className="space-y-1 max-h-36 overflow-y-auto border border-dark-border rounded-xl p-2">
                    {memberSearchResults.map(u => (
                      <div key={u._id} onClick={() => toggleGroupMember(u._id)} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${groupMemberIds.includes(u._id) ? 'bg-primary/20 text-primary' : 'hover:bg-surface text-white'}`}>
                        <Avatar u={u} size={7}/><span className="text-sm flex-1">{u.username}</span>
                        {groupMemberIds.includes(u._id) && <Check size={14}/>}
                      </div>
                    ))}
                  </div>
                )}
                {groupMemberIds.length > 0 && <p className="text-xs text-primary mt-1">{groupMemberIds.length} member(s) selected</p>}
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Create Group</button>
                <button type="button" onClick={() => setShowCreateGroup(false)} className="px-4 py-2 rounded-xl text-gray-400 hover:text-white">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
