import React, { useState } from 'react';
import { Loader2, Sprout, Globe, X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const LANGS = [
  { code: 'en',  label: 'English',          flag: '🇬🇧' },
  { code: 'fr',  label: 'Français',         flag: '🇫🇷' },
  { code: 'sw',  label: 'Kiswahili',        flag: '🇰🇪' },
  { code: 'mfe', label: 'Kreol Morisyen',   flag: '🇲🇺' },
  { code: 'pt',  label: 'Português',        flag: '🇲🇿' },
  { code: 'ar',  label: 'عربية',            flag: '🇲🇦' },
  { code: 'hi',  label: 'हिन्दी',            flag: '🇮🇳' },
  { code: 'am',  label: 'አማርኛ',             flag: '🇪🇹' },
  { code: 'ha',  label: 'Hausa',            flag: '🇳🇬' },
  { code: 'yo',  label: 'Yorùbá',           flag: '🇳🇬' },
  { code: 'ig',  label: 'Igbo',             flag: '🇳🇬' },
  { code: 'zu',  label: 'IsiZulu',          flag: '🇿🇦' },
  { code: 'so',  label: 'Soomaali',         flag: '🇸🇴' },
  { code: 'mg',  label: 'Malagasy',         flag: '🇲🇬' },
  { code: 'sn',  label: 'ChiShona',         flag: '🇿🇼' },
  { code: 'bn',  label: 'বাংলা',             flag: '🇧🇩' },
  { code: 'tl',  label: 'Filipino',         flag: '🇵🇭' },
  { code: 'vi',  label: 'Tiếng Việt',       flag: '🇻🇳' },
  { code: 'id',  label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'th',  label: 'ภาษาไทย',          flag: '🇹🇭' },
  { code: 'ur',  label: 'اردو',             flag: '🇵🇰' },
];

function LanguagePickerModal({ onClose }) {
  const { t, i18n } = useTranslation();
  const current = i18n.language;

  const pick = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('gg_language', code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-forest-mid rounded-xl flex items-center justify-center">
              <Globe size={16} className="text-white" />
            </div>
            <div>
              <p className="font-syne font-extrabold text-slate-800 text-sm leading-tight">
                {t('login.chooseLanguage')}
              </p>
              <p className="text-[10px] text-slate-400">{t('login.selectAndContinue')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Drag handle (mobile hint) */}
        <div className="flex justify-center pb-2 flex-shrink-0">
          <div className="w-8 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Scrollable grid */}
        <div className="overflow-y-auto px-4 pb-6">
          <div className="grid grid-cols-3 gap-2">
            {LANGS.map(({ code, label, flag }) => {
              const active = current === code;
              return (
                <button
                  key={code}
                  onClick={() => pick(code)}
                  className={`flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-2xl text-[11px] font-bold transition-all border relative ${
                    active
                      ? 'bg-forest-mid text-white border-forest-mid shadow-md'
                      : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-green-50 hover:border-forest-mid/30 active:scale-95'
                  }`}
                >
                  {active && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-white/30 rounded-full flex items-center justify-center">
                      <Check size={9} className="text-white" strokeWidth={3} />
                    </span>
                  )}
                  <span className="text-xl">{flag}</span>
                  <span className="text-center leading-tight">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginScreen({ onAuth }) {
  const { t, i18n } = useTranslation();
  const [mode, setMode]       = useState('login');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');

  // Show picker automatically if no language has been chosen yet
  const [showPicker, setShowPicker] = useState(
    () => !localStorage.getItem('gg_language')
  );

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login' ? { email, password } : { name, email, password };
      const { token, user } = await api.post(path, body);
      onAuth(token, user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#f0f4f0] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-forest-mid rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sprout size={32} className="text-brand-mint" />
            </div>
            <p className="text-[10px] font-bold text-brand-mint tracking-widest uppercase font-syne">GreenGuild</p>
            <h1 className="font-syne font-extrabold text-2xl text-slate-800 mt-1">GreenGuild AI</h1>
            <p className="text-xs text-slate-400 mt-1">{t('login.tagline')}</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">

            {/* Card header row */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-syne font-extrabold text-lg text-slate-800">
                {mode === 'login' ? t('login.welcome') : t('login.create')}
              </h2>
              {/* Globe button to re-open language picker */}
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-forest-mid bg-green-50 border border-green-100 px-2.5 py-1.5 rounded-xl hover:bg-green-100 transition-colors"
              >
                <Globe size={12} />
                {LANGS.find(l => l.code === i18n.language)?.flag ?? '🌍'}
              </button>
            </div>

            <form onSubmit={submit} className="space-y-3">
              {mode === 'register' && (
                <input
                  type="text"
                  placeholder={t('login.name')}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-forest-mid transition-colors"
                />
              )}
              <input
                type="email"
                placeholder={t('login.email')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-forest-mid transition-colors"
              />
              <input
                type="password"
                placeholder={t('login.password')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-forest-mid transition-colors"
              />

              {error && (
                <p className="text-xs text-red-500 font-semibold bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-forest-mid disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97] shadow-md mt-1"
              >
                {busy && <Loader2 size={16} className="animate-spin" />}
                {mode === 'login' ? t('login.signIn') : t('login.register')}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
                className="text-xs text-slate-400 hover:text-forest-mid font-semibold transition-colors"
              >
                {mode === 'login' ? t('login.noAccount') : t('login.hasAccount')}
              </button>
            </div>
          </div>

        </div>
      </div>

      {showPicker && <LanguagePickerModal onClose={() => setShowPicker(false)} />}
    </>
  );
}
