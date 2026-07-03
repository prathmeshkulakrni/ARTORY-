import { useState, useRef, useCallback } from 'react';
import {
  X, Upload, Image as ImageIcon, Send, Loader2, Tag, Type,
  AlignLeft, Sparkles, Palette, Globe, Lock, ChevronDown, Check,
  Plus, Zap
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const POST_TYPES = [
  { id: 'artwork', label: 'Artwork', icon: Palette, color: 'from-primary to-accent' },
];

const CATEGORIES = ['painting', 'digital', 'sketch', 'calligraphy', 'sculpture', 'photography', 'comic', 'other'];

export default function CreatePostModal({ communityId, isAdultUser, onClose, onSuccess }) {
  const step = 2; // 1 = type select, 2 = fill form
  const postType = 'artwork';
  const [form, setForm] = useState({
    title: '',
    description: '',
    tags: '',
    category: 'other',
    isAdultContent: false,
    visibility: 'public',
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const fileRef = useRef(null);

  /* ── File Handling ── */
  const processFile = useCallback((f) => {
    if (!f) return;
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(f.type)) {
      toast.error('Only JPEG, PNG, GIF, WEBP images are allowed');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error('Image must be under 20 MB');
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const removeFile = () => {
    setFile(null);
    if (preview) { URL.revokeObjectURL(preview); setPreview(null); }
    if (fileRef.current) fileRef.current.value = '';
  };

  /* ── Tag Handling ── */
  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!t || tags.includes(t) || tags.length >= 8) return;
    setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t));

  const onTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Please add a title'); return; }
    if (!file) { toast.error('Please upload an image'); return; }

    setIsSubmitting(true);
    try {
      // 1. Create artwork
      const fd = new FormData();
      fd.append('image', file);
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('category', form.category);
      fd.append('tags', [...tags, postType].join(','));
      fd.append('isAdultContent', form.isAdultContent ? 'true' : 'false');

      const artworkRes = await api.post('/artwork', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // 2. Add to community
      await api.post(`/community/${communityId}/post`, {
        artworkId: artworkRes.data._id,
      });

      toast.success('🎨 Post created successfully!', {
        style: { background: '#1a1b1e', color: '#fff', border: '1px solid rgba(124,58,237,0.3)' },
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create post';
      toast.error(msg, {
        style: { background: '#1a1b1e', color: '#fff', border: '1px solid rgba(239,68,68,0.3)' },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Helpers ── */
  const selectedType = POST_TYPES.find(t => t.id === postType);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

      {/* Modal */}
      <div className="relative w-full max-w-3xl bg-[#0c0d0f] border border-white/10 rounded-[2.5rem] shadow-[0_0_120px_rgba(124,58,237,0.15)] overflow-hidden animate-fade-in">

        {/* Glow accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full -mr-40 -mt-40 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-accent/5 rounded-full -ml-30 -mb-30 blur-[60px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${selectedType?.color} flex items-center justify-center shadow-2xl`}>
              {selectedType && <selectedType.icon size={22} className="text-white" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tighter">Create Post</h2>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mt-0.5">
                {selectedType?.label} · Community Post
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step 2: Post Form */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="relative z-10">
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto hide-scrollbar">

              {/* Image Upload Zone */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
                  Artwork Image <span className="text-red-500">*</span>
                </label>
                {!preview ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`relative h-52 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-500 group/drop ${
                      isDragging
                        ? 'border-primary bg-primary/10 scale-[1.02]'
                        : 'border-white/10 bg-dark/40 hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover/drop:bg-primary/20 transition-all duration-500">
                      <Upload size={28} className="text-gray-600 group-hover/drop:text-primary transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-white tracking-tight">
                        {isDragging ? 'Drop image here' : 'Click or drag & drop'}
                      </p>
                      <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mt-1">
                        JPEG · PNG · GIF · WEBP · Max 20 MB
                      </p>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={onFileChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative rounded-[2rem] overflow-hidden border border-primary/30 group/prev shadow-2xl shadow-primary/10">
                    <img
                      src={preview}
                      alt="preview"
                      className="w-full h-52 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/prev:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="h-12 px-6 rounded-xl bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="h-12 px-6 rounded-xl bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                      <p className="text-[9px] font-black text-white uppercase tracking-widest truncate max-w-[200px]">{file?.name}</p>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
                  Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Type size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Give your post a compelling title..."
                    maxLength={100}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm font-medium text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-gray-700 font-black">
                    {form.title.length}/100
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Add context, story, or instructions for your post..."
                  maxLength={1000}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all resize-none leading-relaxed"
                />
                <p className="text-[9px] text-gray-700 font-black text-right">{form.description.length}/1000</p>
              </div>

              {/* Category & Options Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Category</label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black text-white focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer capitalize"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="bg-[#0c0d0f] capitalize">{cat}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Visibility */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Visibility</label>
                  <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, visibility: 'public' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        form.visibility === 'public' ? 'bg-primary text-white shadow-xl' : 'text-gray-500 hover:text-white'
                      }`}
                    >
                      <Globe size={12} /> Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, visibility: 'members' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        form.visibility === 'members' ? 'bg-accent text-white shadow-xl' : 'text-gray-500 hover:text-white'
                      }`}
                    >
                      <Lock size={12} /> Members
                    </button>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
                  Tags <span className="text-gray-700">(max 8)</span>
                </label>
                <div className="flex flex-wrap gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl min-h-[56px] focus-within:border-primary/50 transition-all">
                  {tags.map(t => (
                    <span
                      key={t}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/20 border border-primary/30 text-[10px] font-black text-primary uppercase tracking-widest"
                    >
                      #{t}
                      <button type="button" onClick={() => removeTag(t)} className="hover:text-red-400 transition-colors">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  {tags.length < 8 && (
                    <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                      <Tag size={12} className="text-gray-600 shrink-0" />
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={onTagKeyDown}
                        onBlur={addTag}
                        placeholder="Add tag, press Enter..."
                        className="flex-1 bg-transparent text-[12px] font-black text-white placeholder-gray-700 outline-none uppercase tracking-widest"
                      />
                      {tagInput && (
                        <button type="button" onClick={addTag} className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                          <Plus size={12} className="text-white" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-gray-700 font-black">Press Enter or comma to add tags</p>
              </div>

              {/* 18+ Toggle */}
              {isAdultUser && (
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-6 py-4">
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-tight">18+ Content</p>
                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mt-0.5">Mark as adult content</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, isAdultContent: !f.isAdultContent }))}
                    className={`relative w-14 h-7 rounded-full transition-all duration-500 shadow-inner ${
                      form.isAdultContent ? 'bg-accent shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'bg-white/10'
                    }`}
                  >
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-2xl transition-all duration-500 ${form.isAdultContent ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center gap-4 px-8 pb-8 pt-2 relative z-10">
              <button
                type="submit"
                disabled={isSubmitting || !file || !form.title.trim()}
                className="flex-1 h-14 bg-gradient-to-r from-primary to-accent text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                    <span>Publish Post</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-14 px-8 rounded-2xl bg-white/5 border border-white/5 text-gray-500 font-black text-[11px] uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
