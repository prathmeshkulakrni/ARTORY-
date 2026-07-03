import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Clock, Users, ExternalLink, BookOpen, UserPlus, UserCheck, Zap } from 'lucide-react';
import { followMentor } from '../../services/mentorService';
import toast from 'react-hot-toast';

// ─── Helpers ────────────────────────────────────────────────────────────────

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={11}
          className={s <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700 fill-gray-700'}
        />
      ))}
      <span className="text-[10px] font-black text-yellow-400 ml-1">{rating?.toFixed(1)}</span>
    </div>
  );
}

function TagPill({ tag, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary/10 text-primary/90 border-primary/20',
    accent: 'bg-accent/10 text-accent/90 border-accent/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${colors[color] || colors.primary}`}>
      {tag}
    </span>
  );
}

const TAG_COLORS = ['primary', 'accent', 'cyan', 'pink'];

// ─── Match Percentage Badge ──────────────────────────────────────────────────
function MatchBadge({ pct }) {
  const color = pct >= 85 ? 'from-emerald-500 to-teal-500' : pct >= 70 ? 'from-primary to-accent' : 'from-yellow-500 to-orange-500';
  return (
    <div className={`absolute -top-2 -right-2 w-11 h-11 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shadow-lg z-10`}>
      <span className="text-[10px] font-black text-white leading-none text-center">
        {pct}
        <br />
        <span style={{ fontSize: 7 }}>%</span>
      </span>
    </div>
  );
}

// ─── MentorCard ─────────────────────────────────────────────────────────────

export default function MentorCard({ mentor, matchReason, matchPercentage, onViewProfile, currentUserId }) {
  const [following, setFollowing] = useState(
    mentor.followers?.some((f) => (f._id || f)?.toString() === currentUserId?.toString()) ?? false
  );
  const [followerCount, setFollowerCount] = useState(mentor.followers?.length ?? 0);
  const [followLoading, setFollowLoading] = useState(false);

  const handleFollow = async (e) => {
    e.stopPropagation();
    setFollowLoading(true);
    try {
      const res = await followMentor(mentor._id);
      setFollowing(res.following);
      setFollowerCount(res.followerCount);
      toast.success(res.following ? `Following ${mentor.name}!` : `Unfollowed ${mentor.name}`);
    } catch {
      toast.error('Could not update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const visibleTags = mentor.tags?.slice(0, 3) ?? [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      onClick={() => onViewProfile({ mentor, matchReason, matchPercentage })}
      className="relative bg-dark-card border border-dark-border/60 rounded-[1.75rem] overflow-hidden cursor-pointer group
                 hover:border-primary/40 hover:shadow-[0_0_32px_rgba(124,58,237,0.18)] transition-all duration-300"
    >
      {/* Top glow bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Match percentage badge (only shown in recommendation mode) */}
      {matchPercentage !== undefined && <MatchBadge pct={matchPercentage} />}

      <div className="p-6">
        {/* Header: avatar + name + rating */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-primary/30 group-hover:border-primary/60 transition-colors shadow-lg">
              {mentor.profileImage ? (
                <img src={mentor.profileImage} alt={mentor.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/40 to-accent/30 flex items-center justify-center">
                  <span className="text-white font-black text-lg">{mentor.name[0]}</span>
                </div>
              )}
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-dark-card rounded-full" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-black text-white text-sm leading-tight truncate group-hover:text-primary transition-colors">
              {mentor.name}
            </h3>
            <StarRating rating={mentor.rating} />
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-[10px] text-gray-500 font-bold">
                <Clock size={10} /> {mentor.experience}y exp
              </span>
              <span className="flex items-center gap-1 text-[10px] text-gray-500 font-bold">
                <Users size={10} /> {followerCount}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 mb-4">
          {mentor.bio}
        </p>

        {/* AI Match Reason */}
        {matchReason && (
          <div className="bg-primary/8 border border-primary/15 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={10} className="text-primary" />
              <span className="text-[9px] font-black text-primary uppercase tracking-widest">AI Match</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">{matchReason}</p>
          </div>
        )}

        {/* Tags */}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {visibleTags.map((tag, i) => (
              <TagPill key={tag} tag={tag} color={TAG_COLORS[i % TAG_COLORS.length]} />
            ))}
            {mentor.tags?.length > 3 && (
              <span className="text-[9px] text-gray-600 font-black self-center">+{mentor.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 border
              ${following
                ? 'bg-primary/10 border-primary/30 text-primary hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                : 'bg-surface/40 border-dark-border/60 text-gray-400 hover:border-primary/40 hover:text-white'
              } disabled:opacity-40`}
          >
            {following ? <UserCheck size={12} /> : <UserPlus size={12} />}
            {following ? 'Following' : 'Follow'}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onViewProfile({ mentor, matchReason, matchPercentage }); }}
            className="flex-[1.5] flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest
                       bg-gradient-to-r from-primary to-accent text-white
                       hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            <BookOpen size={12} /> Start Learning
          </button>
        </div>
      </div>
    </motion.div>
  );
}
