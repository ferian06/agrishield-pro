import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Users, ScanLine, BookOpen, UserCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppProvider, useAppContext } from './context/AppContext';

import GuildFeed   from './pages/GuildFeed';
import CropSense   from './pages/CropSense';
import ResourceHub from './pages/ResourceHub';
import Profile     from './pages/Profile';
import LoginScreen from './pages/LoginScreen';
import Onboarding          from './components/Onboarding';
import NotificationBanner  from './components/NotificationBanner';

function AppShell() {
  const { t } = useTranslation();
  const { user, login, logout } = useAppContext();

  const NAV = [
    { to: '/',          icon: <Users      size={21} />, label: t('nav.feed')      },
    { to: '/cropsense', icon: <ScanLine   size={21} />, label: t('nav.cropsense') },
    { to: '/resources', icon: <BookOpen   size={21} />, label: t('nav.resources') },
    { to: '/profile',   icon: <UserCircle size={21} />, label: t('nav.profile')   },
  ];
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('gg_onboarded')
  );

  const handleOnboardingDone = () => {
    localStorage.setItem('gg_onboarded', '1');
    setShowOnboarding(false);
  };

  if (!user) return <LoginScreen onAuth={login} />;


  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-100 flex justify-center">
        <div className="w-full max-w-md min-h-screen bg-[#f0f4f0] flex flex-col relative">

          <header className="bg-forest-mid text-white px-5 pt-5 pb-5 flex-shrink-0 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-brand-mint tracking-widest uppercase font-syne">
                  GreenGuild
                </span>
                <h1 className="font-syne font-extrabold text-[22px] leading-tight">GreenGuild AI</h1>
              </div>
              <span className="text-[10px] font-semibold bg-brand-mint/30 border border-brand-mint/50 text-green-200 px-3 py-1 rounded-full">
                ● {t('common.online')}
              </span>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-5 pt-5 pb-28 scrollbar-hide">
            <Routes>
              <Route path="/"           element={<GuildFeed />}   />
              <Route path="/cropsense"  element={<CropSense />}   />
              <Route path="/resources"  element={<ResourceHub />} />
              <Route path="/profile"    element={<Profile />}     />
              <Route path="*"           element={<GuildFeed />}   />
            </Routes>
          </main>

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
      {showOnboarding && <Onboarding onDone={handleOnboardingDone} />}
      <NotificationBanner />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
