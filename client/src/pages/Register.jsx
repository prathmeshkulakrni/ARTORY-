import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Palette } from 'lucide-react';

const interests = ['Painting', 'Digital Art', 'Sketch', 'Calligraphy', 'Sculpture', 'Photography', 'Comics', 'Mixed Media'];

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', bio: '', skills: [], artInterests: [] });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const { register } = useAuth();
  const navigate = useNavigate();

  const toggleInterest = (item) => {
    setForm(prev => ({
      ...prev,
      artInterests: prev.artInterests.includes(item) ? prev.artInterests.filter(i => i !== item) : [...prev.artInterests, item]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Welcome to Artory! 🎨');
      navigate('/feed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-accent-dark via-pink-900 to-dark items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{
              width: Math.random() * 200 + 50, height: Math.random() * 200 + 50,
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: Math.random() * 0.3,
            }} />
          ))}
        </div>
        <div className="text-center z-10 p-10">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Palette size={48} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Join Artory</h1>
          <p className="text-xl text-pink-200 max-w-md">Start your creative journey with AI-powered guidance and a supportive community.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-dark">
        <div className="w-full max-w-md animate-fade-in">
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-400 mb-6">Step {step} of 2</p>
          <div className="flex gap-2 mb-8">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-dark-border'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-dark-border'}`} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Username</label>
                  <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="your_art_name" className="input" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="input" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" className="input pr-12" required />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button type="button" onClick={() => setStep(2)} className="btn-primary w-full text-lg py-3">Next</button>
              </>
            )}
            {step === 2 && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Bio</label>
                  <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself..." className="input h-20 resize-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Art Interests</label>
                  <div className="flex flex-wrap gap-2">
                    {interests.map(item => (
                      <button key={item} type="button" onClick={() => toggleInterest(item)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${form.artInterests.includes(item) ? 'bg-primary text-white' : 'bg-dark-border text-gray-400 hover:text-white'}`}>
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1 py-3">Back</button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 text-lg py-3 disabled:opacity-50">
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="text-center text-gray-400 mt-6">
            Already have an account? <Link to="/login" className="text-primary hover:text-primary-light font-semibold">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
