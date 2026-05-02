import React, { useState } from 'react';
import { X, Heart, MessageCircle, Share2, ZoomIn, ZoomOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import ReportButton from './ReportButton';

const API_BASE = 'http://localhost:5000';

export default function ImageViewerModal({ isOpen, onClose, artwork, reportTargetType = 'artwork' }) {
  const [zoom, setZoom] = useState(1);
  const [comment, setComment] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Support local state for likes/comments to immediately update UI
  const [liked, setLiked] = useState(artwork?.likes?.includes(user?._id));
  const [likeCount, setLikeCount] = useState(artwork?.likes?.length || 0);
  const [comments, setComments] = useState(artwork?.comments || []);

  if (!isOpen || !artwork) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8 animate-fade-in">
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-2 bg-black/50 rounded-full z-50">
        <X size={24} />
      </button>

      <div className="flex flex-col md:flex-row w-full max-w-7xl h-full max-h-[90vh] bg-[#1a1b1e] rounded-2xl overflow-hidden shadow-2xl relative border border-dark-border">
        {/* Left Side: Image with Zoom Controls */}
        <div className="flex-1 bg-black/50 relative flex items-center justify-center overflow-hidden group">
          <div className="absolute top-4 left-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setZoom(z => Math.min(z + 0.25, 3))} className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 backdrop-blur-md">
              <ZoomIn size={20} />
            </button>
            <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 backdrop-blur-md">
              <ZoomOut size={20} />
            </button>
            <button onClick={() => setZoom(1)} className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 backdrop-blur-md text-xs font-bold px-3 flex items-center justify-center">
              100%
            </button>
          </div>
          <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
            <img 
              src={imgSrc} 
              alt={artwork.title} 
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              draggable="false"
            />
          </div>
        </div>

        {/* Right Side: Details & Comments */}
        <div className="w-full md:w-[400px] bg-[#1a1b1e] flex flex-col h-full border-l border-dark-border">
          {/* Header */}
          <div className="p-5 border-b border-dark-border">
            <div className="flex items-center gap-3 mb-4 cursor-pointer group" onClick={() => { onClose(); navigate(`/profile/${artwork.artist._id}`); }}>
              {artistImg ? (
                <img src={artistImg} className="w-12 h-12 avatar group-hover:ring-2 ring-primary transition-all" alt="" />
              ) : (
                <div className="w-12 h-12 avatar bg-primary/30 flex items-center justify-center text-lg font-bold text-primary group-hover:ring-2 ring-primary transition-all">
                  {artwork.artist?.username?.[0]?.toUpperCase() || 'A'}
                </div>
              )}
              <div>
                <h3 className="font-bold text-white group-hover:text-primary transition-colors">{artwork.artist?.username}</h3>
                <p className="text-xs text-gray-500">{new Date(artwork.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">{artwork.title}</h2>
            {artwork.description && <p className="text-sm text-gray-400">{artwork.description}</p>}
          </div>

          {/* Action Bar */}
          <div className="p-4 border-b border-dark-border flex items-center justify-around">
            <button onClick={handleLike} className={`flex flex-col items-center gap-1 transition-colors ${liked ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>
              <Heart size={24} fill={liked ? 'currentColor' : 'none'} className={liked ? 'animate-bounce-short' : ''} />
              <span className="text-xs font-semibold">{likeCount}</span>
            </button>
            <div className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
              <MessageCircle size={24} />
              <span className="text-xs font-semibold">{comments.length}</span>
            </div>
            <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
              <Share2 size={24} />
              <span className="text-xs font-semibold">Share</span>
            </button>
          </div>
          <div className="px-4 pb-3">
            <ReportButton targetType={reportTargetType} targetId={artwork._id} compact />
          </div>

          {/* Comments Section */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {comments.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p className="text-3xl mb-2">💭</p>
                <p className="text-sm">Be the first to comment!</p>
              </div>
            ) : (
              comments.map(c => (
                <div key={c._id || Math.random()} className="flex gap-3">
                  <div className="w-8 h-8 avatar bg-dark-border flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-400">
                    {c.author?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="bg-[#2a2b2f] p-3 rounded-2xl rounded-tl-none">
                      <span className="font-semibold text-primary text-sm block mb-1 cursor-pointer hover:underline" onClick={() => { onClose(); navigate(`/profile/${c.author?._id}`); }}>
                        {c.author?.username}
                      </span>
                      <p className="text-sm text-gray-300">{c.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <div className="p-4 border-t border-dark-border bg-[#1a1b1e]">
            <form onSubmit={handleComment} className="flex gap-2">
              <input 
                value={comment} 
                onChange={e => setComment(e.target.value)} 
                placeholder="Add a comment..." 
                className="input py-2.5 flex-1 text-sm bg-[#2a2b2f] border-transparent focus:bg-[#2a2b2f] focus:border-primary" 
              />
              <button type="submit" disabled={!comment.trim()} className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
