import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Shield, Users, Image as ImageIcon, Layers, Trash2, FileWarning, BadgeCheck, Trophy, Check, Ban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000';

const statCards = [
  { key: 'totalUsers', label: 'Users', icon: Users },
  { key: 'totalArtworks', label: 'Artworks', icon: ImageIcon },
  { key: 'totalCommunities', label: 'Communities', icon: Layers }
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

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setDashboard(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load admin panel');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type, id) => {
    const label = type.slice(0, -1);
    if (!window.confirm(`Delete this ${label}? This action cannot be undone.`)) return;

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
      toast.success(`${label[0].toUpperCase()}${label.slice(1)} deleted`);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to delete ${label}`);
    }
  };

  const reviewReport = async (id) => {
    try {
      await api.put(`/admin/reports/${id}/review`);
      setDashboard((prev) => ({
        ...prev,
        reports: prev.reports.map((item) => item._id === id ? { ...item, status: 'reviewed' } : item)
      }));
      toast.success('Report marked reviewed');
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
      toast.success(`Verification ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update verification');
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
      toast.error(err.response?.data?.message || 'Failed to update competition');
    }
  };

  const fileSrc = (path) => path?.startsWith('http') ? path : `${API_BASE}${path}`;
  const openProfile = (userId) => {
    if (userId) navigate(`/profile/${userId}`);
  };

  const renderTargetSummary = (report) => {
    const target = report.target;
    if (!target) return <p className="text-sm text-red-300">Reported item not found. ID: {report.targetId}</p>;

    const owner = target.artist || target.creator || target.organizer;
    return (
      <div className="mt-2 space-y-1 text-sm text-gray-400">
        <p>Reported ID: <span className="text-gray-300">{report.targetId}</span></p>
        <p>Item: <span className="text-gray-300">{target.title || target.name || target.username || 'Untitled'}</span></p>
        {owner?.username && (
          <p>
            Owner: <button onClick={() => openProfile(owner._id)} className="text-primary hover:underline">{owner.username}</button>
          </p>
        )}
        {report.targetType === 'user' && (
          <p>User: <button onClick={() => openProfile(target._id)} className="text-primary hover:underline">{target.username}</button></p>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400">Platform overview and moderation tools.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {statCards.map(({ key, label, icon: Icon }) => (
          <div key={key} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-3xl font-bold text-white mt-2">{dashboard.stats[key] || 0}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b border-dark-border pb-px flex-wrap">
        {['users', 'communities', 'artworks', 'reports', 'verification', 'competitions'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-3 text-sm font-semibold capitalize transition-colors border-b-2 ${activeTab === tab ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="card space-y-4">
          {dashboard.users.map((item) => (
            <div key={item._id} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-dark">
              <div>
                <button onClick={() => openProfile(item._id)} className="font-semibold text-white hover:text-primary">{item.username}</button>
                <p className="text-sm text-gray-400">{item.email}</p>
                <p className="text-xs text-gray-500 mt-1">Role: {item.role}</p>
              </div>
              <button onClick={() => handleDelete('users', item._id)} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'communities' && (
        <div className="card space-y-4">
          {dashboard.communities.map((item) => (
            <div key={item._id} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-dark">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center">
                  {item.coverImage ? <img src={`${API_BASE}${item.coverImage}`} alt="" className="w-full h-full object-cover" /> : <Layers size={18} className="text-primary" />}
                </div>
                <div>
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-sm text-gray-400">{item.category}</p>
                </div>
              </div>
              <button onClick={() => handleDelete('communities', item._id)} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'artworks' && (
        <div className="card space-y-4">
          {dashboard.artworks.map((item) => (
            <div key={item._id} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-dark">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center">
                  {item.imageUrl ? <img src={item.imageUrl.startsWith('http') ? item.imageUrl : `${API_BASE}${item.imageUrl}`} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-primary" />}
                </div>
                <div>
                  <p className="font-semibold text-white">{item.title || 'Untitled'}</p>
                  <p className="text-sm text-gray-400">by {item.artist?._id ? <button onClick={() => openProfile(item.artist._id)} className="hover:text-primary">{item.artist.username}</button> : 'Unknown artist'}</p>
                </div>
              </div>
              <button onClick={() => handleDelete('artworks', item._id)} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="card space-y-4">
          {dashboard.reports.map((item) => (
            <div key={item._id} className="p-4 rounded-xl bg-dark flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <FileWarning size={18} className="text-red-400 mt-1" />
                <div>
                  <p className="font-semibold text-white">{item.targetType} report</p>
                  <p className="text-sm text-gray-400">Reporter: {item.reporter?._id ? <button onClick={() => openProfile(item.reporter._id)} className="text-primary hover:underline">{item.reporter.username}</button> : 'Unknown'}</p>
                  <p className="text-sm text-gray-400">Reason: {item.reason}</p>
                  {item.details && <p className="text-sm text-gray-400 mt-1">{item.details}</p>}
                  {renderTargetSummary(item)}
                  <p className="text-xs text-gray-500 mt-1">Status: {item.status}</p>
                </div>
              </div>
              {item.status !== 'reviewed' && <button onClick={() => reviewReport(item._id)} className="btn-primary">Mark Reviewed</button>}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'verification' && (
        <div className="card space-y-4">
          {dashboard.verificationRequests.map((item) => (
            <div key={item._id} className="p-4 rounded-xl bg-dark flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <BadgeCheck size={18} className="text-blue-500 mt-1" />
                <div>
                  <button onClick={() => openProfile(item.applicant?._id)} className="font-semibold text-white hover:text-primary">{item.applicant?.username}</button>
                  <p className="text-sm text-gray-400">{item.applicant?.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Status: {item.status}</p>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {[
                      ['Aadhaar', item.aadhaarImage],
                      ['Camera photo', item.passportPhoto],
                      ['Certificate', item.certificateImage || item.profilePhoto]
                    ].filter(([, path]) => path).map(([label, path]) => (
                      <a key={label} href={fileSrc(path)} target="_blank" rel="noreferrer" className="block">
                        <img src={fileSrc(path)} alt={label} className="w-24 h-16 rounded-lg object-cover border border-dark-border" />
                        <span className="text-xs text-gray-500">{label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              {item.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => reviewVerification(item._id, 'approved')} className="btn-primary bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white flex items-center gap-2"><Check size={16}/> Approve</button>
                  <button onClick={() => reviewVerification(item._id, 'rejected')} className="btn-outline border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-2"><Ban size={16}/> Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'competitions' && (
        <div className="card space-y-4">
          {dashboard.competitionRequests.map((item) => (
            <div key={item._id} className="p-4 rounded-xl bg-dark space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Trophy size={18} className="text-yellow-400 mt-1" />
                  <div className="space-y-2">
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="text-sm text-gray-400">{item.description}</p>
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-400">
                      <p>Organizer: {item.organizer?._id ? <button onClick={() => openProfile(item.organizer._id)} className="hover:text-primary">{item.organizer.username}</button> : 'Unknown'}</p>
                      <p>Category: {item.category || 'Open'}</p>
                      <p>Deadline: {item.deadline ? new Date(item.deadline).toLocaleDateString() : 'Not set'}</p>
                      <p>Prize: {item.prize || 'Not specified'}</p>
                    </div>
                    <p className="text-xs text-gray-500">Status: {item.status}</p>
                  </div>
                </div>
                {item.coverImage ? (
                  <img
                    src={`${API_BASE}${item.coverImage}`}
                    alt={item.title}
                    className="w-28 h-20 rounded-xl object-cover border border-dark-border"
                  />
                ) : null}
              </div>
              {item.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => reviewCompetition(item._id, 'approved')} className="btn-primary bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white flex items-center gap-2"><Check size={16}/> Approve</button>
                  <button onClick={() => reviewCompetition(item._id, 'rejected')} className="btn-outline border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-2"><Ban size={16}/> Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
