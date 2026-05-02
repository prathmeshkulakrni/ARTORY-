import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Palette } from 'lucide-react';

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
      toast.success('Welcome back!', { duration: 5000 });
      navigate('/feed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-dark via-purple-900 to-dark items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{
              width: Math.random() * 200 + 50,
              height: Math.random() * 200 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3,
            }} />
          ))}
        </div>
        <div className="text-center z-10 p-10">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Palette size={48} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Artory</h1>
          <p className="text-xl text-purple-200 max-w-md">Where art meets AI. Learn, create, and grow with a global community of artists.</p>
          <div className="flex gap-6 mt-10 justify-center text-white/70">
            <div className="text-center"><p className="text-3xl font-bold text-white">10K+</p><p className="text-sm">Artists</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-white">50K+</p><p className="text-sm">Artworks</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-white">AI</p><p className="text-sm">Powered</p></div>
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-dark">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold gradient-text">🎨 Artory</h1>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-gray-400 mb-8">Sign in to continue your creative journey</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="artist@artory.com" className="input" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input pr-12" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full text-lg py-3 disabled:opacity-50">
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</span> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-6">
            Don't have an account? <Link to="/register" className="text-primary hover:text-primary-light font-semibold">Join Artory</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
