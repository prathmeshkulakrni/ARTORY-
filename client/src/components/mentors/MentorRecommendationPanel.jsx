import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Users, Brain, RefreshCw, AlertCircle, Wand2 } from 'lucide-react';
import { recommendMentors } from '../../services/mentorService';
import MentorCard from './MentorCard';
import MentorProfileModal from './MentorProfileModal';
import toast from 'react-hot-toast';

// ─── Preset interest chips ────────────────────────────────────────────────────
const PRESET_INTERESTS = [
  { label: 'Anime Art', query: 'I want to learn anime and manga character design' },
  { label: 'Watercolor', query: 'Who can teach me watercolor painting techniques?' },
  { label: 'Cyberpunk UI', query: 'Suggest mentors for cyberpunk and dark digital art' },
  { label: 'Oil Painting', query: 'Find me classical oil painting mentors' },
  { label: 'Concept Art', query: 'I want to become a professional concept artist for games' },
  { label: '3D Sculpting', query: 'Who can teach ZBrush and 3D character sculpting?' },
  { label: 'Dark Fantasy', query: 'I want to learn dark fantasy creature design' },
  { label: 'Illustration', query: 'Looking for children\'s book illustration mentors' },
];

// ─── Skeleton Loading Card ────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-dark-card border border-dark-border/40 rounded-[1.75rem] p-6 animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-surface/60" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-surface/60 rounded-lg w-3/4" />
          <div className="h-3 bg-surface/40 rounded-lg w-1/2" />
          <div className="h-3 bg-surface/40 rounded-lg w-1/3" />
        </div>
      </div>
      <div className="h-3 bg-surface/40 rounded-lg mb-2" />
      <div className="h-3 bg-surface/40 rounded-lg w-4/5 mb-4" />
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 mb-4">
        <div className="h-2 bg-surface/60 rounded mb-2 w-1/3" />
        <div className="h-3 bg-surface/40 rounded w-full" />
      </div>
      <div className="flex gap-2 mb-5">
        {[1, 2, 3].map((i) => <div key={i} className="h-5 w-16 bg-surface/60 rounded-full" />)}
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-9 bg-surface/60 rounded-xl" />
        <div className="flex-[1.5] h-9 bg-primary/20 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-20 h-20 rounded-[1.5rem] bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
        <Users size={36} className="text-primary/50" />
      </div>
      <h3 className="text-lg font-black text-white mb-2">No Mentors Found</h3>
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{message || 'Try a different search query to discover your perfect art mentor.'}</p>
    </motion.div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <AlertCircle size={28} className="text-red-400" />
      </div>
      <h3 className="text-base font-black text-white mb-2">AI Recommendation Failed</h3>
      <p className="text-sm text-gray-500 mb-5 max-w-xs">{message || 'Something went wrong. Please try again.'}</p>
      <button onClick={onRetry} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-black hover:bg-primary/20 transition-all">
        <RefreshCw size={14} /> Try Again
      </button>
    </motion.div>
  );
}

// ─── MentorRecommendationPanel (main export) ──────────────────────────────────
export default function MentorRecommendationPanel({ currentUserId, userInterests = [] }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [lastQuery, setLastQuery] = useState('');
  const [error, setError] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);

  const runSearch = useCallback(async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) { toast.error('Please describe what you want to learn'); return; }

    setLoading(true);
    setError(null);
    setRecommendations(null);
    setLastQuery(q.trim());

    try {
      const data = await recommendMentors(q.trim(), userInterests);
      setRecommendations(data.recommendations);
      if (data.recommendations.length === 0) {
        toast('No mentor matches found. Try a different query.', { icon: '🎨' });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'AI recommendation failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [query, userInterests]);

  const handleSubmit = (e) => { e.preventDefault(); runSearch(); };

  const handlePreset = (preset) => {
    setQuery(preset.query);
    runSearch(preset.query);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Section */}
      <div className="flex-shrink-0 space-y-5 mb-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/30 flex items-center justify-center">
            <Brain size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="font-black text-white text-sm">AI Mentor Finder</h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Powered by Gemini 2.5 Flash</p>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-surface/40 flex items-center justify-center">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "I want to learn anime character design"'
            className="w-full bg-dark/60 border-2 border-dark-border/50 rounded-2xl pl-14 pr-32 py-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-dark transition-all shadow-inner"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/30 disabled:opacity-30 transition-all active:scale-95"
          >
            {loading ? <RefreshCw size={13} className="animate-spin" /> : <Wand2 size={13} />}
            {loading ? 'Finding...' : 'Find'}
          </button>
        </form>

        {/* Preset Interest Chips */}
        <div>
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3">Quick searches</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_INTERESTS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePreset(preset)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface/40 border border-dark-border/50 text-[10px] font-black text-gray-400 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-40"
              >
                <Sparkles size={10} />
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {/* Results header */}
        {(recommendations || loading) && (
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                {loading ? 'AI is analyzing mentors...' : `${recommendations?.length ?? 0} mentors matched`}
              </p>
              {lastQuery && !loading && (
                <p className="text-xs text-gray-400 mt-0.5">
                  For: <span className="text-primary font-bold">"{lastQuery}"</span>
                </p>
              )}
            </div>
            {!loading && recommendations?.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <Brain size={11} className="text-primary" />
                <span className="text-[9px] font-black text-primary uppercase tracking-widest">Gemini Ranked</span>
              </div>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Skeleton Loading */}
          {loading && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
            >
              {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
            </motion.div>
          )}

          {/* Error State */}
          {!loading && error && (
            <motion.div key="error" className="grid grid-cols-1">
              <ErrorState message={error} onRetry={() => runSearch(lastQuery)} />
            </motion.div>
          )}

          {/* Results Grid */}
          {!loading && !error && recommendations !== null && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
            >
              {recommendations.length === 0
                ? <EmptyState />
                : recommendations.map((rec, i) => (
                    <MentorCard
                      key={rec.mentor._id || i}
                      mentor={rec.mentor}
                      matchReason={rec.matchReason}
                      matchPercentage={rec.matchPercentage}
                      onViewProfile={setSelectedMentor}
                      currentUserId={currentUserId}
                    />
                  ))
              }
            </motion.div>
          )}

          {/* Initial State - before first search */}
          {!loading && !error && recommendations === null && (
            <motion.div
              key="initial"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(124,58,237,0.2)]"
              >
                <Brain size={44} className="text-primary/70" />
              </motion.div>
              <h3 className="text-xl font-black text-white mb-3">Find Your Perfect Art Mentor</h3>
              <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-2">
                Describe your art goals in plain language. Our AI will semantically match you with the best mentors.
              </p>
              <p className="text-xs text-gray-600 font-bold">
                Try: <span className="text-primary">"I want to learn dark fantasy creature design"</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mentor Profile Modal */}
      <AnimatePresence>
        {selectedMentor && (
          <MentorProfileModal
            data={selectedMentor}
            onClose={() => setSelectedMentor(null)}
            currentUserId={currentUserId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
