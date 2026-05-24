import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Globe, LogOut, ScanLine, FileText, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { userService } from '../services/userService';
import { notificationService } from '../services/notificationService';

const LANGS = [
  { code: 'en', label: 'English',   flag: '🇬🇧' },
  { code: 'fr', label: 'Français',  flag: '🇫🇷' },
  { code: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
];

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { user, logout, scanHistory } = useAppContext();

  const [stats, setStats]           = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [notifStatus, setNotifStatus]   = useState(() => notificationService.getPermission());
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    userService.getStats()
      .then(s => setStats(s))
      .catch(() => setStats({ scanCount: scanHistory.length, postCount: '—', memberSince: null }))
      .finally(() => setStatsLoading(false));
  }, [scanHistory.length]);

  const handleEnableNotif = async () => {
    setNotifLoading(true);
    const result = await notificationService.enable();
    setNotifStatus(notificationService.getPermission());
    setNotifLoading(false);
    if (!result.success && result.reason === 'denied') {
      alert('Notifications are blocked. Please allow them in your browser settings and reload.');
    }
  };

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('gg_language', code);
  };

  const initials = (user?.name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const memberSince = stats?.memberSince
    ? new Date(stats.memberSince).toLocaleDateString('en', { year: 'numeric', month: 'long' })
    : null;

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="mb-2">
        <h2 className="font-syne font-extrabold text-xl text-slate-800">{t('profile.title')}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{t('common.online')}</p>
      </div>

      {/* Avatar + info */}
      <div className="bg-forest-mid text-white rounded-[24px] p-6 relative overflow-hidden">
        <div className="absolute w-36 h-36 rounded-full bg-brand-mint/15 -top-10 -right-10 pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-mint/20 border-2 border-brand-mint/40 flex items-center justify-center flex-shrink-0">
            <span className="font-syne font-extrabold text-2xl text-brand-mint">{initials}</span>
          </div>
          <div>
            <p className="font-syne font-extrabold text-lg leading-tight">{user?.name}</p>
            <p className="text-xs text-green-300 mt-0.5">{user?.email}</p>
            {memberSince && (
              <p className="text-[10px] text-green-400 mt-1">{t('profile.memberSince')} {memberSince}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mt-5">
          {[
            { icon: <ScanLine size={14} />, label: t('profile.stats.scans'), value: statsLoading ? '…' : (stats?.scanCount ?? 0) },
            { icon: <FileText   size={14} />, label: t('profile.stats.posts'),  value: statsLoading ? '…' : (stats?.postCount  ?? 0) },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex-1 bg-white/10 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-green-300 mb-1">{icon}<span className="text-[10px] font-bold uppercase tracking-wider">{label}</span></div>
              <p className="font-syne font-extrabold text-2xl">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('profile.notifications.title')}</p>
        </div>
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${notifStatus === 'granted' ? 'bg-green-50' : 'bg-slate-100'}`}>
              {notifStatus === 'granted'
                ? <Bell size={16} className="text-green-600" />
                : <BellOff size={16} className="text-slate-400" />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {notifStatus === 'granted'   ? t('profile.notifications.enabled') :
                 notifStatus === 'denied'    ? 'Blocked in browser' :
                 t('profile.notifications.subtitle')}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{t('profile.notifications.subtitle')}</p>
            </div>
          </div>
          {!notificationService.isSupported() ? (
            <span className="text-[10px] text-slate-400 text-right">{t('profile.notifications.notSupported')}</span>
          ) : notifStatus === 'granted' ? (
            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full">✓ On</span>
          ) : notifStatus === 'denied' ? (
            <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full">Blocked</span>
          ) : (
            <button
              onClick={handleEnableNotif}
              disabled={notifLoading}
              className="bg-forest-mid text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-60 flex items-center gap-2 flex-shrink-0"
            >
              {notifLoading && <Loader2 size={12} className="animate-spin" />}
              {t('profile.notifications.enable')}
            </button>
          )}
        </div>
      </div>

      {/* Language */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
          <Globe size={13} className="text-slate-400" />
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('profile.language.title')}</p>
        </div>
        <div className="px-5 py-4 flex gap-2">
          {LANGS.map(({ code, label, flag }) => (
            <button
              key={code}
              onClick={() => changeLanguage(code)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-bold transition-all border ${
                i18n.language === code
                  ? 'bg-forest-mid text-white border-forest-mid shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-lg">{flag}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* App info */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
        <div className="flex justify-between text-xs text-slate-400">
          <span className="font-semibold">GreenGuild AI</span>
          <span>{t('profile.version')} 1.0.0</span>
        </div>
        <p className="text-[10px] text-slate-300 mt-1">Built for smallholder farmers worldwide 🌱</p>
      </div>

      {/* Sign out */}
      <button
        onClick={logout}
        className="w-full bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2.5 text-sm transition-colors"
      >
        <LogOut size={16} />
        {t('profile.signOut')}
      </button>
    </div>
  );
}
