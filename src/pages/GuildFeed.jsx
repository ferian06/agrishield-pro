import React, { useState } from 'react';
import { Heart, MessageCircle, BadgeCheck, Plus, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { communityService } from '../services/communityService';

const TAG_STYLES = {
  red:   'bg-red-50   text-red-600   border-red-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
  green: 'bg-green-50 text-green-600 border-green-200',
};

// ─── Post card ────────────────────────────────────────────────────────────────
function PostCard({ post, onLike }) {
  const tagStyle = TAG_STYLES[post.tagColor] || TAG_STYLES.green;

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
        <div
          className="w-full h-44 bg-cover bg-center mx-0"
          style={{ backgroundImage: `url(${post.image})` }}
        />
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
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <MessageCircle size={15} />
            {post.comments}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Share finding modal ──────────────────────────────────────────────────────
function ShareModal({ onClose, onSubmit }) {
  const [text, setText] = useState('');
  const [tag, setTag]   = useState('Early Blight');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);

    const post = {
      author:   'You',
      initials: 'ME',
      avatarBg: 'bg-forest-mid',
      location: 'Your Farm',
      time:     'Just now',
      content:  text.trim(),
      tag,
      tagColor: tag === 'All Clear' ? 'green' : tag === 'Early Blight' ? 'red' : 'amber',
      verified: false,
      confidence: null,
      image: null,
    };

    onSubmit(post);
    // Fire to backend (gracefully ignored if unreachable)
    communityService.createPost({ content: post.content, tag }).catch(() => {});
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
          rows={4}
          className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl resize-none outline-none focus:border-forest-mid transition-colors"
        />

        <select
          value={tag}
          onChange={e => setTag(e.target.value)}
          className="w-full mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none appearance-none"
        >
          <option>Early Blight</option>
          <option>Common Rust</option>
          <option>Leaf Curl</option>
          <option>All Clear</option>
          <option>Other</option>
        </select>

        <button
          onClick={submit}
          disabled={!text.trim() || busy}
          className="mt-4 w-full bg-forest-mid disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-[0.97]"
        >
          Post to Guild Feed
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function GuildFeed() {
  const { guildPosts, toggleLike, addPost, scanHistory } = useAppContext();
  const [showModal, setShowModal] = useState(false);

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
        <div className="space-y-3">
          {guildPosts.map(post => (
            <PostCard key={post.id} post={post} onLike={toggleLike} />
          ))}
        </div>

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
