import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, ScanLine, FileText, CloudRain, Map, Wifi, BatteryMedium } from 'lucide-react';
import { AppProvider } from './context/AppContext';

import Hub from './pages/Hub';
import AILens from './pages/AILens';
import Diagnosis from './pages/Diagnosis';
import RiskModel from './pages/RiskModel';
import FieldMap from './pages/FieldMap';

function StatusBar() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-center justify-between px-5 pt-3 pb-1.5 bg-slate-900 flex-shrink-0">
      <span className="text-white text-[11px] font-bold">{timeStr}</span>
      <div className="flex items-center gap-2 text-white">
        <Wifi size={12} />
        <BatteryMedium size={14} />
        <span className="text-[10px] font-semibold">87%</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-200 flex justify-center items-center py-8">
          <div className="w-full max-w-[400px] h-[820px] bg-[#f0f4f1] rounded-[44px] shadow-2xl border-4 border-slate-900 overflow-hidden relative flex flex-col">

            {/* Status bar */}
            <StatusBar />

            {/* Header */}
            <header className="bg-forest-mid text-white px-6 pt-4 pb-7 rounded-b-[28px] relative overflow-hidden flex-shrink-0">
              <div className="absolute w-44 h-44 rounded-full bg-brand-mint/20 -top-14 -right-10 pointer-events-none" />
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-brand-mint tracking-widest font-syne uppercase">AgriShield</span>
                <span className="text-[10px] font-semibold bg-brand-mint/30 border border-brand-mint/50 text-green-200 px-3 py-1 rounded-full">● Online</span>
              </div>
              <h1 className="font-syne font-extrabold text-xl">AgriShield AI</h1>
              <p className="text-xs text-green-200 mt-0.5">Precision crop protection</p>
            </header>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto px-5 pt-5 pb-28 scrollbar-hide">
              <Routes>
                <Route path="/"          element={<Hub />} />
                <Route path="/lens"      element={<AILens />} />
                <Route path="/diagnosis" element={<Diagnosis />} />
                <Route path="/risk"      element={<RiskModel />} />
                <Route path="/map"       element={<FieldMap />} />
              </Routes>
            </main>

            {/* Bottom Nav */}
            <nav className="absolute bottom-0 w-full bg-white border-t border-slate-100 flex justify-around px-1 pt-3 pb-5 rounded-b-[40px]">
              {[
                { to: '/',           icon: <LayoutDashboard size={20} />, label: 'Hub'     },
                { to: '/lens',       icon: <ScanLine size={20} />,        label: 'Scan'    },
                { to: '/diagnosis',  icon: <FileText size={20} />,        label: 'Results' },
                { to: '/risk',       icon: <CloudRain size={20} />,       label: 'Risk'    },
                { to: '/map',        icon: <Map size={20} />,             label: 'Map'     },
              ].map(({ to, icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 px-3 py-2 rounded-2xl text-[9px] font-bold uppercase tracking-widest transition-all duration-200 ${
                      isActive ? 'bg-green-50 text-forest-mid' : 'text-slate-400 hover:text-slate-600'
                    }`
                  }
                >
                  {icon}
                  {label}
                </NavLink>
              ))}
            </nav>

          </div>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
