import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Sparkles, Zap, ShieldCheck, ArrowRight, User } from 'lucide-react';
import ArtoryLogo from '../components/ArtoryLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back to the group!');
      navigate('/feed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen lg:h-screen flex bg-dark selection:bg-primary selection:text-white overflow-y-auto lg:overflow-hidden">
      {/* Left — Aesthetic Hero Panel */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden items-center justify-center">
        {/* Background image with parallax-like feel */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 animate-pulse-slow"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?auto=format&fit=crop&q=80&w=1400)' }}
        />
        {/* Deep Gradient & Texture Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark/40 to-primary/20" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        
        {/* Floating Abstract Elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Brand Content */}
        <div className="relative z-10 px-20 max-w-2xl text-left">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white/90 text-[10px] font-black uppercase tracking-[0.2em] mb-12 animate-fade-in">
            <Sparkles size={14} className="text-primary"/> Art Community
          </div>
          
          <h1 className="text-7xl font-black text-white mb-8 leading-[0.9] tracking-tighter animate-slide-up">
            Your Vision,<br />
            Our <span className="text-primary italic">Canvas</span>.<br />
            Unbound.
          </h1>
          
          <p className="text-gray-400 text-xl font-medium leading-relaxed mb-12 max-w-md animate-slide-up" style={{ animationDelay: '100ms' }}>
            Log in to your Artory account.
          </p>

          <div className="grid grid-cols-3 gap-8 pt-12 border-t border-white/10 animate-slide-up" style={{ animationDelay: '200ms' }}>
            {[
              { val: '10K+', label: 'Artists', icon: User },
              { val: '50K+', label: 'Gallery', icon: ShieldCheck },
              { val: 'AI', label: 'Mentor', icon: Zap }
            ].map((stat) => (
              <div key={stat.label} className="group">
                <p className="text-3xl font-black text-white group-hover:text-primary transition-colors tracking-tight">{stat.val}</p>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Sleek Authentication Terminal */}
      <div className="flex-1 flex items-start sm:items-center justify-center px-5 py-8 sm:p-8 lg:p-24 bg-dark relative">
        <div className="w-full max-w-sm animate-fade-in relative z-10">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => navigate('/')}>
               <ArtoryLogo size={56} />
            </div>
            
            <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">Welcome back</h2>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Identify yourself to access the group</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Authentication Mail</label>
              <div className="relative group">
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="artist@artory.io"
                  className="w-full bg-surface/40 border border-dark-border/40 rounded-[1.25rem] px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/60 focus:bg-surface/60 transition-all text-sm font-medium"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Secure Phrase</label>
                 <button type="button" className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Forgot Key?</button>
              </div>
              <div className="relative group">
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface/40 border border-dark-border/40 rounded-[1.25rem] px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/60 focus:bg-surface/60 transition-all text-sm font-medium pr-14"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-accent text-white font-black py-5 rounded-[1.25rem] shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] mt-8"
            >
              {loading ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Authorize Access <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-gray-500 text-[11px] font-black uppercase tracking-widest">
              New Artist?{' '}
              <Link to="/register" className="text-primary hover:text-accent font-black transition-colors ml-2 underline decoration-primary/20 underline-offset-4">Join The Group</Link>
            </p>
          </div>
        </div>
        
        {/* Subtle decorative background detail */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -z-10" />
      </div>
    </div>
  );
}
