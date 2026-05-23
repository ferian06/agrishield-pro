import React, { createContext, useState, useContext, useCallback } from 'react';

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

const INITIAL_POSTS = [];

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
  // ── auth ───────────────────────────────────────────────────────────────────
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('gg_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const login = useCallback((token, userData) => {
    localStorage.setItem('gg_token', token);
    localStorage.setItem('gg_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('gg_token');
    localStorage.removeItem('gg_user');
    setUser(null);
  }, []);

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
      // auth
      user, login, logout,
      // scans
      scanHistory, activeDiagnosis, addScan,
      // treatments
      treatmentLog, markTreatment, getTreatment,
      // feedback
      feedbackLog, submitFeedback, getFeedback,
      // plots
      fieldPlots,
      // guild
      guildPosts, setGuildPosts, toggleLike, addPost,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
