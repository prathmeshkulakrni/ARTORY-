import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, ExternalLink, FileImage, IndianRupee, MessageCircle, Send, Star, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

function fileUrl(path) {
  return path?.startsWith('http') ? path : `${API_BASE}${path}`;
}

export default function RequestDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState('');
  const [sampleFiles, setSampleFiles] = useState([]);
  const [review, setReview] = useState({ rating: 5, review: '' });

  const loadRequest = () => {
    setLoading(true);
    api.get(`/marketplace/requests/${id}`)
      .then(res => setRequest(res.data))
      .catch(() => toast.error('Request not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRequest(); }, [id]);

  const isCreator = request?.creator?._id === user?._id;
  const canApply = request?.status === 'Open' && !isCreator && !request?.myApplication;
  const acceptedApp = request?.applications?.find(app => app.status === 'Accepted');
  const hasReview = request?.reviews?.some(r => r.reviewer?._id === user?._id);

  const apply = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('message', proposal);
    data.append('portfolioLinks', portfolioLinks);
    sampleFiles.forEach(file => data.append('sampleFiles', file));
    try {
      const res = await api.post(`/marketplace/requests/${id}/apply`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Application sent');
      setProposal('');
      setPortfolioLinks('');
      setSampleFiles([]);
      if (res.data?.chatId) {
        navigate(`/marketplace/chat/${res.data.chatId}`);
      } else {
        loadRequest();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    }
  };

  const accept = async (applicationId) => {
    try {
      const res = await api.post(`/marketplace/applications/${applicationId}/accept`);
      toast.success('Artist accepted');
      navigate(`/marketplace/chat/${res.data.chat._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept artist');
    }
  };

  const complete = async () => {
    try {
      await api.post(`/marketplace/requests/${id}/complete`);
      toast.success('Project marked completed');
      loadRequest();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete request');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/marketplace/requests/${id}/reviews`, review);
      toast.success('Feedback posted');
      setReview({ rating: 5, review: '' });
      loadRequest();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post feedback');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!request) return null;

  return (
    <div className="grid xl:grid-cols-[1fr_380px] gap-6 animate-fade-in">
      <div className="space-y-5">
        <div className="card p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="badge bg-primary/10 text-primary border border-primary/20">{request.category}</span>
            <span className={`badge ${request.status === 'Open' ? 'bg-green-500/10 text-green-300' : request.status === 'Done' ? 'bg-blue-500/10 text-blue-300' : 'bg-amber-500/10 text-amber-300'}`}>{request.status}</span>
          </div>
          <h1 className="text-3xl font-black text-white">{request.title}</h1>
          <p className="text-gray-300 mt-4 leading-relaxed whitespace-pre-line">{request.description}</p>
          <div className="flex flex-wrap gap-4 mt-6 text-sm text-gray-300">
            <span className="flex items-center gap-1.5"><IndianRupee size={16} /> {request.budget.min.toLocaleString()} - {request.budget.max.toLocaleString()} INR</span>
            <span className="flex items-center gap-1.5"><CalendarDays size={16} /> {new Date(request.deadline).toLocaleDateString()}</span>
            <span className="flex items-center gap-1.5"><FileImage size={16} /> {request.referenceImages?.length || 0} references</span>
          </div>
        </div>

        {request.referenceImages?.length > 0 && (
          <div className="card p-5">
            <h2 className="font-bold text-white mb-4">Reference Images</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {request.referenceImages.map(image => (
                <a key={image} href={fileUrl(image)} target="_blank" rel="noreferrer" className="aspect-video rounded-2xl overflow-hidden bg-dark block">
                  <img src={fileUrl(image)} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                </a>
              ))}
            </div>
          </div>
        )}

        {isCreator && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white">Applications</h2>
              <span className="badge bg-surface text-gray-300">{request.applications?.length || 0}</span>
            </div>
            {request.applications?.length === 0 ? (
              <p className="text-sm text-gray-500">No artists have applied yet.</p>
            ) : (
              <div className="space-y-3">
                {request.applications.map(app => (
                  <div key={app._id} className="border border-dark-border rounded-2xl p-4 bg-dark/40">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/profile/${app.artist?._id}`} className="font-semibold text-white hover:text-primary">{app.artist?.username}</Link>
                        <p className="text-sm text-gray-400 mt-1 whitespace-pre-line">{app.message}</p>
                        {app.artist?.skills?.length > 0 && <p className="text-xs text-gray-500 mt-2">{app.artist.skills.join(', ')}</p>}
                      </div>
                      <span className="badge bg-surface text-gray-300">{app.status}</span>
                    </div>
                    {app.portfolioLinks?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {app.portfolioLinks.map(link => (
                          <a key={link} href={link} target="_blank" rel="noreferrer" className="badge bg-primary/10 text-primary inline-flex items-center gap-1">
                            Portfolio <ExternalLink size={12} />
                          </a>
                        ))}
                      </div>
                    )}
                    {app.sampleFiles?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {app.sampleFiles.map(file => <a key={file} href={fileUrl(file)} target="_blank" rel="noreferrer" className="badge bg-surface text-gray-300">Sample</a>)}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 mt-4">
                      {app.chatId && (
                        <Link to={`/marketplace/chat/${app.chatId}`} className="btn-outline py-2 px-4 text-sm inline-flex items-center gap-2">
                          <MessageCircle size={15} /> Chat
                        </Link>
                      )}
                      {request.status === 'Open' && app.status === 'Open' && (
                        <button onClick={() => accept(app._id)} className="btn-primary py-2 px-4 text-sm inline-flex items-center gap-2">
                          <UserCheck size={16} /> Accept Artist
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {request.status === 'Done' && (
          <div className="card p-5">
            <h2 className="font-bold text-white mb-4">Feedback</h2>
            {request.reviews?.length === 0 ? <p className="text-sm text-gray-500">No feedback yet.</p> : (
              <div className="space-y-3">
                {request.reviews.map(item => (
                  <div key={item._id} className="border border-dark-border rounded-2xl p-4 bg-dark/40">
                    <div className="flex gap-1 text-amber-300 mb-2">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={15} fill={i < item.rating ? 'currentColor' : 'none'} />)}</div>
                    <p className="text-sm text-gray-300">{item.review}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="space-y-5">
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-2">Requester</p>
          <Link to={`/profile/${request.creator?._id}`} className="font-semibold text-white hover:text-primary">{request.creator?.username}</Link>
          <p className="text-sm text-gray-500 mt-1">{request.applicationCount} application{request.applicationCount === 1 ? '' : 's'}</p>
        </div>

        {request.acceptedArtist && (
          <div className="card p-5">
            <p className="text-sm text-gray-500 mb-2">Accepted Artist</p>
            <Link to={`/profile/${request.acceptedArtist?._id}`} className="font-semibold text-white hover:text-primary">{request.acceptedArtist?.username}</Link>
            {acceptedApp && <p className="text-xs text-gray-500 mt-2">Application accepted</p>}
          </div>
        )}

        {request.myApplication && (
          <div className="card p-5 border-primary/30">
            <p className="font-semibold text-white">Your application is {request.myApplication.status}</p>
            <p className="text-sm text-gray-500 mt-1">You can chat with the requester about this application.</p>
            {request.myApplication.chatId && (
              <Link to={`/marketplace/chat/${request.myApplication.chatId}`} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
                <MessageCircle size={16} /> Open Chat
              </Link>
            )}
          </div>
        )}

        {canApply && (
          <form onSubmit={apply} className="card p-5 space-y-4">
            <h2 className="font-bold text-white">Apply to Work</h2>
            <textarea required value={proposal} onChange={e => setProposal(e.target.value)} className="input min-h-32 resize-y" placeholder="Write your proposal, timeline, style approach, and deliverables..." />
            <textarea value={portfolioLinks} onChange={e => setPortfolioLinks(e.target.value)} className="input min-h-20 resize-y" placeholder="Portfolio links, one per line or comma separated" />
            <label className="block">
              <span className="text-sm text-gray-500 block mb-2">Sample work</span>
              <input type="file" multiple className="input" onChange={e => setSampleFiles(Array.from(e.target.files || []))} />
            </label>
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2"><Send size={16} /> Send Application</button>
          </form>
        )}

        {isCreator && request.status === 'Pending' && (
          <button onClick={complete} className="btn-primary w-full flex items-center justify-center gap-2">
            <CheckCircle2 size={17} /> Mark Completed
          </button>
        )}

        {isCreator && request.status === 'Done' && !hasReview && (
          <form onSubmit={submitReview} className="card p-5 space-y-4">
            <h2 className="font-bold text-white">Rate Artist</h2>
            <select className="input" value={review.rating} onChange={e => setReview({ ...review, rating: Number(e.target.value) })}>
              {[5, 4, 3, 2, 1].map(rating => <option key={rating} value={rating}>{rating} stars</option>)}
            </select>
            <textarea required className="input min-h-24 resize-y" value={review.review} onChange={e => setReview({ ...review, review: e.target.value })} placeholder="Write public feedback..." />
            <button className="btn-primary w-full">Post Feedback</button>
          </form>
        )}

        <Link to="/marketplace/applications" className="btn-outline w-full flex items-center justify-center gap-2">
          <MessageCircle size={16} /> View Applications
        </Link>
      </aside>
    </div>
  );
}
