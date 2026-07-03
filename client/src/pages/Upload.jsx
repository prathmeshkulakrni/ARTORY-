import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { X, CloudUpload, ArrowLeft, ShieldAlert, Palette, Info, LayoutGrid, Tag, Globe, ArrowRight, Camera, Sparkles, Send } from 'lucide-react';

const categories = ['painting', 'digital', 'sketch', 'calligraphy', 'sculpture', 'photography', 'comic', 'other'];

export default function Upload() {
  const [form, setForm] = useState({ title: '', description: '', category: 'painting', tags: '', publishToCommunity: false, isAdultContent: false });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdultUser = Number(user?.age) >= 18 || user?.role === 'admin';

  const handleFile = (f) => {
    if (f) {
      if (!f.type.startsWith('image/')) {
        return toast.error('Art mismatch: Please upload an image asset');
      }
      setFile(f);
      setPreview(URL.createObjectURL(f));
      toast.success('Visual asset saved');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please choose an image');
    if (form.isAdultContent && !isAdultUser) return toast.error('Age verification is required for adult content');
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    try {
      await api.post('/artwork', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Post complete! 🎨');
      navigate('/feed');
    } catch (err) { toast.error(err.response?.data?.message || 'Message failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-32 px-6 lg:px-8 selection:bg-primary selection:text-white">
      {/* UI Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16 bg-dark-card border border-white/5 p-12 rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-40" />
        
        <div className="flex items-center gap-8 relative z-10">
          <button onClick={() => navigate(-1)} className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 hover:text-primary transition-all hover:border-primary/40 group/back">
            <ArrowLeft size={24} className="group-hover/back:-translate-x-1 transition-transform" />
          </button>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
               <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">Post Station</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none">
              Publish <span className="text-primary italic">Art</span>
            </h1>
            <p className="text-gray-500 font-medium text-lg">Upload your latest artwork to Artory.</p>
          </div>
        </div>

        <div className="flex items-center gap-6 relative z-10">
           <div className="bg-primary/10 border border-primary/20 px-8 py-4 rounded-2xl flex items-center gap-4">
              <Sparkles size={24} className="text-primary animate-pulse" />
              <div className="text-left">
                 <p className="text-[9px] font-black text-primary uppercase tracking-widest">Creator Tier</p>
                 <p className="text-sm font-black text-white uppercase tracking-tighter">Artist</p>
              </div>
           </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Side: Art Drop Zone */}
        <div className="space-y-10">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`relative rounded-[3.5rem] border-2 border-dashed transition-all duration-700 min-h-[560px] flex items-center justify-center overflow-hidden shadow-2xl group/drop ${dragging ? 'border-primary bg-primary/10 scale-[0.98]' : 'border-white/10 bg-surface/20 hover:border-primary/40'}`}
          >
            {preview ? (
              <div className="relative w-full h-full p-8 flex items-center justify-center group/preview">
                <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-0 group-hover/preview:opacity-40 transition-opacity duration-1000" />
                <img src={preview} alt="Preview" className="max-w-full max-h-[480px] object-contain rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] border-2 border-white/10 transition-all duration-700 group-hover/preview:scale-[1.02] relative z-10" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-6 z-20 backdrop-blur-sm">
                  <button type="button" onClick={() => { setFile(null); setPreview(null); }} className="w-20 h-20 bg-red-500 text-white rounded-[1.75rem] flex items-center justify-center hover:bg-red-600 transition-all hover:scale-110 shadow-[0_20px_40px_rgba(239,68,68,0.4)]">
                    <X size={32} />
                  </button>
                  <label className="w-20 h-20 bg-primary text-white rounded-[1.75rem] flex items-center justify-center hover:bg-primary-hover transition-all hover:scale-110 shadow-[0_20px_40px_rgba(124,58,237,0.4)] cursor-pointer">
                    <Camera size={32} />
                    <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} className="hidden" />
                  </label>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-full w-full cursor-pointer p-16 text-center group/label">
                <div className="w-28 h-28 rounded-[2.5rem] bg-primary/10 flex items-center justify-center mb-10 ring-4 ring-primary/5 shadow-2xl group-hover/label:scale-110 group-hover/label:rotate-6 transition-all duration-700 relative">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover/label:opacity-100 transition-opacity" />
                  <CloudUpload size={48} className="text-primary relative z-10" />
                </div>
                <h3 className="text-white font-black text-3xl mb-4 tracking-tighter">Inject Visual Core</h3>
                <p className="text-gray-500 text-lg font-medium max-w-[280px] mb-12 leading-relaxed">Add your artwork. Drag and drop a file or browse your device.</p>
                <div className="bg-gradient-to-r from-primary to-accent text-white font-black px-12 py-5 rounded-[1.5rem] text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-primary/30 hover:shadow-primary/60 hover:-translate-y-1 active:scale-95 transition-all">
                  Start
                </div>
                <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} className="hidden" />
              </label>
            )}
            
            {/* Corner Decorative UI */}
            <div className="absolute top-10 left-10 w-12 h-12 border-t-2 border-l-2 border-white/10 rounded-tl-3xl group-hover/drop:border-primary/40 transition-colors" />
            <div className="absolute bottom-10 right-10 w-12 h-12 border-b-2 border-r-2 border-white/10 rounded-br-3xl group-hover/drop:border-primary/40 transition-colors" />
          </div>
          
          <div className="p-10 bg-primary/5 rounded-[3rem] border border-primary/10 shadow-2xl relative overflow-hidden group/tips">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="flex items-center gap-4 mb-8">
               <Info size={24} className="text-primary" />
               <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.4em]">Upload Tips</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-primary" />
                     <p className="text-[10px] font-black text-white uppercase tracking-widest">Asset Integrity</p>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">High-fidelity JPEG or PNG recommended for maximum art clarity.</p>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-accent" />
                     <p className="text-[10px] font-black text-white uppercase tracking-widest">Data Capacity</p>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Sending limit capped at 10MB per message segment.</p>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="space-y-10">
          <div className="bg-dark-card border border-white/5 rounded-[3.5rem] p-12 space-y-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] relative group/console">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/console:opacity-100 transition-opacity duration-1000 pointer-events-none" />
            
            {/* Title */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-2">
                 <Palette size={16} className="text-primary" />
                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Artist Name</label>
              </div>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full bg-dark/60 border-2 border-white/5 rounded-[1.75rem] px-8 py-6 text-xl font-black text-white placeholder-gray-700 focus:outline-none focus:border-primary/50 transition-all shadow-inner tracking-tight"
                placeholder="Name your artwork..."
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-2">
                 <LayoutGrid size={16} className="text-primary" />
                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Contextual Data</label>
              </div>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-dark/60 border-2 border-white/5 rounded-[2rem] px-8 py-7 text-sm font-medium text-white placeholder-gray-700 focus:outline-none focus:border-primary/50 transition-all h-40 resize-none shadow-inner leading-relaxed"
                placeholder="Decode the essence of this creation..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] ml-2">Art Domain</label>
                <div className="relative group/sel">
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-dark/60 border-2 border-white/5 rounded-[1.5rem] px-8 py-5 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer shadow-inner relative z-10"
                  >
                    {categories.map(c => <option key={c} value={c} className="bg-dark-card">{c.toUpperCase()}</option>)}
                  </select>
                  <ArrowRight size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-primary rotate-90 z-20 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] ml-2">Discovery Tokens</label>
                <div className="relative">
                   <Tag size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700" />
                   <input
                    value={form.tags}
                    onChange={e => setForm({ ...form, tags: e.target.value })}
                    className="w-full bg-dark/60 border-2 border-white/5 rounded-[1.5rem] pl-14 pr-8 py-5 text-[11px] font-black text-white placeholder-gray-700 focus:outline-none focus:border-primary/50 transition-all shadow-inner uppercase tracking-widest"
                    placeholder="TAG-01, TAG-02..."
                  />
                </div>
              </div>
            </div>

            {/* Options Section */}
            <div className="space-y-4 pt-10 border-t border-white/5">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, publishToCommunity: !f.publishToCommunity }))}
                className={`w-full flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all duration-500 group/status shadow-2xl active:scale-95 ${form.publishToCommunity ? 'bg-primary/5 border-primary/20 text-white' : 'bg-dark/40 border-white/5 text-gray-600 hover:border-white/10'}`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${form.publishToCommunity ? 'bg-primary text-white shadow-[0_0_20px_rgba(124,58,237,0.5)] scale-110' : 'bg-surface text-gray-700'}`}>
                    <Globe size={22} />
                  </div>
                  <div className="text-left">
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] block">Global Art Link</span>
                     <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1">Share on the public feed</p>
                  </div>
                </div>
                <div className={`w-14 h-7 rounded-full relative transition-all duration-500 shadow-inner ${form.publishToCommunity ? 'bg-primary' : 'bg-surface'}`}>
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-2xl transition-all duration-500 ${form.publishToCommunity ? 'left-8' : 'left-1'}`} />
                </div>
              </button>

              <button
                type="button"
                disabled={!isAdultUser}
                onClick={() => setForm(f => ({ ...f, isAdultContent: !f.isAdultContent }))}
                className={`w-full flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all duration-500 group/status shadow-2xl active:scale-95 disabled:opacity-20 ${form.isAdultContent ? 'bg-red-500/10 border-red-500/20 text-white' : 'bg-dark/40 border-white/5 text-gray-600 hover:border-white/10'}`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${form.isAdultContent ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110' : 'bg-surface text-gray-700'}`}>
                    <ShieldAlert size={22} />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] block">Restricted Frequency (18+)</span>
                    {!isAdultUser ? (
                       <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1">Security Clearance Required</p>
                    ) : (
                       <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1">Mark as adult content</p>
                    )}
                  </div>
                </div>
                <div className={`w-14 h-7 rounded-full relative transition-all duration-500 shadow-inner ${form.isAdultContent ? 'bg-red-500' : 'bg-surface'}`}>
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-2xl transition-all duration-500 ${form.isAdultContent ? 'left-8' : 'left-1'}`} />
                </div>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full h-24 bg-gradient-to-r from-primary via-primary to-accent text-white font-black rounded-[2.5rem] text-[12px] uppercase tracking-[0.5em] shadow-[0_30px_60px_-15px_rgba(124,58,237,0.5)] hover:shadow-primary/70 hover:scale-[1.02] active:scale-95 disabled:opacity-20 disabled:translate-y-0 transition-all duration-500 flex items-center justify-center gap-6 group/submit mt-6 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/submit:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
              {loading ? (
                <><div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" /> Sendting...</>
              ) : (
                <>Establish Post <Send size={24} className="group-hover/submit:translate-x-2 group-hover/submit:-translate-y-2 transition-transform" /></>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
