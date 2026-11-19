import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, HeartHandshake, Landmark, Users2, Images, 
  FileText, Map, Bell, Compass, Settings, UserCog, Trash2, 
  History, LogOut, Menu, X, ExternalLink, Shield, KeyRound, Globe, FileSearch,
  PlusCircle, Layers
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { SEO } from '../../components/common/SEO.jsx';

export function AdminLayout({ children }) {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || 'eidgah-manage-k29x';

  // Lock body scroll when mobile sidebar or add sheet is open
  React.useEffect(() => {
    if (sidebarOpen || addSheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, addSheetOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { to: `/${ADMIN_PATH}`, label: 'ড্যাশবোর্ড', icon: LayoutDashboard, exact: true },
    { to: `/${ADMIN_PATH}/members`, label: 'আজীবন সদস্য', icon: Users },
    { to: `/${ADMIN_PATH}/land-donors`, label: 'জমিদাতা পরিষদ', icon: Landmark },
    { to: `/${ADMIN_PATH}/donors`, label: 'আর্কাইভ অনুদান (পুরনো)', icon: HeartHandshake },
    { to: `/${ADMIN_PATH}/committee`, label: 'কমিটি পরিষদ', icon: Users2 },
    { to: `/${ADMIN_PATH}/gallery`, label: 'ফটো গ্যালারি', icon: Images },
    { to: `/${ADMIN_PATH}/documents`, label: 'দলিল সংরক্ষণাগার', icon: FileText },
    { to: `/${ADMIN_PATH}/land-maps`, label: 'মৌজা নকশা', icon: Map },
    { to: `/${ADMIN_PATH}/notices`, label: 'নোটিশ বোর্ড', icon: Bell },
    { to: `/${ADMIN_PATH}/designs`, label: '৩ডি ডিজাইন', icon: Compass },
    { to: `/${ADMIN_PATH}/missing-translations`, label: 'অনুবাদ নিরীক্ষা', icon: Globe },
    { to: `/${ADMIN_PATH}/name-review`, label: 'নাম পর্যালোচনা', icon: FileSearch },
    { to: `/${ADMIN_PATH}/settings`, label: 'ওয়েবসাইট সেটিংস', icon: Settings },
    // ADMIN ONLY items
    ...(user?.role === 'ADMIN'
      ? [{ to: `/${ADMIN_PATH}/users`, label: 'অ্যাডমিন ইউজার', icon: UserCog }]
      : []),
    { to: `/${ADMIN_PATH}/trash`, label: 'ট্র্যাশ বিন', icon: Trash2 },
    { to: `/${ADMIN_PATH}/activity-logs`, label: 'লগ ও ব্যাকআপ', icon: History },
  ];

  const quickAddLinks = [
    { to: `/${ADMIN_PATH}/members`, label: 'নতুন আজীবন সদস্য', icon: Users },
    { to: `/${ADMIN_PATH}/land-donors`, label: 'নতুন জমিদাতা', icon: Landmark },
    { to: `/${ADMIN_PATH}/gallery`, label: 'নতুন ফটো অ্যালবাম', icon: Images },
    { to: `/${ADMIN_PATH}/notices`, label: 'নতুন নোটিশ', icon: Bell },
    { to: `/${ADMIN_PATH}/documents`, label: 'নতুন দলিল', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans">
      <SEO title="অ্যাডমিন প্যানেল - মানিকপুর ঈদগাহ" noIndex={true} />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-surface text-ink border-b border-sand shadow-sakinah-sm">
        <div className="px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl text-primary-dark hover:bg-primary-soft lg:hidden transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="মেনু খুলুন"
              aria-label="Toggle navigation drawer"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-soft border border-gold/40 flex items-center justify-center text-primary-dark font-bold text-sm">
                ম
              </div>
              <div>
                <span className="font-serif font-bold text-base sm:text-lg text-primary-dark tracking-wide block leading-none">
                  মানিকপুর ঈদগাহ
                </span>
                <span className="text-[10px] text-gold-text font-mono font-semibold">অ্যাডমিন নিয়ন্ত্রণ কক্ষ</span>
              </div>
            </div>
          </div>

          {/* User Status & Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Role Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft border border-primary/20 text-xs text-primary-dark">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">{user?.name}</span>
              <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-surface text-primary-dark border border-sand">
                {user?.role}
              </span>
            </div>

            {/* Visit Public Site */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-canvas-alt hover:bg-primary hover:text-white text-primary-dark text-xs font-semibold flex items-center gap-1.5 transition-colors border border-sand min-h-[38px]"
              title="ওয়েবসাইট দেখুন"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden md:inline">ওয়েবসাইট দেখুন</span>
            </a>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-danger-soft hover:bg-danger hover:text-white text-danger text-xs font-semibold flex items-center gap-1.5 transition-colors border border-danger/25 min-h-[38px]"
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
          className={`fixed inset-y-14 sm:inset-y-16 left-0 z-30 w-64 bg-sidebar text-sidebar-text border-r border-sand transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto ${
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
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[42px] ${
                        isActive
                          ? 'bg-primary text-white shadow-sakinah-sm font-bold'
                          : 'text-sidebar-text hover:bg-primary-soft/70 hover:text-primary-dark'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-sand text-[11px] text-ink-muted text-center">
              <span className="font-semibold text-primary-dark">মানিকপুর ঈদগাহ</span>
              <span className="block text-[10px] text-ink-muted mt-0.5">ভার্সন ১.০ (Next-Gen)</span>
            </div>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-scrim/50 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Main Content Area: pb-24 on mobile for bottom bar clearance */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8 bg-canvas">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Admin Mobile Bottom Tab Bar (4 tabs: Dashboard, Content, Add, Settings) */}
      <nav
        aria-label="Admin Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-sand shadow-sakinah-lift px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
      >
        <div className="grid grid-cols-4 items-center justify-around text-center">
          <NavLink
            to={`/${ADMIN_PATH}`}
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[46px] tap-feedback ${
                isActive ? 'text-primary font-bold bg-primary-soft/60' : 'text-ink-muted hover:text-primary'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-1 leading-none">ড্যাশবোর্ড</span>
          </NavLink>

          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[46px] tap-feedback ${
              sidebarOpen ? 'text-primary font-bold bg-primary-soft/60' : 'text-ink-muted hover:text-primary'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] mt-1 leading-none">কন্টেন্ট</span>
          </button>

          <button
            type="button"
            onClick={() => setAddSheetOpen(true)}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[46px] tap-feedback ${
              addSheetOpen ? 'text-primary font-bold bg-primary-soft/60' : 'text-ink-muted hover:text-primary'
            }`}
          >
            <PlusCircle className="w-5 h-5 text-primary" />
            <span className="text-[10px] mt-1 leading-none font-bold text-primary">যুক্ত করুন</span>
          </button>

          <NavLink
            to={`/${ADMIN_PATH}/settings`}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[46px] tap-feedback ${
                isActive ? 'text-primary font-bold bg-primary-soft/60' : 'text-ink-muted hover:text-primary'
              }`
            }
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] mt-1 leading-none">সেটিংস</span>
          </NavLink>
        </div>
      </nav>

      {/* Quick Add Bottom Sheet Modal */}
      {addSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-scrim/60 backdrop-blur-sm lg:hidden animate-fade-in flex flex-col justify-end"
          onClick={() => setAddSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-surface border-t-2 border-gold/50 rounded-t-[28px] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-sakinah-lift text-ink space-y-3 animate-slide-up"
          >
            <div className="flex items-center justify-between pb-2 border-b border-sand">
              <span className="font-serif font-bold text-base text-primary-dark">
                দ্রুত নতুন তথ্য যোগ করুন
              </span>
              <button
                type="button"
                onClick={() => setAddSheetOpen(false)}
                className="p-1 rounded-full bg-canvas-alt text-ink-muted hover:text-ink min-w-[32px] min-h-[32px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {quickAddLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setAddSheetOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-canvas-alt hover:bg-primary-soft/60 text-sm font-semibold text-primary-dark border border-sand transition-colors min-h-[46px] tap-feedback"
                  >
                    <Icon className="w-4 h-4 text-primary" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


