import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import {
  Send, Bot, User, Sparkles, BookOpen, PlayCircle, Upload,
  ChevronRight, Zap, Target, Award, BrainCircuit, Users2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import MentorRecommendationPanel from '../components/mentors/MentorRecommendationPanel';

const suggestedPrompts = [
  'How to shade realistic faces?',
  'Tips for watercolor blending?',
  'How to improve digital sketching?',
  'Explain color theory basics',
  'How to develop a unique art style?',
  'Best brushes for concept art?',
];

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'chat', label: 'AI Chat', icon: Bot },
  { id: 'mentors', label: 'Find Mentors', icon: Users2 },
];

export default function AIMentor() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Hi ${user?.username || 'there'} 👋\nI'm your AI art mentor, designed to help you evolve as an artist.\n\nWhether you need a critique, a learning path, or technical tips, I'm here. What's on your mind today?`,
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [learningPath, setLearningPath] = useState(null);
  const [tutorials, setTutorials] = useState([]);
  const [showTutorials, setShowTutorials] = useState(false);
  const [tutorialForm, setTutorialForm] = useState({ title: '', description: '', videoUrl: '' });
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (msg) => {
    const userMsg = msg || input;
    if (!userMsg.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);
    try {
      const r = await api.post('/ai/mentor', { message: userMsg });
      setMessages(prev => [...prev, { role: 'ai', text: r.data.reply, mentorSuggestion: r.data.mentorSuggestion }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting to my creative circuits. Please try again in a moment." }]);
    }
    setLoading(false);
  };

  const handleSubmit = (e) => { e.preventDefault(); send(); };

  const loadPath = async (level) => {
    try {
      const r = await api.get(`/ai/learning-path?level=${level}`);
      setLearningPath(r.data);
      toast.success(`${level.charAt(0).toUpperCase() + level.slice(1)} path loaded!`);
    } catch {
      toast.error('Failed to generate path');
    }
  };

  const loadTutorials = async () => {
    try {
      const { data } = await api.get('/ai/tutorials');
      setTutorials(data);
      setShowTutorials(true);
    } catch {
      toast.error('Failed to load tutorials');
    }
  };

  const createTutorial = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/ai/tutorials', tutorialForm);
      setTutorials(prev => [data, ...prev]);
      setShowTutorials(true);
      setTutorialForm({ title: '', description: '', videoUrl: '' });
      toast.success('Tutorial published to the community!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload tutorial');
    }
  };

  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const profileImg = user?.profileImage
    ? (user.profileImage.startsWith('http') ? user.profileImage : `${API_BASE}${user.profileImage}`)
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] animate-fade-in px-4 lg:px-0 gap-0">

      {/* ── Tab Bar ── */}
      <div className="flex-shrink-0 flex items-center gap-1 mb-5 bg-dark-card border border-dark-border/40 rounded-2xl p-1.5 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === id
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {activeTab === id && (
              <motion.div
                layoutId="tab-bg"
                className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-xl"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <Icon size={13} />
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'chat' ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden"
          >
            {/* Chat Panel */}
            <div className="flex-1 flex flex-col bg-dark-card border border-dark-border/40 rounded-[2.5rem] overflow-hidden shadow-2xl">
              {/* Chat Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-dark-border/30 bg-gradient-to-r from-primary/10 via-transparent to-accent/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-primary/20 border border-primary/30 flex items-center justify-center relative">
                    <Bot size={24} className="text-primary" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-dark-card rounded-full" />
                  </div>
                  <div>
                    <p className="font-black text-white tracking-tight">AI Art Mentor</p>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">AI ready</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-8 py-10 space-y-8 scroll-smooth hide-scrollbar">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`flex gap-4 max-w-[85%] md:max-w-[70%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden border shadow-lg ${m.role === 'ai' ? 'bg-gradient-to-br from-primary/30 to-accent/20 border-primary/20' : 'bg-surface border-dark-border/40'}`}>
                        {m.role === 'ai'
                          ? <Bot size={20} className="text-primary" />
                          : profileImg
                            ? <img src={profileImg} className="w-full h-full object-cover" alt="" />
                            : <User size={20} className="text-accent" />
                        }
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className={`px-6 py-4 rounded-[1.5rem] text-sm leading-relaxed whitespace-pre-line shadow-xl ${m.role === 'user' ? 'bg-gradient-to-r from-primary to-accent text-white rounded-tr-md font-medium' : 'bg-surface/60 border border-dark-border/40 text-gray-200 rounded-tl-md'}`}>
                          {m.text}
                        </div>
                        {m.mentorSuggestion && (
                          <div className="mt-1 bg-dark border border-primary/30 rounded-2xl p-4 shadow-lg flex items-center gap-4 hover:border-primary transition-all">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface flex-shrink-0">
                              {m.mentorSuggestion.mentor?.profileImage ? (
                                <img src={m.mentorSuggestion.mentor.profileImage.startsWith('http') ? m.mentorSuggestion.mentor.profileImage : `${API_BASE}${m.mentorSuggestion.mentor.profileImage}`} alt={m.mentorSuggestion.mentorName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold">{m.mentorSuggestion.mentorName.charAt(0)}</div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-black text-white">{m.mentorSuggestion.mentorName}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{m.mentorSuggestion.matchReason}</p>
                              <p className="text-[10px] text-primary font-bold mt-1 tracking-widest uppercase">✦ {m.mentorSuggestion.matchPercentage}% Match</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-4 justify-start animate-fade-in">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/20 flex items-center justify-center">
                      <Bot size={20} className="text-primary" />
                    </div>
                    <div className="bg-surface/60 border border-dark-border/40 rounded-[1.5rem] rounded-tl-md px-6 py-4 flex gap-2 items-center">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}

                {/* Suggested Prompts — show only at start */}
                {messages.length === 1 && (
                  <div className="mt-10 px-14 animate-slide-up">
                    <p className="text-[10px] font-black text-gray-500 mb-4 uppercase tracking-[0.2em]">Try asking</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {suggestedPrompts.slice(0, 4).map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => send(prompt)}
                          className="flex items-center gap-3 w-full text-left text-xs font-bold text-gray-300 bg-dark/40 hover:bg-primary/10 hover:text-white border border-dark-border/40 hover:border-primary/40 px-5 py-4 rounded-2xl transition-all group"
                        >
                          <Sparkles size={14} className="text-primary opacity-50 group-hover:opacity-100" />
                          {prompt}
                        </button>
                      ))}
                    </div>

                    {/* Find Mentors CTA */}
                    <button
                      onClick={() => setActiveTab('mentors')}
                      className="mt-4 w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 hover:border-primary/40 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Users2 size={16} className="text-primary" />
                        <div className="text-left">
                          <p className="text-xs font-black text-white">Find AI-Matched Mentors</p>
                          <p className="text-[10px] text-gray-500">Get personalized mentor recommendations</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-primary group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}

                <div ref={endRef} />
              </div>

              {/* Input */}
              <div className="px-8 pb-8 pt-4">
                <form onSubmit={handleSubmit} className="relative flex items-center group">
                  <div className="absolute left-4 w-10 h-10 rounded-xl bg-surface/40 flex items-center justify-center text-gray-500 group-focus-within:text-primary transition-colors">
                    <Zap size={18} />
                  </div>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask anything about art techniques, theory, or feedback..."
                    className="w-full bg-dark/60 border-2 border-dark-border/40 rounded-3xl pl-16 pr-20 py-5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:bg-dark transition-all shadow-inner"
                  />
                  <div className="absolute right-3 flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={loading || !input.trim()}
                      className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-30 active:scale-95 group/btn"
                    >
                      <Send size={20} className="text-white group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </form>
                <p className="text-[10px] text-gray-600 text-center mt-4 font-bold uppercase tracking-widest">AI Mentor can make mistakes. Check important details.</p>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:w-80 space-y-8 overflow-y-auto hide-scrollbar">
              {/* Learning Paths */}
              <div className="bg-dark-card border border-dark-border/40 rounded-[2.5rem] p-8 shadow-xl">
                <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
                  <Target size={18} className="text-primary" /> Learning Paths
                </h3>
                <div className="space-y-4">
                  <button onClick={() => loadPath('beginner')} className="w-full group flex items-center justify-between p-5 rounded-2xl bg-surface/40 border border-dark-border/40 hover:border-green-500/30 transition-all text-left">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500"><Sparkles size={20} /></div>
                      <div>
                        <p className="text-xs font-black text-white">Beginner</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Fundamentals</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-600 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                  </button>

                  <button onClick={() => loadPath('intermediate')} className="w-full group flex items-center justify-between p-5 rounded-2xl bg-surface/40 border border-dark-border/40 hover:border-blue-500/30 transition-all text-left">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><BrainCircuit size={20} /></div>
                      <div>
                        <p className="text-xs font-black text-white">Intermediate</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Styles & Flow</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </button>

                  <button onClick={loadTutorials} className="w-full group flex items-center justify-between p-5 rounded-2xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all text-left">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary"><PlayCircle size={20} /></div>
                      <div>
                        <p className="text-xs font-black text-white">Video Lessons</p>
                        <p className="text-[10px] font-bold text-primary/60 uppercase tracking-tighter">Video Guides</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-primary group-hover:translate-x-1 transition-all" />
                  </button>

                  {/* Find Mentors shortcut in sidebar */}
                  <button onClick={() => setActiveTab('mentors')} className="w-full group flex items-center justify-between p-5 rounded-2xl bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-all text-left">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent"><Users2 size={20} /></div>
                      <div>
                        <p className="text-xs font-black text-white">Find Mentors</p>
                        <p className="text-[10px] font-bold text-accent/60 uppercase tracking-tighter">AI Matched</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-accent group-hover:translate-x-1 transition-all" />
                  </button>
                </div>

                {learningPath && (
                  <div className="mt-8 space-y-6 animate-slide-up border-t border-dark-border/30 pt-8">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Current Roadmap</p>
                    <div className="space-y-6">
                      {learningPath.map((w, i) => (
                        <div key={i} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-gradient-to-b before:from-primary before:to-transparent">
                          <div className="absolute left-[-4px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Week {w.week}</p>
                          <p className="text-sm font-black text-white mb-2 leading-tight">{w.title}</p>
                          <ul className="space-y-1.5">
                            {w.tasks.map((t, j) => (
                              <li key={j} className="flex gap-2 text-[11px] text-gray-400 font-medium">
                                <span className="text-primary text-[8px] mt-1">✦</span> {t}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Tutorial (verified users only) */}
              {(user?.isVerified || user?.role === 'admin') && (
                <div className="bg-dark-card border border-dark-border/40 rounded-[2.5rem] p-8 shadow-xl">
                  <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
                    <Upload size={18} className="text-accent" /> Share a Tutorial
                  </h3>
                  <form onSubmit={createTutorial} className="space-y-4">
                    <input value={tutorialForm.title} onChange={(e) => setTutorialForm({ ...tutorialForm, title: e.target.value })} className="w-full bg-dark/50 border border-dark-border/40 rounded-xl px-4 py-3 text-xs text-white focus:border-accent transition-all" placeholder="Tutorial Title" required />
                    <textarea value={tutorialForm.description} onChange={(e) => setTutorialForm({ ...tutorialForm, description: e.target.value })} className="w-full bg-dark/50 border border-dark-border/40 rounded-xl px-4 py-3 text-xs text-white h-20 resize-none focus:border-accent transition-all" placeholder="Short description..." />
                    <input value={tutorialForm.videoUrl} onChange={(e) => setTutorialForm({ ...tutorialForm, videoUrl: e.target.value })} className="w-full bg-dark/50 border border-dark-border/40 rounded-xl px-4 py-3 text-xs text-white focus:border-accent transition-all" placeholder="Video URL (YouTube/Vimeo)" required />
                    <button type="submit" className="w-full bg-accent text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:shadow-xl hover:shadow-accent/20 transition-all active:scale-95">Publish Guide</button>
                  </form>
                </div>
              )}

              {/* Tutorials List */}
              {showTutorials && (
                <div className="bg-dark-card border border-dark-border/40 rounded-[2.5rem] p-8 shadow-xl animate-slide-up">
                  <h3 className="text-sm font-black text-white mb-6 uppercase tracking-widest">Tutorial Library</h3>
                  <div className="space-y-4">
                    {tutorials.length === 0 ? (
                      <div className="text-center py-6">
                        <PlayCircle size={32} className="text-gray-700 mx-auto mb-2 opacity-30" />
                        <p className="text-xs text-gray-500 font-bold">The library is currently empty.</p>
                      </div>
                    ) : tutorials.map((tutorial) => (
                      <a key={tutorial._id} href={tutorial.videoUrl} target="_blank" rel="noreferrer"
                        className="block p-5 rounded-2xl bg-surface/40 border border-dark-border/40 hover:border-primary/40 hover:bg-surface transition-all group">
                        <p className="font-black text-white text-sm group-hover:text-primary transition-colors leading-tight mb-1">{tutorial.title}</p>
                        <p className="text-[10px] text-gray-500 font-medium line-clamp-2">{tutorial.description || 'Helpful artist guide'}</p>
                        <div className="flex items-center justify-between mt-4">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                            <Award size={12} /> {tutorial.creator?.username}
                          </p>
                          <PlayCircle size={14} className="text-gray-600 group-hover:text-primary transition-colors" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ── Mentors Tab ── */
          <motion.div
            key="mentors"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="flex-1 bg-dark-card border border-dark-border/40 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
          >
            <MentorRecommendationPanel
              currentUserId={user?._id}
              userInterests={user?.artInterests || []}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
