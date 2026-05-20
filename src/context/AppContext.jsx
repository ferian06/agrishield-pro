import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [scanHistory, setScanHistory] = useState([
    {
      id: 1,
      crop: 'Tomato Plot B',
      disease: 'Early Blight',
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
  ]);

  const [activeDiagnosis, setActiveDiagnosis] = useState(null);
  const [treatmentLog, setTreatmentLog] = useState([]);

  const [fieldPlots] = useState([
    { id: 'A', name: 'Tomato Plot A', sector: 'Sector 1', status: 'healthy', lastScan: '1 day ago',  crop: 'Tomato',  health: 96 },
    { id: 'B', name: 'Tomato Plot B', sector: 'Sector 2', status: 'danger',  lastScan: '10 mins ago', crop: 'Tomato',  health: 23 },
    { id: 'C', name: 'Corn Sector 2', sector: 'Sector 3', status: 'warning', lastScan: '3 hrs ago',  crop: 'Corn',    health: 61 },
    { id: 'D', name: 'Rice Terrace',  sector: 'Sector 4', status: 'healthy', lastScan: '2 hrs ago',  crop: 'Rice',    health: 88 },
    { id: 'E', name: 'Wheat Field',   sector: 'Sector 5', status: 'healthy', lastScan: '1 day ago',  crop: 'Wheat',   health: 91 },
    { id: 'F', name: 'Pepper Row',    sector: 'Sector 6', status: 'warning', lastScan: '5 hrs ago',  crop: 'Pepper',  health: 54 },
  ]);

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

  return (
    <AppContext.Provider value={{
      scanHistory, activeDiagnosis, addScan,
      treatmentLog, markTreatment, getTreatment,
      fieldPlots,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
