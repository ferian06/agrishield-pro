import React, { useState } from 'react';
import { Loader2, Sprout } from 'lucide-react';
import api from '../services/api';

export default function LoginScreen({ onAuth }) {
  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');

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
    <div className="min-h-screen bg-[#f0f4f0] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-forest-mid rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sprout size={32} className="text-brand-mint" />
          </div>
          <p className="text-[10px] font-bold text-brand-mint tracking-widest uppercase font-syne">GreenGuild</p>
          <h1 className="font-syne font-extrabold text-2xl text-slate-800 mt-1">GreenGuild AI</h1>
          <p className="text-xs text-slate-400 mt-1">AI-powered crop diagnostics for smallholder farmers</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-syne font-extrabold text-lg text-slate-800 mb-5">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'register' && (
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-forest-mid transition-colors"
              />
            )}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-forest-mid transition-colors"
            />
            <input
              type="password"
              placeholder="Password (min. 6 characters)"
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
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-xs text-slate-400 hover:text-forest-mid font-semibold transition-colors"
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
