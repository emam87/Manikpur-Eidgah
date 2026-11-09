import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldAlert, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { SEO } from '../../components/common/SEO.jsx';

export function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || 'eidgah-manage-k29x';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড সঠিকভাবে লিখুন।');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const res = await login(email.trim(), password);
    setLoading(false);

    if (res.success) {
      navigate(`/${ADMIN_PATH}`, { replace: true });
    } else {
      setErrorMessage(res.error || 'লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 text-ivory flex flex-col justify-center items-center p-4">
      <SEO title="অ্যাডমিন লগইন" noIndex={true} />

      <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-10 border-2 border-gold-500/40 shadow-2xl text-stone-900 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-900 text-gold-300 flex items-center justify-center mx-auto border border-gold-500/40 shadow-md">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight">
            অ্যাডমিন প্রবেশদ্বার
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ পরিচালনা পরিষদ
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              ই-মেইল ঠিকানা
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@manikpureidgah.org"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm bg-stone-50"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              গোপন পাসওয়ার্ড
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm bg-stone-50 font-mono"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-gold-200 font-bold text-sm hover:from-emerald-800 hover:to-emerald-900 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>যাচাই করা হচ্ছে...</span>
              </>
            ) : (
              <>
                <span>লগইন করুন</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-stone-100 text-center">
          <p className="text-[11px] text-stone-400">
            নিরাপত্তা সতর্কতা: অননুমোদিত প্রবেশের চেষ্টা ও আইপি ঠিকানা রেকর্ডভুক্ত হয়।
          </p>
        </div>
      </div>
    </div>
  );
}

