import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, IndianRupee, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const categories = ['Sketching', 'Digital Art', 'Painting', 'Anime Art', 'Logo Design', 'Portrait', 'Calligraphy', 'Comics', 'Other'];

export default function CreateRequest() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Digital Art',
    budgetMin: '',
    budgetMax: '',
    deadline: '',
  });

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    files.forEach(file => data.append('referenceImages', file));
    try {
      const res = await api.post('/marketplace/requests', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Request created');
      navigate(`/marketplace/requests/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Create Art Request</h1>
        <p className="text-gray-400 mt-1">Share a clear brief, budget, deadline, and reference images for artists to apply.</p>
      </div>

      <form onSubmit={submit} className="card p-6 space-y-5">
        <label className="block">
          <span className="text-sm text-gray-400 block mb-2">Title</span>
          <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Anime portrait for a profile banner" maxLength="120" required />
        </label>

        <label className="block">
          <span className="text-sm text-gray-400 block mb-2">Description</span>
          <textarea className="input min-h-36 resize-y" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Style, dimensions, deliverables, references, usage, and expectations..." required />
        </label>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-gray-400 block mb-2">Category</span>
            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {categories.map(category => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-gray-400 block mb-2">Deadline</span>
            <input type="date" className="input" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required />
          </label>
        </div>

        <div>
          <span className="text-sm text-gray-400 block mb-2">Budget range in INR</span>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="number" min="0" className="input pl-9" value={form.budgetMin} onChange={e => setForm({ ...form, budgetMin: e.target.value })} placeholder="Minimum" required />
            </div>
            <div className="relative">
              <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="number" min="0" className="input pl-9" value={form.budgetMax} onChange={e => setForm({ ...form, budgetMax: e.target.value })} placeholder="Maximum" required />
            </div>
          </div>
        </div>

        <div>
          <span className="text-sm text-gray-400 block mb-2">Reference images</span>
          <label className="border border-dashed border-dark-border rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/60 transition-colors bg-dark/40">
            <ImagePlus size={26} className="text-primary" />
            <span className="text-sm text-gray-300">Upload images</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => setFiles(Array.from(e.target.files || []))} />
          </label>
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {files.map(file => (
                <span key={file.name} className="badge bg-surface text-gray-300 flex items-center gap-1">
                  {file.name}
                  <button type="button" onClick={() => setFiles(prev => prev.filter(f => f.name !== file.name))}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/marketplace')} className="btn-outline">Cancel</button>
          <button disabled={submitting} type="submit" className="btn-primary inline-flex items-center gap-2">
            <Send size={16} /> {submitting ? 'Creating...' : 'Publish Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
