import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, User, Mail, Lock, Calendar, ArrowRight, ArrowLeft, Palette, BookOpen, Fingerprint } from 'lucide-react';
import ArtoryLogo from '../components/ArtoryLogo';

const interests = ['Painting', 'Digital Art', 'Sketch', 'Calligraphy', 'Sculpture', 'Photography', 'Comics', 'Mixed Media', 'Concept Art', '3D Design'];

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', age: '', bio: '', artInterests: [] });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const { register } = useAuth();
  const navigate = useNavigate();

  const toggleInterest = (item) => {
    setForm(prev => ({
      ...prev,
      artInterests: prev.artInterests.includes(item)
        ? prev.artInterests.filter(i => i !== item)
        : [...prev.artInterests, item]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const age = Number(form.age);
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      toast.error('Please enter a valid age');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Welcome to the group, Artist!');
      navigate('/feed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const goNext = () => {
    const age = Number(form.age);
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      toast.error('Please complete identity credentials');
      return;
    }
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      toast.error('Please enter a valid age');
      return;
    }
    setStep(2);
  };

  return (
    <div className="min-h-screen lg:h-screen flex bg-dark selection:bg-primary selection:text-white overflow-y-auto lg:overflow-hidden">
      {/* Left — Aesthetic Hero Panel */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 animate-pulse-slow"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&q=80&w=1400)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark/40 to-accent/20" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        
        {/* Floating Abstract Elements */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-accent/20 rounded-full blur-[110px] animate-pulse" />
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 px-20 max-w-2xl text-left">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white/90 text-[10px] font-black uppercase tracking-[0.2em] mb-12 animate-fade-in">
            <Palette size={14} className="text-accent"/> Start Your Creative Journey
          </div>
          <h1 className="text-7xl font-black text-white mb-8 leading-[0.9] tracking-tighter animate-slide-up">
            Your Art.<br />
            Your Story.<br />
            <span className="text-accent italic text-6xl">Infinite Stage.</span>
          </h1>
          <p className="text-gray-400 text-xl font-medium leading-relaxed max-w-md animate-slide-up" style={{ animationDelay: '100ms' }}>
            Join Artory to share art, learn with AI, and meet other artists.
          </p>
        </div>
      </div>

      {/* Right — Onboarding Terminal */}
      <div className="flex-1 flex items-start sm:items-center justify-center px-5 py-8 sm:p-8 lg:p-24 bg-dark relative">
        <div className="w-full max-w-sm animate-fade-in relative z-10">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => navigate('/')}>
               <ArtoryLogo size={56} />
            </div>
            
            <div className="flex justify-between items-end">
               <div>
                  <h2 className="text-4xl font-black text-white tracking-tighter">Create Account</h2>
                  <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Onboarding Phase {step} of 2</p>
               </div>
               <div className="flex gap-1.5 mb-2">
                  <div className={`w-3 h-1.5 rounded-full transition-all duration-500 ${step === 1 ? 'w-8 bg-primary' : 'bg-surface'}`} />
                  <div className={`w-3 h-1.5 rounded-full transition-all duration-500 ${step === 2 ? 'w-8 bg-accent' : 'bg-surface'}`} />
               </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-6 animate-slide-up">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><User size={12}/> Artist Name</label>
                  <input
                    value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                    placeholder="your_unique_id"
                    className="w-full bg-surface/40 border border-dark-border/40 rounded-[1.25rem] px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/60 focus:bg-surface/60 transition-all text-sm font-medium"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Mail size={12}/> Secure Mail</label>
                  <input
                    type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="artist@artory.io"
                    className="w-full bg-surface/40 border border-dark-border/40 rounded-[1.25rem] px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/60 focus:bg-surface/60 transition-all text-sm font-medium"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Lock size={12}/> Access Key</label>
                      <div className="relative">
                        <input
                          type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                          placeholder="••••••••"
                          className="w-full bg-surface/40 border border-dark-border/40 rounded-[1.25rem] px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/60 focus:bg-surface/60 transition-all text-sm font-medium pr-12"
                          required
                        />
                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary">
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Calendar size={12}/> Chrono Age</label>
                      <input
                        type="number" min="1" max="120" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })}
                        placeholder="24"
                        className="w-full bg-surface/40 border border-dark-border/40 rounded-[1.25rem] px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/60 focus:bg-surface/60 transition-all text-sm font-medium"
                        required
                      />
                   </div>
                </div>

                <button
                  type="button" onClick={goNext}
                  className="w-full bg-gradient-to-r from-primary to-accent text-white font-black py-5 rounded-[1.25rem] shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] mt-4"
                >
                  Configure Identity <ArrowRight size={16} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-slide-up">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><BookOpen size={12}/> Artistic Narrative</label>
                  <textarea
                    value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                    placeholder="The story behind your art..."
                    className="w-full bg-surface/40 border border-dark-border/40 rounded-[1.25rem] px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/60 focus:bg-surface/60 transition-all h-28 resize-none text-sm font-medium"
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Fingerprint size={12}/> Core Disciplines</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 custom-scrollbar">
                    {interests.map(item => (
                      <button
                        key={item} type="button" onClick={() => toggleInterest(item)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          form.artInterests.includes(item)
                            ? 'bg-accent text-white shadow-lg shadow-accent/20'
                            : 'bg-surface/40 border border-dark-border/40 text-gray-500 hover:text-white hover:border-accent/40'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button" onClick={() => setStep(1)}
                    className="w-16 h-16 bg-surface/40 border border-dark-border/40 text-gray-400 rounded-2xl hover:border-primary/40 hover:text-white transition-all flex items-center justify-center shrink-0"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <button
                    type="submit" disabled={loading}
                    className="flex-1 bg-gradient-to-r from-primary to-accent text-white font-black py-5 rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 text-[11px] uppercase tracking-[0.2em]"
                  >
                    {loading ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : 'Create Account'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-gray-500 text-[11px] font-black uppercase tracking-widest">
              Already Identified?{' '}
              <Link to="/login" className="text-primary hover:text-accent font-black transition-colors ml-2 underline decoration-primary/20 underline-offset-4">Authorize Access</Link>
            </p>
          </div>
        </div>
        
        {/* Decorative Detail */}
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] -z-10" />
      </div>
    </div>
  );
}
