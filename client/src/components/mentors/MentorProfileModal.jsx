import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Star, Clock, Users, ExternalLink, BookOpen,
  UserPlus, UserCheck, Zap, Globe,
  Award, Tag, CheckCircle2, Link2, Video
} from 'lucide-react';
import { followMentor } from '../../services/mentorService';
import toast from 'react-hot-toast';

function StarRating({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={size} className={s <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700 fill-gray-700'} />
      ))}
      <span className="text-sm font-black text-yellow-400 ml-1">{rating?.toFixed(1)}</span>
    </div>
  );
}

const SOCIAL_ICONS = {
  instagram: { Icon: Link2, color: 'text-pink-400 hover:text-pink-300', label: 'Instagram' },
  twitter: { Icon: Link2, color: 'text-blue-400 hover:text-blue-300', label: 'Twitter' },
  website: { Icon: Globe, color: 'text-emerald-400 hover:text-emerald-300', label: 'Website' },
  youtube: { Icon: Video, color: 'text-red-400 hover:text-red-300', label: 'YouTube' },
};

export default function MentorProfileModal({ data, onClose, currentUserId }) {
  const { mentor, matchReason, matchPercentage } = data;
  const [following, setFollowing] = useState(
    mentor.followers?.some((f) => (f._id || f)?.toString() === currentUserId?.toString()) ?? false
  );
  const [followerCount, setFollowerCount] = useState(mentor.followers?.length ?? 0);
  const [followLoading, setFollowLoading] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleFollow = async () => {
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

  const socialEntries = Object.entries(mentor.socialLinks || {}).filter(([, val]) => val);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        {/* Modal Panel */}
        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 60, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl bg-dark-card border border-dark-border/60 rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto hide-scrollbar"
        >
          {/* Header gradient strip */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-accent to-pink-500" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-10 w-9 h-9 rounded-xl bg-surface/60 border border-dark-border/60 flex items-center justify-center text-gray-400 hover:text-white hover:border-primary/40 transition-all"
          >
            <X size={16} />
          </button>

          {/* Profile Header */}
          <div className="relative px-8 pt-10 pb-6 bg-gradient-to-b from-primary/8 to-transparent">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-[1.25rem] overflow-hidden border-2 border-primary/40 shadow-[0_0_24px_rgba(124,58,237,0.35)]">
                  {mentor.profileImage ? (
                    <img src={mentor.profileImage} alt={mentor.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/60 to-accent/40 flex items-center justify-center">
                      <span className="text-white font-black text-3xl">{mentor.name[0]}</span>
                    </div>
                  )}
                </div>
                {/* Online dot */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-dark-card rounded-full" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-black text-white text-xl leading-tight">{mentor.name}</h2>
                  <CheckCircle2 size={16} className="text-primary flex-shrink-0" />
                </div>
                <StarRating rating={mentor.rating} />
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs text-gray-400 font-bold">
                    <Clock size={12} /> {mentor.experience} years exp
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400 font-bold">
                    <Users size={12} /> {followerCount} followers
                  </span>
                  {mentor.reviewCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-400 font-bold">
                      <Award size={12} /> {mentor.reviewCount} reviews
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Social Links */}
            {socialEntries.length > 0 && (
              <div className="flex items-center gap-3 mt-4">
                {socialEntries.map(([platform, url]) => {
                  const { Icon, color, label } = SOCIAL_ICONS[platform] || {};
                  if (!Icon) return null;
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      title={label}
                      className={`${color} transition-colors`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Icon size={18} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-8 pb-8 space-y-6">
            {/* AI Match Reason */}
            {matchReason && (
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-primary" />
                    <span className="text-xs font-black text-primary uppercase tracking-widest">AI Match Reason</span>
                  </div>
                  {matchPercentage !== undefined && (
                    <div className="bg-gradient-to-r from-primary to-accent px-3 py-1 rounded-full">
                      <span className="text-[11px] font-black text-white">{matchPercentage}% match</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{matchReason}</p>
              </div>
            )}

            {/* Bio */}
            <div>
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">About</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{mentor.bio}</p>
            </div>

            {/* Teaching Categories */}
            {mentor.teachingCategories?.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Teaching</h3>
                <div className="flex flex-wrap gap-2">
                  {mentor.teachingCategories.map((cat) => (
                    <span key={cat} className="bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {mentor.skills?.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Tag size={11} /> Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mentor.skills.map((skill) => (
                    <span key={skill} className="bg-surface/60 border border-dark-border/60 text-gray-300 text-[10px] font-bold px-3 py-1.5 rounded-xl">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {mentor.tags?.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {mentor.tags.map((tag, i) => {
                    const colors = [
                      'bg-primary/10 border-primary/20 text-primary/90',
                      'bg-accent/10 border-accent/20 text-accent/90',
                      'bg-pink-500/10 border-pink-500/20 text-pink-400',
                      'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
                    ];
                    return (
                      <span key={tag} className={`text-[9px] font-black uppercase tracking-widest border px-2.5 py-1 rounded-full ${colors[i % colors.length]}`}>
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border
                  ${following
                    ? 'bg-primary/10 border-primary/30 text-primary hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                    : 'bg-surface/40 border-dark-border/60 text-gray-300 hover:border-primary/40 hover:text-white'
                  } disabled:opacity-40`}
              >
                {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
                {following ? 'Following' : 'Follow'}
              </button>
              <button className="flex-[1.5] flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-primary to-accent text-white hover:shadow-[0_0_24px_rgba(124,58,237,0.5)] hover:scale-[1.02] active:scale-95 transition-all">
                <BookOpen size={14} /> Start Learning
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
