import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Camera, Edit3, Save, UserPlus, UserCheck, BadgeCheck, MessageCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import ImageViewerModal from '../components/ImageViewerModal';
import ReportButton from '../components/ReportButton';

const API_BASE = 'http://localhost:5000';

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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error('Could not access camera');
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
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
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
        toast.error('Failed to load profile');
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
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update');
    }
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
      toast.success('Profile photo updated!');
    } catch {
      toast.error('Failed to update photo');
    }
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
    } catch {
      toast.error('Failed to update follow status');
    }
  };

  const submitVerification = async (e) => {
    e.preventDefault();
    if (!verificationFiles.passportPhoto) {
      toast.error('Passport photo from camera is required');
      return;
    }
    const formData = new FormData();
    formData.append('aadhaarImage', verificationFiles.aadhaarImage);
    formData.append('passportPhoto', verificationFiles.passportPhoto);
    formData.append('certificateImage', verificationFiles.certificateImage);
    try {
      const { data } = await api.post('/verification', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setVerificationStatus(data);
      toast.success('Verification request submitted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit verification');
    }
  };

  if (!profile) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const imgSrc = profile.profileImage ? (profile.profileImage.startsWith('http') ? profile.profileImage : `${API_BASE}${profile.profileImage}`) : null;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="h-48 rounded-2xl bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 mb-[-60px] relative" />

      <div className="relative z-10 px-6">
        <div className="flex items-end gap-5 mb-6">
          <div className="relative group">
            {imgSrc ? (
              <img src={imgSrc} className="w-28 h-28 avatar border-4 border-dark object-cover" alt="" />
            ) : (
              <div className="w-28 h-28 avatar bg-primary/30 border-4 border-dark flex items-center justify-center text-3xl font-bold text-primary">
                {profile.username?.[0]?.toUpperCase()}
              </div>
            )}
            {isOwnProfile && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Camera size={24} className="text-white" />
                <input type="file" accept="image/*" onChange={handleProfileImage} className="hidden" />
              </label>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              {profile.username}
              {profile.isVerified && <BadgeCheck size={20} className="text-blue-500" />}
            </h1>
            {profile.email && <p className="text-gray-400 text-sm">{profile.email}</p>}
          </div>

          {isOwnProfile ? (
            <button onClick={() => editing ? handleSave() : setEditing(true)} className="btn-primary flex items-center gap-2">
              {editing ? <><Save size={16} /> Save</> : <><Edit3 size={16} /> Edit</>}
            </button>
          ) : (
            <div className="flex flex-col gap-2 items-end">
              <button onClick={handleFollow} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isFollowing ? 'bg-dark-card border border-dark-border text-white hover:border-red-500/50' : 'bg-primary text-white hover:bg-primary-hover'}`}>
                {isFollowing ? <><UserCheck size={16} /> Following</> : <><UserPlus size={16} /> Follow</>}
              </button>
              {isFollowing && (
                <button
                  onClick={() => navigate('/chat', { state: { openDM: profile } })}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-accent/20 text-accent hover:bg-accent hover:text-white transition-all"
                >
                  <MessageCircle size={16} /> Message
                </button>
              )}
            </div>
          )}
        </div>

        {!isOwnProfile && <div className="mb-4"><ReportButton targetType="user" targetId={profile._id} compact /></div>}

        {editing && isOwnProfile ? (
          <div className="card space-y-4 mb-6">
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="input" placeholder="Username" />
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="input h-20 resize-none" placeholder="Bio" />
            <input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} className="input" placeholder="Skills (comma separated)" />
          </div>
        ) : (
          <div className="mb-6">
            {profile.bio && <p className="text-gray-300 mb-3">{profile.bio}</p>}
            {profile.skills?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.skills.map((s, i) => <span key={i} className="badge bg-primary/20 text-primary">{s}</span>)}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-8 mb-8">
          <div className="text-center"><p className="text-2xl font-bold text-white">{artworks.length}</p><p className="text-sm text-gray-500">Artworks</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-white">{profile.followers?.length || 0}</p><p className="text-sm text-gray-500">Followers</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-white">{profile.following?.length || 0}</p><p className="text-sm text-gray-500">Following</p></div>
        </div>

        <div className="flex gap-1 mb-6 border-b border-dark-border">
          {['artworks', 'about'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${tab === t ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'artworks' && (
          artworks.length === 0 ? (
            <div className="text-center py-16 card"><p className="text-gray-400">No artworks yet.</p></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {artworks.map(a => (
                <div key={a._id} className="aspect-square rounded-xl overflow-hidden group cursor-pointer relative" onClick={() => setSelectedArtwork(a)}>
                  <img src={a.imageUrl?.startsWith('http') ? a.imageUrl : `${API_BASE}${a.imageUrl}`} alt={a.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <p className="text-white font-semibold text-sm truncate">{a.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'about' && (
          <div className="card space-y-4">
            {profile.email && <div><p className="text-sm text-gray-500 mb-1">Email</p><p className="text-white">{profile.email}</p></div>}
            <div><p className="text-sm text-gray-500 mb-1">Member since</p><p className="text-white">{new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p></div>
            {profile.artInterests?.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Art Interests</p>
                <div className="flex flex-wrap gap-2">{profile.artInterests.map((i, idx) => <span key={idx} className="badge bg-accent/20 text-accent">{i}</span>)}</div>
              </div>
            )}
            {isOwnProfile && !profile.isVerified && (
              <div className="border-t border-dark-border pt-4">
                <p className="text-sm font-semibold text-white mb-2">Get Verified</p>
                <p className="text-sm text-gray-400 mb-3">
                  Verification proves this is a real account or a popular person people can trust. Verified creators should upload beginner tutorial videos so people can learn, believe in their profile, connect, and contact them.
                </p>
                {verificationStatus ? (
                  <p className="text-sm text-gray-400">Status: <span className="capitalize">{verificationStatus.status}</span>. You can submit verification only one time.</p>
                ) : (
                  <form onSubmit={submitVerification} className="space-y-3">
                    <label className="block">
                      <span className="text-xs text-gray-500 block mb-1">Aadhaar card</span>
                      <input type="file" accept="image/*" className="input" onChange={(e) => setVerificationFiles({ ...verificationFiles, aadhaarImage: e.target.files[0] })} required />
                    </label>
                    <div className="block">
                      <span className="text-xs text-gray-500 block mb-1">Passport photo from camera (No upload allowed)</span>
                      {!verificationFiles.passportPhoto && !showCamera && (
                        <button type="button" onClick={startCamera} className="btn-primary w-full flex items-center justify-center gap-2">
                          <Camera size={16} /> Open Camera
                        </button>
                      )}
                      
                      {showCamera && (
                        <div className="space-y-2 border border-dark-border p-2 rounded-xl bg-dark-card">
                          <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-lg bg-black" />
                          <canvas ref={canvasRef} className="hidden" />
                          <div className="flex gap-2">
                            <button type="button" onClick={takePhoto} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-semibold transition-colors">Take Photo</button>
                            <button type="button" onClick={stopCamera} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-sm font-semibold transition-colors">Cancel</button>
                          </div>
                        </div>
                      )}

                      {verificationFiles.passportPhoto && !showCamera && (
                        <div className="flex items-center justify-between bg-dark-card border border-dark-border p-3 rounded-xl">
                          <span className="text-sm text-green-400 font-medium">✓ Photo captured</span>
                          <button type="button" onClick={() => { setVerificationFiles({ ...verificationFiles, passportPhoto: null }); startCamera(); }} className="text-xs text-primary hover:underline">Retake</button>
                        </div>
                      )}
                    </div>
                    <label className="block">
                      <span className="text-xs text-gray-500 block mb-1">Certificate</span>
                      <input type="file" accept="image/*" className="input" onChange={(e) => setVerificationFiles({ ...verificationFiles, certificateImage: e.target.files[0] })} required />
                    </label>
                    <button type="submit" className="btn-primary">Submit Verification</button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <ImageViewerModal isOpen={!!selectedArtwork} onClose={() => setSelectedArtwork(null)} artwork={selectedArtwork} reportTargetType="artwork" />
    </div>
  );
}
