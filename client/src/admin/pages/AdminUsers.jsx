import React, { useState, useEffect } from 'react';
import { UserCog, Plus, Trash2, KeyRound, Shield, Check, X, Lock } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

export function AdminUsers() {
  const { user: currentUser } = useAdminAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create User Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EDITOR',
  });

  // Reset Password Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalOpen || resetModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen, resetModalOpen]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (formData.password.length < 10) {
      setErrorMsg('পাসওয়ার্ড কমপক্ষে ১০ অক্ষরের হতে হবে।');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setModalOpen(false);
        fetchUsers();
      } else {
        setErrorMsg(data.error || 'ব্যবহারকারী যোগ করা যায়নি।');
      }
    } catch (err) {
      setErrorMsg('সার্ভারে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 10) {
      alert('পাসওয়ার্ড কমপক্ষে ১০ অক্ষরের হতে হবে।');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${resetUserId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        alert('পাসওয়ার্ড সফলভাবে রিসেট হয়েছে!');
        setResetModalOpen(false);
        setNewPassword('');
      } else {
        alert(data.error || 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      alert('সার্ভারে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id, email) => {
    if (id === currentUser?.id) {
      alert('নিজের অ্যাকাউন্ট মুছে ফেলা সম্ভব নয়।');
      return;
    }

    if (!window.confirm(`আপনি কি নিশ্চিত যে ব্যবহারকারী '${email}' মুছে ফেলতে চান?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || 'মুছে ফেলতে সমস্যা হয়েছে।');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-sand shadow-sakinah-sm">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
            <UserCog className="w-6 h-6 text-primary-dark" />
            <span>অ্যাডমিন ও এডিটর ইউজার ব্যবস্থাপনা</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            শুধুমাত্র প্রধান অ্যাডমিনরা নতুন ইউজার তৈরি ও পাসওয়ার্ড রিসেট করতে পারেন
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({ name: '', email: '', password: '', role: 'EDITOR' });
            setErrorMsg('');
            setModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors flex items-center gap-1.5 shadow-sakinah-sm"
        >
          <Plus className="w-4 h-4 text-gold" />
          <span>নতুন ইউজার তৈরি</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-surface rounded-2xl border border-sand overflow-hidden shadow-sakinah-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink">
            <thead className="bg-canvas-alt border-b border-sand text-ink-muted uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">নাম</th>
                <th className="px-5 py-3.5">ই-মেইল</th>
                <th className="px-5 py-3.5">রোল (ভূমিকা)</th>
                <th className="px-5 py-3.5">স্থিতি</th>
                <th className="px-5 py-3.5 text-center">পাসওয়ার্ড রিসেট</th>
                <th className="px-5 py-3.5 text-center">মুছে ফেলুন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-canvas-alt/60 transition-colors">
                  <td className="px-5 py-3 font-bold text-ink">{u.name}</td>
                  <td className="px-5 py-3 font-mono text-ink-muted">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      u.role === 'ADMIN' ? 'bg-warning-soft text-gold-text border border-gold/40' : 'bg-primary-soft text-primary-dark'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-primary font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>সক্রিয়</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => {
                        setResetUserId(u.id);
                        setNewPassword('');
                        setResetModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-canvas hover:bg-canvas-alt border border-sand text-ink font-semibold text-[11px] inline-flex items-center gap-1"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-ink-muted" />
                      <span>পাসওয়ার্ড রিসেট</span>
                    </button>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => handleDeleteUser(u.id, u.email)}
                      disabled={u.id === currentUser?.id}
                      className="p-1.5 rounded-lg text-danger hover:bg-danger-soft disabled:opacity-30 disabled:cursor-not-allowed"
                      title={u.id === currentUser?.id ? 'নিজের অ্যাকাউন্ট মুছে ফেলা সম্ভব নয়' : 'মুছে ফেলুন'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 sm:p-8 border border-sand shadow-sakinah-lift space-y-4">
            <div className="flex items-center justify-between border-b border-sand pb-3">
              <h2 className="font-serif font-bold text-xl text-ink">নতুন ইউজার যোগ</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-canvas-alt text-ink-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-danger-soft border border-danger/30 text-danger text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-ink mb-1">পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="যেমন: সৈয়দ হারুন"
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-sand text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">ই-মেইল *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@manikpureidgah.org"
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-sand text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">ভূমিকা (Role) *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-sand text-ink font-bold focus:outline-none focus:border-primary"
                >
                  <option value="EDITOR">EDITOR (তথ্য সম্পাদনা ও যোগ করতে পারেন)</option>
                  <option value="ADMIN">ADMIN (সকল প্রশাসনিক ক্ষমতা ও ইউজার নিয়ন্ত্রণ)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">পাসওয়ার্ড (কমপক্ষে ১০ অক্ষর) *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-sand text-ink font-mono focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-3 border-t border-sand flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-sand text-ink-muted hover:bg-canvas-alt font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-sakinah-sm disabled:opacity-50"
                >
                  {saving ? 'সংরক্ষণ হচ্ছে...' : 'ইউজার তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-3xl max-w-sm w-full p-6 border border-sand shadow-sakinah-lift space-y-4">
            <h3 className="font-serif font-bold text-lg text-ink">পাসওয়ার্ড রিসেট</h3>
            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-ink mb-1">নতুন পাসওয়ার্ড (কমপক্ষে ১০ অক্ষর)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-sand text-ink font-mono focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-sand text-ink-muted hover:bg-canvas-alt font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-sakinah-sm disabled:opacity-50"
                >
                  {saving ? 'রিসেট হচ্ছে...' : 'রিসেট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

