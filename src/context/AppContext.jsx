import React, { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
import { cropService } from '../services/cropService';

const AppContext = createContext();

function normalizeScan(s) {
  const cropName = (s.crop_type || 'plant');
  return {
    id: s.id,
    crop: cropName.charAt(0).toUpperCase() + cropName.slice(1) + ' Plant',
    disease: s.disease || 'Unknown',
    confidence: Math.round((s.confidence || 0) * 1000) / 10,
    severity: s.severity === 'High' ? 'danger' : s.severity === 'Moderate' ? 'warning' : 'success',
    date: new Date(s.created_at).toLocaleDateString(),
    bg: null,
    recommendations: s.recommendations || [],
  };
}

export const AppProvider = ({ children }) => {
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

  const [scanHistory, setScanHistory]         = useState([]);
  const [activeDiagnosis, setActiveDiagnosis] = useState(null);
  const [treatmentLog, setTreatmentLog]       = useState([]);
  const [guildPosts, setGuildPosts]           = useState([]);
  const [feedbackLog, setFeedbackLog]         = useState([]);

  // Load real scan history from backend whenever user logs in
  useEffect(() => {
    if (!user) { setScanHistory([]); return; }
    cropService.getScanHistory()
      .then(({ scans }) => setScanHistory((scans || []).map(normalizeScan)))
      .catch(() => {});
  }, [user]);

  // Derive field plots from real scan history (most recent scan per crop type)
  const fieldPlots = useMemo(() => {
    const byType = {};
    scanHistory.forEach(s => {
      const key = s.crop.replace(' Plant', '').toLowerCase();
      if (!byType[key]) byType[key] = s;
    });
    return Object.values(byType).map((s, i) => ({
      id: String.fromCharCode(65 + i),
      name: s.crop,
      sector: `Field ${i + 1}`,
      status: s.severity === 'danger' ? 'danger' : s.severity === 'warning' ? 'warning' : 'healthy',
      lastScan: s.date,
      crop: s.crop.replace(' Plant', ''),
      health: s.severity === 'danger' ? 22 : s.severity === 'warning' ? 58 : 91,
    }));
  }, [scanHistory]);

  const addScan = (scan) => {
    setScanHistory(prev => [scan, ...prev]);
    setActiveDiagnosis(scan);
  };

  const markTreatment = (scanId) => {
    setTreatmentLog(prev => {
      if (prev.find(t => t.scanId === scanId)) return prev;
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return [...prev, { scanId, time }];
    });
  };
  const getTreatment = (scanId) => treatmentLog.find(t => t.scanId === scanId);

  const submitFeedback = (scanId, rating) => {
    setFeedbackLog(prev => {
      if (prev.find(f => f.scanId === scanId)) return prev;
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return [...prev, { scanId, rating, time }];
    });
  };
  const getFeedback = (scanId) => feedbackLog.find(f => f.scanId === scanId);

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
      user, login, logout,
      scanHistory, setScanHistory, activeDiagnosis, addScan,
      treatmentLog, markTreatment, getTreatment,
      feedbackLog, submitFeedback, getFeedback,
      fieldPlots,
      guildPosts, setGuildPosts, toggleLike, addPost,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
