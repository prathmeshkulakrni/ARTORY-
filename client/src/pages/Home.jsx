import { useNavigate } from 'react-router-dom';
import { Palette, Sparkles, Users, Trophy, MessageCircle, BookOpen } from 'lucide-react';

const features = [
  { icon: Palette, title: 'Upload & Showcase', desc: 'Share your art with a global audience' },
  { icon: Sparkles, title: 'AI Art Mentor', desc: 'Get personalized guidance and feedback' },
  { icon: Users, title: 'Communities', desc: 'Join groups of like-minded artists' },
  { icon: Trophy, title: 'Competitions', desc: 'Compete and win recognition' },
  { icon: MessageCircle, title: 'Live Chat', desc: 'Connect with artists in real-time' },
  { icon: BookOpen, title: 'Comics', desc: 'Publish and read comic series' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-dark to-accent/10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-8 animate-fade-in">
            <Sparkles size={16} /> AI-Powered Art Platform
          </div>
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 animate-slide-up">
            Where <span className="text-gradient">Art</span> Meets
            <br /><span className="text-gradient">Intelligence</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-slide-up">
            Learn, create, and grow with AI-powered mentorship, a vibrant community, and tools designed for artists at every level.
          </p>
          <div className="flex gap-4 justify-center animate-slide-up">
            <button onClick={() => navigate('/register')} className="btn-primary text-lg px-8 py-4 glow-purple">Get Started Free</button>
            <button onClick={() => navigate('/login')} className="btn-outline text-lg px-8 py-4">Sign In</button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Everything you need to grow as an artist</h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">From AI-powered feedback to community competitions — Artory has it all.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="card group hover:glow-purple cursor-default animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                <Icon size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
              <p className="text-gray-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="glass p-12">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to start creating?</h2>
          <p className="text-gray-400 mb-8 text-lg">Join thousands of artists already on Artory.</p>
          <button onClick={() => navigate('/register')} className="btn-primary text-lg px-10 py-4">Join Artory — It's Free</button>
        </div>
      </div>
    </div>
  );
}
