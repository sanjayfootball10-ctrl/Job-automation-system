import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Sparkles, ArrowRight, CheckCircle, Lock, Mail, User, KeyRound } from 'lucide-react';
import { api } from '../api/client';

export const AuthPage: React.FC = () => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'signup') {
        await signup({ name, email, password });
      } else if (mode === 'forgot') {
        const res = await api.forgotPassword(email);
        setMessage(res.message);
        if (res.resetToken) {
          setResetToken(res.resetToken);
        }
      } else if (mode === 'reset') {
        const res = await api.resetPassword({ resetToken, newPassword });
        setMessage(res.message);
        setTimeout(() => setMode('login'), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Dynamic Ambient Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-8 z-10 relative">
        {/* Logo Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-500 via-blue-500 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-500/25">
            <Briefcase className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            JobTracker <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">Application Automation & Pipeline Tracker</p>
        </div>


        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 text-xs font-medium bg-rose-950/60 text-rose-300 rounded-xl border border-rose-800">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 text-xs font-medium bg-emerald-950/60 text-emerald-300 rounded-xl border border-emerald-800">
            {message}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 text-white text-sm rounded-xl border border-slate-700 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 text-white text-sm rounded-xl border border-slate-700 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-brand-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 text-white text-sm rounded-xl border border-slate-700 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reset Token</label>
                <input
                  type="text"
                  required
                  placeholder="Paste token here"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/90 text-white text-sm rounded-xl border border-slate-700 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/90 text-white text-sm rounded-xl border border-slate-700 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-brand-600 via-blue-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              'Processing...'
            ) : mode === 'login' ? (
              <>
                Sign In to Dashboard <ArrowRight className="w-4 h-4" />
              </>
            ) : mode === 'signup' ? (
              <>
                Create Account <CheckCircle className="w-4 h-4" />
              </>
            ) : mode === 'forgot' ? (
              <>
                Send Reset Link <KeyRound className="w-4 h-4" />
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        {/* Navigation Switchers */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button onClick={() => setMode('signup')} className="font-bold text-brand-400 hover:underline">
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button onClick={() => setMode('login')} className="font-bold text-brand-400 hover:underline">
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
