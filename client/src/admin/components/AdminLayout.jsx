import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, HeartHandshake, Users2, Images, 
  FileText, Map, Bell, Compass, Settings, UserCog, Trash2, 
  History, LogOut, Menu, X, ExternalLink, Shield, KeyRound 
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { SEO } from '../../components/common/SEO.jsx';

export function AdminLayout({ children }) {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || 'eidgah-manage-k29x';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { to: `/${ADMIN_PATH}`, label: 'ড্যাশবোর্ড', icon: LayoutDashboard, exact: true },
    { to: `/${ADMIN_PATH}/members`, label: 'আজীবন সদস্য', icon: Users },
    { to: `/${ADMIN_PATH}/donors`, label: 'দান ও ফান্ড', icon: HeartHandshake },
    { to: `/${ADMIN_PATH}/committee`, label: 'কমিটি পরিষদ', icon: Users2 },
    { to: `/${ADMIN_PATH}/gallery`, label: 'ফটো গ্যালারি', icon: Images },
    { to: `/${ADMIN_PATH}/documents`, label: 'দলিল সংরক্ষণাগার', icon: FileText },
    { to: `/${ADMIN_PATH}/land-maps`, label: 'মৌজা নকশা', icon: Map },
    { to: `/${ADMIN_PATH}/notices`, label: 'নোটিশ বোর্ড', icon: Bell },
    { to: `/${ADMIN_PATH}/designs`, label: '৩ডি ডিজাইন', icon: Compass },
    { to: `/${ADMIN_PATH}/settings`, label: 'ওয়েবসাইট সেটিংস', icon: Settings },
    // ADMIN ONLY items
    ...(user?.role === 'ADMIN'
      ? [{ to: `/${ADMIN_PATH}/users`, label: 'অ্যাডমিন ইউজার', icon: UserCog }]
      : []),
    { to: `/${ADMIN_PATH}/trash`, label: 'ট্র্যাশ বিন', icon: Trash2 },
    { to: `/${ADMIN_PATH}/activity-logs`, label: 'লগ ও ব্যাকআপ', icon: History },
  ];

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans">
      <SEO title="অ্যাডমিন প্যানেল - মানিকপুর ঈদগাহ" noIndex={true} />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-emerald-950 text-ivory border-b border-gold-500/40 shadow-md">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl text-gold-300 hover:bg-emerald-900 lg:hidden transition-colors"
              title="মেনু খুলুন"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gold-500/20 border border-gold-400/40 flex items-center justify-center text-gold-300 font-bold text-sm">
                ম
              </div>
              <div>
                <span className="font-serif font-bold text-base sm:text-lg text-gold-100 tracking-wide block leading-none">
                  মানিকপুর ঈদগাহ
                </span>
                <span className="text-[10px] text-gold-300/80 font-mono">অ্যাডমিন নিয়ন্ত্রণ কক্ষ</span>
              </div>
            </div>
          </div>

          {/* User Status & Action Controls */}
          <div className="flex items-center gap-3">
            {/* Role Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/80 border border-gold-500/30 text-xs text-gold-300">
              <Shield className="w-3.5 h-3.5" />
              <span>{user?.name}</span>
              <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-gold-200">
                {user?.role}
              </span>
            </div>

            {/* Visit Public Site */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-gold-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-gold-500/30"
              title="ওয়েবসাইট দেখুন"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden md:inline">ওয়েবসাইট দেখুন</span>
            </a>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-red-950/70 hover:bg-red-900 text-red-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-red-500/30"
              title="লগআউট"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">লগআউট</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for Desktop & Mobile Drawer */}
        <aside
          className={`fixed inset-y-16 left-0 z-30 w-64 bg-emerald-950 text-ivory border-r border-gold-500/30 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col justify-between overflow-y-auto p-4 space-y-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-emerald-950 shadow-md font-bold'
                          : 'text-stone-300 hover:bg-emerald-900/60 hover:text-gold-200'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-emerald-900/80 text-[11px] text-stone-400 text-center">
              <span>মানিকপুর কেন্দ্রীয় শাহী ঈদগাহ</span>
              <span className="block text-[10px] text-stone-500 mt-0.5">ভার্সন ১.০ (Next-Gen)</span>
            </div>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-stone-50">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

