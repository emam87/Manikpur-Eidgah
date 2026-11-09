import React, { useState } from 'react';
import { KeyRound, ShieldAlert, Check, ArrowRight, Loader2 } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { SEO } from '../../components/common/SEO.jsx';

export function ForcePasswordChange() {
  const { changePassword } = useAdminAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না।');
      return;
    }
    if (newPassword.length < 10) {
      setError('পাসওয়ার্ড কমপক্ষে ১০ অক্ষরের হতে হবে।');
      return;
    }

    setLoading(true);
    setError('');

    const res = await changePassword(currentPassword, newPassword);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।');
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-ivory flex flex-col items-center justify-center p-4">
      <SEO title="পাসওয়ার্ড পরিবর্তন বাধ্যতামূলক" noIndex={true} />

      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gold-500/40 shadow-2xl text-stone-900 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gold-500/20 text-emerald-950 flex items-center justify-center mx-auto border border-gold-500/40">
            <KeyRound className="w-7 h-7 text-emerald-900" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-emerald-950">
            পাসওয়ার্ড পরিবর্তন বাধ্যতামূলক
          </h1>
          <p className="text-xs text-stone-600">
            প্রথমবার সফল লগইনের পর আপনার অ্যাকাউন্টের সুরক্ষায় নতুন একটি শক্তিশালী পাসওয়ার্ড নির্ধারণ করা বাধ্যতামূলক।
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
              বর্তমান পাসওয়ার্ড
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
              নতুন পাসওয়ার্ড (কমপক্ষে ১০ অক্ষর)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
              নতুন পাসওয়ার্ড নিশ্চিত করুন
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-900 text-gold-200 font-bold text-sm hover:bg-emerald-800 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>পাসওয়ার্ড সংরক্ষণ করুন</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
