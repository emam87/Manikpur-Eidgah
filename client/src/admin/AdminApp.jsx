import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext.jsx';
import { AdminLayout } from './components/AdminLayout.jsx';
import { AdminLogin } from './pages/AdminLogin.jsx';
import { ForcePasswordChange } from './pages/ForcePasswordChange.jsx';
import { AdminDashboard } from './pages/AdminDashboard.jsx';
import { AdminMembers } from './pages/AdminMembers.jsx';
import { AdminDonors } from './pages/AdminDonors.jsx';
import { AdminCommittee } from './pages/AdminCommittee.jsx';
import { AdminGallery } from './pages/AdminGallery.jsx';
import { AdminDocuments } from './pages/AdminDocuments.jsx';
import { AdminLandMaps } from './pages/AdminLandMaps.jsx';
import { AdminNotices } from './pages/AdminNotices.jsx';
import { AdminDesigns } from './pages/AdminDesigns.jsx';
import { AdminSettings } from './pages/AdminSettings.jsx';
import { AdminUsers } from './pages/AdminUsers.jsx';
import { AdminTrash } from './pages/AdminTrash.jsx';
import { AdminActivityLogs } from './pages/AdminActivityLogs.jsx';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Admin Panel Crash:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-red-200 text-stone-900 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-red-800">অ্যাডমিন প্যানেল রেন্ডারে সমস্যা হয়েছে</h2>
            <div className="text-xs text-stone-600 bg-stone-50 border border-stone-200 p-3 rounded-xl font-mono text-left max-h-32 overflow-y-auto">
              {this.state.error?.message || 'Unknown render error'}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-md w-full"
            >
              <RefreshCw className="w-4 h-4" />
              <span>পেজ রিফ্রেশ করুন (Refresh)</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AdminContent() {
  const { user, loading } = useAdminAuth();
  const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || 'eidgah-manage-k29x';

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center text-ivory">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin mb-3" />
        <span className="text-xs text-stone-400 font-mono">অথেনটিকেশন যাচাই হচ্ছে...</span>
      </div>
    );
  }

  // If not logged in, render Admin Login screen
  if (!user) {
    return <AdminLogin />;
  }

  // If mustChangePassword flag is true, force password change screen
  if (user.mustChangePassword) {
    return <ForcePasswordChange />;
  }

  // Authenticated: Render Admin Panel with sidebar layout
  return (
    <AdminErrorBoundary>
      <AdminLayout>
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="" element={<AdminDashboard />} />
          <Route path="/" element={<AdminDashboard />} />
          <Route path="login" element={<Navigate to={`/${ADMIN_PATH}`} replace />} />
          <Route path="members" element={<AdminMembers />} />
          <Route path="donors" element={<AdminDonors />} />
          <Route path="committee" element={<AdminCommittee />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="land-maps" element={<AdminLandMaps />} />
          <Route path="notices" element={<AdminNotices />} />
          <Route path="designs" element={<AdminDesigns />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="trash" element={<AdminTrash />} />
          <Route path="activity-logs" element={<AdminActivityLogs />} />
          <Route path="*" element={<Navigate to={`/${ADMIN_PATH}`} replace />} />
        </Routes>
      </AdminLayout>
    </AdminErrorBoundary>
  );
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <AdminContent />
    </AdminAuthProvider>
  );
}
