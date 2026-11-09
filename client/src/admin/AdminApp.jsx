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
import { Loader2 } from 'lucide-react';

function AdminContent() {
  const { user, loading } = useAdminAuth();

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
    <AdminLayout>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
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
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </AdminLayout>
  );
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <AdminContent />
    </AdminAuthProvider>
  );
}
