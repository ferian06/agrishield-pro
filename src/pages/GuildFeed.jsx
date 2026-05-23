import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, BadgeCheck, Plus, X, Loader2, ImagePlus, Camera, Send } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { communityService } from '../services/communityService';

const TAG_STYLES = {
  red:   'bg-red-50   text-red-600   border-red-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
  green: 'bg-green-50 text-green-600 border-green-200',
};

const AVATAR_COLORS = ['bg-violet-500', 'bg-orange-500', 'bg-emerald-500', 'bg-blue-500', 'bg-pink-500', 'bg-teal-500'];

function normalizePost(p) {
  const initials = (p.author_name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const tagColor = p.tag === 'All Clear' ? 'green' : p.tag === 'Early Blight' ? 'red' : 'amber';
  return {
    id: p.id,
    author: p.author_name || 'Farmer',
    initials,
    avatarBg: AVATAR_COLORS[p.author_id % AVATAR_COLORS.length],
    location: 'Community',
    time: new Date(p.created_at).toLocaleDateString(),
    content: p.content,
    tag: p.tag || 'Finding',
    tagColor,
    verified: false,
    confidence: null,
    likes: Number(p.likes),
    comments: Number(p.comment_count),
    liked: Boolean(p.liked_by_me),
    image: p.image_data || null,
  };
}

// ─── Post card ────────────────────────────────────────────────────────────────
function PostCard({ post, onLike }) {
  const tagStyle = TAG_STYLES[post.tagColor] || TAG_STYLES.green;
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]         = useState([]);
  const [loadingCmts, setLoadingCmts]   = useState(false);
  const [commentText, setCommentText]   = useState('');
  const [sending, setSending]           = useState(false);
  const [localCount, setLocalCount]     = useState(post.comments);

  const [commentError, setCommentError] = useState('');

  const openComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setShowComments(true);
    setLoadingCmts(true);
    try {
      const { comments: c } = await communityService.getComments(post.id);
      setComments(c || []);
    } catch {
      setComments([]);
    } finally {
      setLoadingCmts(false);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim() || sending) return;
    setSending(true);
    setCommentError('');
    try {
      const { comment } = await communityService.addComment(post.id, commentText.trim());
      setComments(prev => [...prev, comment]);
      setLocalCount(c => c + 1);
      setCommentText('');
    } catch {
      setCommentError('Could not post comment. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Author row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full ${post.avatarBg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
            {post.initials}
          </div>
          <div>
            <p className="font-bold text-sm text-slate-800 leading-tight">{post.author}</p>
            <p className="text-[10px] text-slate-400">{post.location} · {post.time}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold border rounded-full px-2.5 py-1 ${tagStyle}`}>
          {post.tag}
        </span>
      </div>

      {/* Content */}
      <p className="text-sm text-slate-700 leading-relaxed px-4 pb-3">{post.content}</p>

      {/* Image */}
      {post.image && (
        <img src={post.image} alt="Finding" className="w-full h-44 object-cover" />
      )}

      {/* AI verified badge + engagement */}
      <div className="flex items-center justify-between px-4 py-3">
        {post.verified ? (
          <div className="flex items-center gap-1.5 text-brand-mint">
            <BadgeCheck size={14} />
            <span className="text-[10px] font-bold">AI Verified · {post.confidence}%</span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-300">Unverified finding</span>
        )}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
              post.liked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'
            }`}
          >
            <Heart size={15} fill={post.liked ? 'currentColor' : 'none'} />
            {post.likes}
          </button>
          <button
            onClick={openComments}
            className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
              showComments ? 'text-forest-mid' : 'text-slate-400 hover:text-forest-mid'
            }`}
          >
            <MessageCircle size={15} />
            {localCount}
          </button>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-slate-50 px-4 pb-4 pt-3 space-y-3">
          {loadingCmts ? (
            <div className="flex justify-center py-2">
              <Loader2 size={16} className="animate-spin text-slate-400" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-1">No comments yet — be the first!</p>
          ) : (
            <div className="space-y-2">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 flex-shrink-0">
                    {(c.author_name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="bg-slate-50 rounded-xl px-3 py-2 flex-1">
                    <p className="text-[10px] font-bold text-slate-600">{c.author_name}</p>
                    <p className="text-xs text-slate-700 mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Comment input */}
          {commentError && (
            <p className="text-[10px] text-red-500 text-center -mt-1">{commentError}</p>
          )}
          <div className="flex gap-2 mt-2">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitComment()}
              placeholder="Add a comment…"
              className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-forest-mid transition-colors"
            />
            <button
              onClick={submitComment}
              disabled={!commentText.trim() || sending}
              className="w-9 h-9 bg-forest-mid disabled:opacity-40 rounded-xl flex items-center justify-center flex-shrink-0"
            >
              {sending ? <Loader2 size={14} className="animate-spin text-white" /> : <Send size={14} className="text-white" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Share finding modal ──────────────────────────────────────────────────────
function ShareModal({ onClose, onSubmit }) {
  const [text, setText]       = useState('');
  const [tag, setTag]         = useState('Early Blight');
  const [photo, setPhoto]     = useState(null); // base64 data URL
  const [busy, setBusy]       = useState(false);
  const galleryRef            = useRef(null);
  const cameraRef             = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setPhoto(e.target.result);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const { post: saved } = await communityService.createPost({
        content: text.trim(),
        tag,
        imageData: photo || undefined,
      });
      onSubmit(normalizePost(saved));
    } catch {
      onSubmit({
        id: Date.now(),
        author: 'You', initials: 'ME', avatarBg: 'bg-forest-mid',
        location: 'Your Farm', time: 'Just now',
        content: text.trim(), tag,
        tagColor: tag === 'All Clear' ? 'green' : tag === 'Early Blight' ? 'red' : 'amber',
        verified: false, confidence: null,
        likes: 0, comments: 0, liked: false,
        image: photo || null,
      });
    }
    setBusy(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md mx-auto rounded-t-[28px] p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-syne font-extrabold text-lg text-slate-800">Share a Finding</h3>
          <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Describe what you observed in your field…"
          rows={3}
          className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl resize-none outline-none focus:border-forest-mid transition-colors"
        />

        {/* Photo preview */}
        {photo && (
          <div className="relative mt-3">
            <img src={photo} alt="Preview" className="w-full h-36 object-cover rounded-xl" />
            <button
              onClick={() => setPhoto(null)}
              className="absolute top-2 right-2 bg-black/60 text-white w-7 h-7 rounded-full flex items-center justify-center"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Photo buttons */}
        {!photo && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => galleryRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <ImagePlus size={15} />
              Add Photo
            </button>
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <Camera size={15} />
              Take Photo
            </button>
            <input ref={galleryRef} type="file" accept="image/*" className="hidden"
              onChange={e => handleFile(e.target.files[0])} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => handleFile(e.target.files[0])} />
          </div>
        )}

        <select
          value={tag}
          onChange={e => setTag(e.target.value)}
          className="w-full mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none appearance-none"
        >
          <option>Early Blight</option>
          <option>Common Rust</option>
          <option>Late Blight</option>
          <option>Leaf Spot</option>
          <option>Leaf Curl</option>
          <option>Powdery Mildew</option>
          <option>All Clear</option>
          <option>Other</option>
        </select>

        <button
          onClick={submit}
          disabled={!text.trim() || busy}
          className="mt-4 w-full bg-forest-mid disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : null}
          Post to Guild Feed
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function GuildFeed() {
  const { guildPosts, setGuildPosts, toggleLike, addPost, scanHistory } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    communityService.getPosts()
      .then(({ posts }) => setGuildPosts((posts || []).map(normalizePost)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLike = async (postId) => {
    toggleLike(postId); // optimistic local update
    communityService.likePost(postId).catch(() => {}); // fire-and-forget
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-forest-mid" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">

        {/* Mission banner */}
        <div className="bg-forest-mid text-white p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute w-40 h-40 rounded-full bg-brand-mint/15 -top-12 -right-12 pointer-events-none" />
          <p className="text-[10px] font-bold text-brand-mint uppercase tracking-widest mb-1">Our Mission</p>
          <p className="text-sm leading-relaxed text-green-100">
            A community-driven, AI-powered platform empowering smallholder farmers through
            collaborative intelligence and offline-first diagnostics.
          </p>
        </div>

        {/* Feed header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Community Findings</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-forest-mid text-white text-xs font-bold px-3 py-1.5 rounded-full"
          >
            <Plus size={13} />
            Share
          </button>
        </div>

        {/* Posts */}
        {guildPosts.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-3xl mb-3">🌱</p>
            <p className="font-bold text-sm text-slate-500">No findings yet</p>
            <p className="text-xs mt-1">Be the first to share a field observation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {guildPosts.map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike} />
            ))}
          </div>
        )}

        {/* Recent scans from this user */}
        {scanHistory.length > 0 && (
          <div>
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Your Recent Scans</h2>
            <div className="space-y-2">
              {scanHistory.slice(0, 3).map(scan => (
                <div key={scan.id} className="bg-white rounded-2xl flex items-center gap-3 p-3 border border-slate-100">
                  {scan.bg && (
                    <div
                      className="w-12 h-12 rounded-xl flex-shrink-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${scan.bg})` }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate">{scan.crop}</p>
                    <p className="text-xs text-slate-400 truncate">{scan.disease} · {scan.date}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    scan.severity === 'danger' || scan.severity === 'warning'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-green-50 text-green-600'
                  }`}>
                    {scan.severity === 'danger' || scan.severity === 'warning' ? '⚠ Risk' : '✓ OK'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <ShareModal onClose={() => setShowModal(false)} onSubmit={addPost} />
      )}
    </>
  );
}
