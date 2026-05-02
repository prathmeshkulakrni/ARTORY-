import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { Send, Bot, User, Sparkles, BookOpen, PlayCircle, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function AIMentor() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([{ role: 'ai', text: "Hi! I'm Aria, your AI art mentor. Ask me anything about art techniques, get feedback on your work, or start a learning path!" }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [learningPath, setLearningPath] = useState(null);
  const [tutorials, setTutorials] = useState([]);
  const [showTutorials, setShowTutorials] = useState(false);
  const [tutorialForm, setTutorialForm] = useState({ title: '', description: '', videoUrl: '' });
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);
    try {
      const r = await api.post('/ai/mentor', { message: userMsg });
      setMessages(prev => [...prev, { role: 'ai', text: r.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble responding. Please try again." }]);
    }
    setLoading(false);
  };

  const loadPath = async (level) => {
    try {
      const r = await api.get(`/ai/learning-path?level=${level}`);
      setLearningPath(r.data);
    } catch {
      toast.error('Failed');
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
      toast.success('Tutorial uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload tutorial');
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)] animate-fade-in">
      <div className="flex-1 flex flex-col card p-0 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-dark-border bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center"><Bot size={22} className="text-primary"/></div>
          <div><p className="font-bold text-white">Aria - AI Mentor</p><p className="text-xs text-gray-400">Powered by AI</p></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`flex gap-2 max-w-lg ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${m.role === 'ai' ? 'bg-primary/20' : 'bg-accent/20'}`}>
                  {m.role === 'ai' ? <Bot size={16} className="text-primary"/> : <User size={16} className="text-accent"/>}
                </div>
                <div className={`px-4 py-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-primary text-white rounded-br-md' : 'bg-surface text-gray-200 rounded-bl-md'}`}>{m.text}</div>
              </div>
            </div>
          ))}
          {loading && <div className="flex gap-2"><div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><Bot size={16} className="text-primary"/></div><div className="bg-surface rounded-2xl px-4 py-3 flex gap-1"><span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/><span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/><span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/></div></div>}
          <div ref={endRef}/>
        </div>
        <form onSubmit={send} className="p-4 border-t border-dark-border flex gap-3">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about art techniques..." className="input flex-1 py-2.5"/>
          <button type="submit" disabled={loading} className="btn-primary px-4"><Send size={18}/></button>
        </form>
      </div>

      <div className="w-80 space-y-4 overflow-y-auto">
        <div className="card">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Sparkles size={18} className="text-primary"/> Quick Actions</h3>
          <div className="space-y-2">
            {['How to start with digital art?','Tips for better composition','Explain color theory basics','How to develop my art style?'].map((q,i)=>(
              <button key={i} onClick={()=>setInput(q)} className="w-full text-left text-sm text-gray-400 hover:text-white p-2 rounded-lg hover:bg-surface transition-colors">{q}</button>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2"><BookOpen size={18} className="text-primary"/> Learning Paths</h3>
          <div className="space-y-2">
            <button onClick={()=>loadPath('beginner')} className="w-full text-left text-sm p-3 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">Beginner Path</button>
            <button onClick={()=>loadPath('intermediate')} className="w-full text-left text-sm p-3 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">Intermediate Path</button>
            <button onClick={loadTutorials} className="w-full text-left text-sm p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-2"><PlayCircle size={16} /> See Beginner Video Tutorials</button>
          </div>
          {learningPath && (
            <div className="mt-4 space-y-3 animate-fade-in">
              {learningPath.map((w,i)=>(
                <div key={i} className="border-l-2 border-primary pl-3">
                  <p className="text-xs text-primary mb-1">Week {w.week}</p>
                  <p className="text-sm font-medium text-white">{w.title}</p>
                  <ul className="text-xs text-gray-400 mt-1">{w.tasks.map((t,j)=><li key={j}>- {t}</li>)}</ul>
                </div>
              ))}
            </div>
          )}
        </div>
        {(user?.isVerified || user?.role === 'admin') && (
          <div className="card">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Upload size={18} className="text-primary"/> Upload Tutorial</h3>
            <form onSubmit={createTutorial} className="space-y-3">
              <input value={tutorialForm.title} onChange={(e) => setTutorialForm({ ...tutorialForm, title: e.target.value })} className="input" placeholder="Tutorial title" required />
              <textarea value={tutorialForm.description} onChange={(e) => setTutorialForm({ ...tutorialForm, description: e.target.value })} className="input h-20 resize-none" placeholder="Short description" />
              <input value={tutorialForm.videoUrl} onChange={(e) => setTutorialForm({ ...tutorialForm, videoUrl: e.target.value })} className="input" placeholder="Video URL" required />
              <button type="submit" className="btn-primary w-full">Upload Video</button>
            </form>
          </div>
        )}
        {showTutorials && (
          <div className="card">
            <h3 className="font-bold text-white mb-3">Beginner Tutorials</h3>
            <div className="space-y-3">
              {tutorials.length === 0 ? <p className="text-sm text-gray-400">No tutorials yet.</p> : tutorials.map((tutorial) => (
                <a key={tutorial._id} href={tutorial.videoUrl} target="_blank" rel="noreferrer" className="block p-3 rounded-xl border border-dark-border hover:border-primary/40">
                  <p className="font-semibold text-white">{tutorial.title}</p>
                  <p className="text-sm text-gray-400 mt-1">{tutorial.description || 'Beginner tutorial'}</p>
                  <p className="text-xs text-primary mt-2">by {tutorial.creator?.username}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
