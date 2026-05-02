import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Upload as UploadIcon, X, Image, Sparkles } from 'lucide-react';

const categories = ['painting', 'digital', 'sketch', 'calligraphy', 'sculpture', 'photography', 'comic', 'other'];

export default function Upload() {
  const [form, setForm] = useState({ title: '', description: '', category: 'painting', tags: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select an image');
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    try {
      await api.post('/artwork', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Artwork uploaded! 🎨');
      navigate('/feed');
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-2">Upload Artwork</h1>
      <p className="text-gray-400 mb-8">Share your creation with the world</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image drop zone */}
        <div className="card">
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full max-h-96 object-contain rounded-xl" />
              <button type="button" onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-3 right-3 w-8 h-8 bg-red-500/80 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors">
                <X size={16} className="text-white" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-dark-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
              <Image size={48} className="text-gray-600 mb-3" />
              <p className="text-gray-400 font-medium">Click or drag to upload</p>
              <p className="text-gray-600 text-sm mt-1">JPG, PNG, GIF, WebP (max 50MB)</p>
              <input type="file" accept="image/*,video/mp4" onChange={handleFile} className="hidden" />
            </label>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Title</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" placeholder="Name your artwork" required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input">
              {categories.map(c => <option key={c} value={c} className="bg-dark-card">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-1 block">Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input h-24 resize-none" placeholder="Tell us about this piece..." />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-1 block">Tags</label>
          <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="input" placeholder="watercolor, landscape, abstract (comma separated)" />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
            : <><UploadIcon size={20} /> Upload Artwork</>}
        </button>
      </form>
    </div>
  );
}
