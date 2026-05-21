import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Users, ScanLine, BookOpen } from 'lucide-react';
import { AppProvider } from './context/AppContext';

import GuildFeed   from './pages/GuildFeed';
import CropSense   from './pages/CropSense';
import ResourceHub from './pages/ResourceHub';

// ─── Bottom navigation ────────────────────────────────────────────────────────
const NAV = [
  { to: '/',           icon: <Users    size={21} />, label: 'Guild Feed'   },
  { to: '/cropsense',  icon: <ScanLine size={21} />, label: 'CropSense'   },
  { to: '/resources',  icon: <BookOpen size={21} />, label: 'Resource Hub' },
];

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        {/*
          Outer shell: slate background visible on wide screens beside the
          centred content column. The column itself is max-w-md so it looks
          great on both mobile (full-width) and desktop (centred card).
        */}
        <div className="min-h-screen bg-slate-100 flex justify-center">
          <div className="w-full max-w-md min-h-screen bg-[#f0f4f0] flex flex-col relative">

            {/* ── Header ──────────────────────────────────────────────── */}
            <header className="bg-forest-mid text-white px-5 pt-5 pb-5 flex-shrink-0 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-brand-mint tracking-widest uppercase font-syne">
                    GreenGuild
                  </span>
                  <h1 className="font-syne font-extrabold text-[22px] leading-tight">GreenGuild AI</h1>
                </div>
                <span className="text-[10px] font-semibold bg-brand-mint/30 border border-brand-mint/50 text-green-200 px-3 py-1 rounded-full">
                  ● Online
                </span>
              </div>
            </header>

            {/* ── Main content ─────────────────────────────────────────── */}
            <main className="flex-1 overflow-y-auto px-5 pt-5 pb-28 scrollbar-hide">
              <Routes>
                <Route path="/"           element={<GuildFeed />}   />
                <Route path="/cropsense"  element={<CropSense />}   />
                <Route path="/resources"  element={<ResourceHub />} />
                {/* Catch-all → home */}
                <Route path="*"           element={<GuildFeed />}   />
              </Routes>
            </main>

            {/* ── Bottom nav ───────────────────────────────────────────── */}
            <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 flex justify-around px-2 pt-3 pb-6 z-10">
              {NAV.map(({ to, icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl text-[9px] font-bold uppercase tracking-widest transition-all duration-200 ${
                      isActive
                        ? 'bg-green-50 text-forest-mid'
                        : 'text-slate-400 hover:text-slate-600'
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
