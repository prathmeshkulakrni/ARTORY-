import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, Share2, ZoomIn, ZoomOut, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import ReportButton from './ReportButton';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function ImageViewerModal({ isOpen, onClose, artwork, reportTargetType = 'artwork', onDeleted }) {
  const [zoom, setZoom] = useState(1);
  const [comment, setComment] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Support local state for likes/comments to immediately update UI
  const [liked, setLiked] = useState(artwork?.likes?.includes(user?._id));
  const [likeCount, setLikeCount] = useState(artwork?.likes?.length || 0);
  const [comments, setComments] = useState(artwork?.comments || []);

  // Hide the top navigation bar while the modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen || !artwork) return null;

  const artistId = artwork.artist?._id || artwork.artist;
  const canDelete = reportTargetType === 'artwork' && artistId === user?._id;
  const imgSrc = artwork.imageUrl?.startsWith('http') ? artwork.imageUrl : `${API_BASE}${artwork.imageUrl}`;
  const artistImg = artwork.artist?.profileImage
    ? (artwork.artist.profileImage.startsWith('http') ? artwork.artist.profileImage : `${API_BASE}${artwork.artist.profileImage}`)
    : null;

  const handleLike = async () => {
    try {
      const res = await api.post(`/artwork/${artwork._id}/like`);
      setLiked(res.data.liked);
      setLikeCount(res.data.likes);
    } catch (err) {
      toast.error('Failed to like');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const res = await api.post(`/artwork/${artwork._id}/comment`, { content: comment });
      setComments(prev => [...prev, res.data]);
      setComment('');
    } catch (err) {
      toast.error('Failed to comment');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/artwork/${artwork._id}`);
      toast.success('Post deleted');
      onDeleted?.(artwork._id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete post');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 backdrop-blur-xl p-4 md:p-8 animate-fade-in">
      <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white p-2 bg-white/10 rounded-full z-[70] transition-all hover:scale-110">
        <X size={24} />
      </button>

      <div className="flex flex-col md:flex-row w-full max-w-7xl h-full max-h-[90vh] bg-dark-card/90 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.6)] relative border border-white/5">
        {/* Left Side: Image with Zoom Controls */}
        <div className="flex-1 bg-black/20 relative flex items-center justify-center overflow-hidden group">
          <div className="absolute top-6 left-6 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <button onClick={() => setZoom(z => Math.min(z + 0.25, 3))} className="p-2.5 bg-dark-card/80 text-white rounded-xl hover:bg-primary transition-colors backdrop-blur-md border border-white/10">
              <ZoomIn size={18} />
            </button>
            <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} className="p-2.5 bg-dark-card/80 text-white rounded-xl hover:bg-primary transition-colors backdrop-blur-md border border-white/10">
              <ZoomOut size={18} />
            </button>
            <button onClick={() => setZoom(1)} className="p-2.5 bg-dark-card/80 text-white rounded-xl hover:bg-primary transition-colors backdrop-blur-md border border-white/10 text-[10px] font-black px-3">
              RESET
            </button>
          </div>
          
          <div className="w-full h-full overflow-auto flex items-center justify-center p-4 hide-scrollbar">
            <img 
              src={imgSrc} 
              alt={artwork.title} 
              className="max-w-full max-h-full object-contain transition-transform duration-300 ease-out shadow-2xl"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              draggable="false"
            />
          </div>
        </div>

        {/* Right Side: Details & Comments */}
        <div className="w-full md:w-[420px] bg-dark-card flex flex-col h-full border-l border-dark-border/40">
          {/* Header */}
          <div className="p-6 border-b border-dark-border/40 bg-surface/20">
            <div
              className="flex items-center gap-3 mb-5 cursor-pointer group rounded-2xl p-2 -mx-2 hover:bg-primary/5 transition-all duration-300"
              onClick={() => { if (artistId) { onClose(); navigate(`/profile/${artistId}`); } }}
              title="View artist profile"
            >
              <div className="relative shrink-0">
                {artistImg ? (
                  <img src={artistImg} className="w-11 h-11 rounded-full ring-2 ring-primary/20 group-hover:ring-primary transition-all object-cover" alt="" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-lg font-black text-primary group-hover:ring-2 group-hover:ring-primary transition-all border border-primary/30">
                    {artwork.artist?.username?.[0]?.toUpperCase() || 'A'}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-dark-card" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-white text-base group-hover:text-primary transition-colors truncate">{artwork.artist?.username}</h3>
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{new Date(artwork.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0">
                <ExternalLink size={11} />
                Profile
              </div>
            </div>
            
            <h2 className="text-xl font-black text-white mb-2 leading-tight">{artwork.title}</h2>
            {artwork.description && <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{artwork.description}</p>}
          </div>

          {/* Action Bar */}
          <div className="px-6 py-4 border-b border-dark-border/40 flex items-center justify-between bg-surface/10">
            <div className="flex gap-6">
              <button onClick={handleLike} className={`flex flex-col items-center gap-1 transition-all ${liked ? 'text-primary scale-110' : 'text-gray-500 hover:text-white'}`}>
                <Heart size={22} fill={liked ? 'currentColor' : 'none'} className="transition-transform active:scale-150" />
                <span className="text-[10px] font-bold">{likeCount}</span>
              </button>
              <div className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors cursor-pointer">
                <MessageCircle size={22} />
                <span className="text-[10px] font-bold">{comments.length}</span>
              </div>
              <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
                <Share2 size={22} />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Share</span>
              </button>
            </div>
            {canDelete && (
              <button onClick={handleDelete} className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Delete Artwork">
                <Trash2 size={20} />
              </button>
            )}
          </div>
          
          <div className="px-6 py-3 bg-surface/5">
            <ReportButton targetType={reportTargetType} targetId={artwork._id} compact />
          </div>

          {/* Comments Section */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-dark/20">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                <div className="w-16 h-16 rounded-3xl bg-surface flex items-center justify-center mb-4">
                  <MessageCircle size={32} />
                </div>
                <p className="text-sm font-bold text-white">No comments yet</p>
                <p className="text-xs text-gray-400 mt-1">Start the conversation!</p>
              </div>
            ) : (
              comments.map(c => (
                <div key={c._id || Math.random()} className="flex gap-3 group/comment">
                  <div className="w-9 h-9 rounded-full bg-surface border border-dark-border/50 flex-shrink-0 flex items-center justify-center text-xs font-black text-primary overflow-hidden">
                    {c.author?.profileImage ? <img src={c.author.profileImage.startsWith('http') ? c.author.profileImage : `${API_BASE}${c.author.profileImage}`} className="w-full h-full object-cover" alt="" /> : (c.author?.username?.[0]?.toUpperCase() || 'U')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-surface/50 p-3 rounded-2xl rounded-tl-none border border-dark-border/30 group-hover/comment:border-primary/20 transition-colors">
                      <span className="font-bold text-primary text-[13px] block mb-0.5 cursor-pointer hover:underline" onClick={() => { onClose(); navigate(`/profile/${c.author?._id}`); }}>
                        {c.author?.username}
                      </span>
                      <p className="text-sm text-gray-300 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <div className="p-6 border-t border-dark-border/40 bg-surface/20">
            <form onSubmit={handleComment} className="flex gap-3">
              <input 
                value={comment} 
                onChange={e => setComment(e.target.value)} 
                placeholder="Write a comment..." 
                className="w-full bg-dark/50 border border-dark-border/50 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all" 
              />
              <button type="submit" disabled={!comment.trim()} className="bg-gradient-to-r from-primary to-accent text-white font-bold px-5 py-2 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all">
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
