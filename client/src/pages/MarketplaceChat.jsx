import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileUp, Image, Paperclip, Send, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

function fileUrl(path) {
  return path?.startsWith('http') ? path : `${API_BASE}${path}`;
}

function Attachment({ file }) {
  const isImage = file.mimeType?.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(file.url);
  return (
    <a href={fileUrl(file.url)} target="_blank" rel="noreferrer" className="block mt-2 rounded-xl overflow-hidden border border-dark-border bg-dark/60">
      {isImage ? (
        <img src={fileUrl(file.url)} alt={file.originalName || 'attachment'} className="max-h-56 w-full object-cover" />
      ) : (
        <span className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300"><Paperclip size={14} /> {file.originalName || 'Attachment'}</span>
      )}
    </a>
  );
}

export default function MarketplaceChat() {
  const { id } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const endRef = useRef(null);
  const [chat, setChat] = useState(null);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [finalFiles, setFinalFiles] = useState([]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    api.get(`/marketplace/chats/${id}`).then(res => setChat(res.data)).catch(() => toast.error('Chat not found'));
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;
    const appendMessage = (incoming) => {
      setChat(prev => {
        if (!prev) return prev;
        const exists = (prev.messages || []).some(item => item._id && incoming._id && item._id === incoming._id);
        return exists ? prev : { ...prev, messages: [...(prev.messages || []), incoming] };
      });
    };
    socket.emit('join_marketplace_chat', id);
    socket.on('marketplace_message', appendMessage);
    socket.on('marketplace_user_typing', () => setTyping(true));
    socket.on('marketplace_user_stop_typing', () => setTyping(false));
    return () => {
      socket.emit('leave_marketplace_chat', id);
      socket.off('marketplace_message');
      socket.off('marketplace_user_typing');
      socket.off('marketplace_user_stop_typing');
    };
  }, [socket, id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat?.messages?.length]);

  const otherUser = chat?.requester?._id === user?._id ? chat?.artist : chat?.requester;
  const isArtist = chat?.artist?._id === user?._id;

  const appendLocalMessage = (incoming) => {
    setChat(prev => {
      if (!prev) return prev;
      const exists = (prev.messages || []).some(item => item._id && incoming._id && item._id === incoming._id);
      return exists ? prev : { ...prev, messages: [...(prev.messages || []), incoming] };
    });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && files.length === 0) return;
    const data = new FormData();
    data.append('message', message);
    files.forEach(file => data.append('attachments', file));
    try {
      const res = await api.post(`/marketplace/chats/${id}/messages`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      appendLocalMessage(res.data);
      setMessage('');
      setFiles([]);
      if (socket) socket.emit('marketplace_stop_typing', { chatId: id, userId: user._id });
    } catch {
      toast.error('Failed to send message');
    }
  };

  const submitFinal = async (e) => {
    e.preventDefault();
    if (finalFiles.length === 0) return toast.error('Upload final artwork first');
    const data = new FormData();
    data.append('message', 'Final artwork submitted for review.');
    finalFiles.forEach(file => data.append('attachments', file));
    try {
      const res = await api.post(`/marketplace/chats/${id}/submit`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      appendLocalMessage(res.data);
      setFinalFiles([]);
      toast.success('Final artwork submitted');
    } catch {
      toast.error('Failed to submit artwork');
    }
  };

  if (!chat) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="grid xl:grid-cols-[1fr_320px] gap-5 h-[calc(100vh-7rem)] animate-fade-in">
      <section className="card p-0 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-dark-border flex items-center justify-between gap-3">
          <div>
            <Link to={`/marketplace/requests/${chat.request?._id}`} className="font-bold text-white hover:text-primary">{chat.request?.title}</Link>
            <p className="text-sm text-gray-500">Chat with {otherUser?.username}</p>
          </div>
          <span className="badge bg-surface text-gray-300">{chat.request?.status}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {(chat.messages || []).map(item => {
            const senderId = item.sender?._id || item.sender;
            const isMe = senderId === user._id;
            return (
              <div key={item._id || item.createdAt} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] rounded-2xl px-4 py-3 ${isMe ? 'bg-primary text-white rounded-br-md' : 'bg-surface text-gray-200 rounded-bl-md'} ${item.kind === 'final_submission' ? 'ring-1 ring-amber-300/40' : ''}`}>
                  {item.kind === 'final_submission' && <p className="text-xs font-semibold text-amber-200 flex items-center gap-1 mb-1"><Star size={13} /> Final submission</p>}
                  {item.message && <p className="text-sm whitespace-pre-line">{item.message}</p>}
                  {item.attachments?.map(file => <Attachment key={file.url} file={file} />)}
                  <p className={`text-[10px] mt-2 ${isMe ? 'text-white/60' : 'text-gray-500'}`}>{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
          {typing && <p className="text-xs text-primary">typing...</p>}
          <div ref={endRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-dark-border space-y-2">
          {files.length > 0 && <p className="text-xs text-gray-500">{files.length} attachment{files.length === 1 ? '' : 's'} selected</p>}
          <div className="flex gap-3">
            <label className="btn-outline px-3 flex items-center cursor-pointer" title="Attach files">
              <Paperclip size={18} />
              <input type="file" multiple className="hidden" onChange={e => setFiles(Array.from(e.target.files || []))} />
            </label>
            <input
              className="input flex-1"
              value={message}
              onChange={e => {
                setMessage(e.target.value);
                if (socket) socket.emit('marketplace_typing', { chatId: id, userId: user._id });
              }}
              onBlur={() => socket?.emit('marketplace_stop_typing', { chatId: id, userId: user._id })}
              placeholder="Type a project message..."
            />
            <button className="btn-primary px-4"><Send size={18} /></button>
          </div>
        </form>
      </section>

      <aside className="space-y-5 overflow-y-auto">
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-2">Project</p>
          <Link to={`/marketplace/requests/${chat.request?._id}`} className="font-semibold text-white hover:text-primary">{chat.request?.title}</Link>
          <p className="text-sm text-gray-500 mt-2">Requester: {chat.requester?.username}</p>
          <p className="text-sm text-gray-500">Artist: {chat.artist?.username}</p>
        </div>

        {isArtist && chat.request?.status === 'Pending' && (
          <form onSubmit={submitFinal} className="card p-5 space-y-4">
            <h2 className="font-bold text-white">Submit Final Artwork</h2>
            <label className="border border-dashed border-dark-border rounded-2xl p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/60 bg-dark/40">
              <Image size={24} className="text-primary" />
              <span className="text-sm text-gray-300">Upload final files</span>
              <input type="file" multiple className="hidden" onChange={e => setFinalFiles(Array.from(e.target.files || []))} />
            </label>
            {finalFiles.length > 0 && <p className="text-xs text-gray-500">{finalFiles.map(f => f.name).join(', ')}</p>}
            <button className="btn-primary w-full flex items-center justify-center gap-2"><FileUp size={16} /> Send for Review</button>
          </form>
        )}

        {chat.request?.status === 'Pending' && !isArtist && (
          <div className="card p-5">
            <h2 className="font-bold text-white mb-2">Review Work</h2>
            <p className="text-sm text-gray-500 mb-4">When the final submission is acceptable, mark the request completed from the request details page.</p>
            <Link to={`/marketplace/requests/${chat.request?._id}`} className="btn-primary block text-center">Open Request</Link>
          </div>
        )}
      </aside>
    </div>
  );
}
