import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

// ─── seed data ────────────────────────────────────────────────────────────────

const INITIAL_SCANS = [
  {
    id: 1,
    crop: 'Tomato Plot B',
    disease: 'Early Blight (Alternaria solani)',
    confidence: 94.2,
    severity: 'danger',
    date: '10 mins ago',
    bg: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 2,
    crop: 'Rice Field Terrace',
    disease: 'Healthy Blade',
    confidence: 98.1,
    severity: 'success',
    date: '2 hrs ago',
    bg: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&q=80&w=400',
  },
];

const INITIAL_POSTS = [
  {
    id: 1,
    author: 'Maria Santos',
    initials: 'MS',
    avatarBg: 'bg-violet-500',
    location: 'Iloilo, Philippines',
    time: '2h ago',
    content:
      'Found early blight signs on Plot B. CropSense confirmed 94.2% confidence. Applied copper fungicide this morning — anyone in Region VI seeing the same spread this season?',
    tag: 'Early Blight',
    tagColor: 'red',
    verified: true,
    confidence: 94.2,
    likes: 31,
    comments: 9,
    liked: false,
    image: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 2,
    author: 'James Okonkwo',
    initials: 'JO',
    avatarBg: 'bg-orange-500',
    location: 'Ogun State, Nigeria',
    time: '5h ago',
    content:
      'Day 3 after neem oil treatment on my rust-infected corn rows. Visible improvement in 2 of 4 rows. Sharing progress for the community records — will post a full update on day 7.',
    tag: 'Common Rust',
    tagColor: 'amber',
    verified: true,
    confidence: 82.7,
    likes: 47,
    comments: 14,
    liked: false,
    image: null,
  },
  {
    id: 3,
    author: 'Priya Nair',
    initials: 'PN',
    avatarBg: 'bg-emerald-500',
    location: 'Kerala, India',
    time: '1d ago',
    content:
      'Rice terrace looking healthy this season! Consistent CropSense monitoring every 3 days — no disease detected for 3 weeks straight. Offline mode saved us during the monsoon data outage.',
    tag: 'All Clear',
    tagColor: 'green',
    verified: true,
    confidence: 98.1,
    likes: 88,
    comments: 22,
    liked: false,
    image: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 4,
    author: 'Carlos Mendez',
    initials: 'CM',
    avatarBg: 'bg-blue-500',
    location: 'Jalisco, Mexico',
    time: '1d ago',
    content:
      'Anyone tried pepper leaf curl detection? Got 87% confidence on my scan. Waiting for confirmation from my local extension officer. Love how it works completely offline in the field.',
    tag: 'Leaf Curl',
    tagColor: 'amber',
    verified: false,
    confidence: null,
    likes: 19,
    comments: 6,
    liked: false,
    image: null,
  },
];

const INITIAL_PLOTS = [
  { id: 'A', name: 'Tomato Plot A', sector: 'Sector 1', status: 'healthy', lastScan: '1 day ago',  crop: 'Tomato',  health: 96 },
  { id: 'B', name: 'Tomato Plot B', sector: 'Sector 2', status: 'danger',  lastScan: '10 mins ago', crop: 'Tomato',  health: 23 },
  { id: 'C', name: 'Corn Sector 2', sector: 'Sector 3', status: 'warning', lastScan: '3 hrs ago',  crop: 'Corn',    health: 61 },
  { id: 'D', name: 'Rice Terrace',  sector: 'Sector 4', status: 'healthy', lastScan: '2 hrs ago',  crop: 'Rice',    health: 88 },
  { id: 'E', name: 'Wheat Field',   sector: 'Sector 5', status: 'healthy', lastScan: '1 day ago',  crop: 'Wheat',   health: 91 },
  { id: 'F', name: 'Pepper Row',    sector: 'Sector 6', status: 'warning', lastScan: '5 hrs ago',  crop: 'Pepper',  health: 54 },
];

// ─── provider ─────────────────────────────────────────────────────────────────

export const AppProvider = ({ children }) => {
  const [scanHistory, setScanHistory]   = useState(INITIAL_SCANS);
  const [activeDiagnosis, setActiveDiagnosis] = useState(null);
  const [treatmentLog, setTreatmentLog] = useState([]);
  const [fieldPlots]                    = useState(INITIAL_PLOTS);
  const [guildPosts, setGuildPosts]     = useState(INITIAL_POSTS);
  const [feedbackLog, setFeedbackLog]   = useState([]);   // { scanId, rating, time }

  // ── scan actions ───────────────────────────────────────────────────────────
  const addScan = (scan) => {
    setScanHistory(prev => [scan, ...prev]);
    setActiveDiagnosis(scan);
  };

  // ── treatment actions ──────────────────────────────────────────────────────
  const markTreatment = (scanId) => {
    setTreatmentLog(prev => {
      if (prev.find(t => t.scanId === scanId)) return prev;
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return [...prev, { scanId, time }];
    });
  };
  const getTreatment = (scanId) => treatmentLog.find(t => t.scanId === scanId);

  // ── feedback actions ───────────────────────────────────────────────────────
  const submitFeedback = (scanId, rating) => {
    setFeedbackLog(prev => {
      if (prev.find(f => f.scanId === scanId)) return prev;
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return [...prev, { scanId, rating, time }];
    });
  };
  const getFeedback = (scanId) => feedbackLog.find(f => f.scanId === scanId);

  // ── guild feed actions ─────────────────────────────────────────────────────
  const toggleLike = (postId) => {
    setGuildPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
        : p
    ));
  };

  const addPost = (post) => {
    setGuildPosts(prev => [{ id: Date.now(), ...post, likes: 0, comments: 0, liked: false }, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      // scans
      scanHistory, activeDiagnosis, addScan,
      // treatments
      treatmentLog, markTreatment, getTreatment,
      // feedback
      feedbackLog, submitFeedback, getFeedback,
      // plots
      fieldPlots,
      // guild
      guildPosts, toggleLike, addPost,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
