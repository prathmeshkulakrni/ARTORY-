import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, Inbox, MessageCircle, Send } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ApplicationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ sent: [], received: [] });
  const [chats, setChats] = useState([]);
  const [tab, setTab] = useState('received');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/marketplace/applications'),
      api.get('/marketplace/chats'),
    ]).then(([apps, chatRes]) => {
      setData(apps.data);
      setChats(chatRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getId = (value) => (value?._id || value || '').toString();
  const findChatFor = (application) => chats.find(item => getId(item.application) === getId(application._id));

  const openChatFor = (application) => {
    const chatId = application.chatId || findChatFor(application)?._id;
    if (chatId) navigate(`/marketplace/chat/${chatId}`);
  };

  const received = data.received || [];
  const sent = data.sent || [];
  const active = tab === 'received' ? received : sent;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Marketplace Applications</h1>
        <p className="text-gray-400 mt-1">Review artists applying to your requests and track proposals you sent.</p>
      </div>

      <div className="flex border-b border-dark-border">
        <button onClick={() => setTab('received')} className={`px-5 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 -mb-px ${tab === 'received' ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-white'}`}>
          <Inbox size={16} /> Received ({received.length})
        </button>
        <button onClick={() => setTab('sent')} className={`px-5 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 -mb-px ${tab === 'sent' ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-white'}`}>
          <Send size={16} /> Sent ({sent.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : active.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-white font-semibold">No applications here yet</p>
          <Link to="/marketplace" className="text-primary text-sm inline-block mt-2">Browse marketplace requests</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {active.map(app => {
            const isSent = tab === 'sent';
            const canChat = Boolean(app.chatId || findChatFor(app));
            return (
              <div key={app._id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/marketplace/requests/${app.request?._id}`} className="text-lg font-bold text-white hover:text-primary line-clamp-1">
                      {app.request?.title || 'Deleted request'}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">
                      {isSent ? 'Your proposal' : `Artist: ${app.artist?.username || 'Unknown'}`}
                    </p>
                  </div>
                  <span className={`badge ${app.status === 'Accepted' ? 'bg-green-500/10 text-green-300' : app.status === 'Closed' ? 'bg-red-500/10 text-red-300' : 'bg-amber-500/10 text-amber-300'}`}>{app.status}</span>
                </div>
                <p className="text-sm text-gray-300 mt-4 whitespace-pre-line line-clamp-4">{app.message}</p>
                {app.portfolioLinks?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {app.portfolioLinks.map(link => (
                      <a key={link} href={link} target="_blank" rel="noreferrer" className="badge bg-primary/10 text-primary inline-flex items-center gap-1">
                        Portfolio <ExternalLink size={12} />
                      </a>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-dark-border">
                  <Link to={`/marketplace/requests/${app.request?._id}`} className="btn-outline py-2 px-4 text-sm">Open Request</Link>
                  {canChat && (
                    <button onClick={() => openChatFor(app)} className="btn-primary py-2 px-4 text-sm inline-flex items-center gap-2">
                      <MessageCircle size={15} /> Chat
                    </button>
                  )}
                  {!isSent && app.status === 'Open' && app.request?.creator === user?._id && (
                    <Link to={`/marketplace/requests/${app.request?._id}`} className="btn-primary py-2 px-4 text-sm">Review Application</Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
