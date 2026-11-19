import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './components/layout/PublicLayout.jsx';
import { Home } from './pages/Home.jsx';

// Route-level code splitting for performance budget
const About = lazy(() => import('./pages/About.jsx').then((m) => ({ default: m.About })));
const LifetimeMembers = lazy(() => import('./pages/LifetimeMembers.jsx').then((m) => ({ default: m.LifetimeMembers })));
const LandDonors = lazy(() => import('./pages/LandDonors.jsx').then((m) => ({ default: m.LandDonors })));
const Donors = lazy(() => import('./pages/Donors.jsx').then((m) => ({ default: m.Donors })));
const Documents = lazy(() => import('./pages/Documents.jsx').then((m) => ({ default: m.Documents })));
const LandMaps = lazy(() => import('./pages/LandMaps.jsx').then((m) => ({ default: m.LandMaps })));
const Notices = lazy(() => import('./pages/Notices.jsx').then((m) => ({ default: m.Notices })));
const NoticeDetail = lazy(() => import('./pages/NoticeDetail.jsx').then((m) => ({ default: m.NoticeDetail })));
const Contact = lazy(() => import('./pages/Contact.jsx').then((m) => ({ default: m.Contact })));
const Gallery = lazy(() => import('./pages/Gallery.jsx').then((m) => ({ default: m.Gallery })));
const GalleryFolder = lazy(() => import('./pages/GalleryFolder.jsx').then((m) => ({ default: m.GalleryFolder })));
const Designs = lazy(() => import('./pages/Designs.jsx').then((m) => ({ default: m.Designs })));
const NotFound = lazy(() => import('./pages/NotFound.jsx').then((m) => ({ default: m.NotFound })));

// Lazy-loaded secret admin SPA chunk
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

// Get secret admin path from environment variable
const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || 'eidgah-manage-k29x';

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span className="text-xs text-ink-muted font-serif tracking-widest">লোড হচ্ছে...</span>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      {/* Secret Admin Panel Route (Only accessible via secret VITE_ADMIN_PATH) */}
      <Route
        path={`/${ADMIN_PATH}/*`}
        element={
          <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
            <AdminApp />
          </Suspense>
        }
      />

      {/* Public Pages Layout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<Suspense fallback={<PageFallback />}><About /></Suspense>} />
        <Route path="/lifetime-members" element={<Suspense fallback={<PageFallback />}><LifetimeMembers /></Suspense>} />
        <Route path="/land-donors" element={<Suspense fallback={<PageFallback />}><LandDonors /></Suspense>} />
        <Route path="/donors" element={<Navigate to="/land-donors" replace />} />
        <Route path="/donations" element={<Suspense fallback={<PageFallback />}><Donors /></Suspense>} />
        <Route path="/gallery" element={<Suspense fallback={<PageFallback />}><Gallery /></Suspense>} />
        <Route path="/gallery/:slug" element={<Suspense fallback={<PageFallback />}><GalleryFolder /></Suspense>} />
        <Route path="/designs" element={<Suspense fallback={<PageFallback />}><Designs /></Suspense>} />
        <Route path="/map" element={<Navigate to="/contact" replace />} />
        <Route path="/land-maps" element={<Suspense fallback={<PageFallback />}><LandMaps /></Suspense>} />
        <Route path="/documents" element={<Suspense fallback={<PageFallback />}><Documents /></Suspense>} />
        <Route path="/notices" element={<Suspense fallback={<PageFallback />}><Notices /></Suspense>} />
        <Route path="/notices/:slug" element={<Suspense fallback={<PageFallback />}><NoticeDetail /></Suspense>} />
        <Route path="/contact" element={<Suspense fallback={<PageFallback />}><Contact /></Suspense>} />

        {/* Decoy Scanner Paths -> Explicitly Render Public 404 */}
        <Route path="/admin" element={<Suspense fallback={<PageFallback />}><NotFound /></Suspense>} />
        <Route path="/admin/*" element={<Suspense fallback={<PageFallback />}><NotFound /></Suspense>} />
        <Route path="/login" element={<Suspense fallback={<PageFallback />}><NotFound /></Suspense>} />
        <Route path="/dashboard" element={<Suspense fallback={<PageFallback />}><NotFound /></Suspense>} />
        <Route path="/wp-admin" element={<Suspense fallback={<PageFallback />}><NotFound /></Suspense>} />
        <Route path="/wp-admin/*" element={<Suspense fallback={<PageFallback />}><NotFound /></Suspense>} />
        <Route path="/phpmyadmin" element={<Suspense fallback={<PageFallback />}><NotFound /></Suspense>} />
        <Route path="/phpmyadmin/*" element={<Suspense fallback={<PageFallback />}><NotFound /></Suspense>} />
        <Route path="/cpanel" element={<Suspense fallback={<PageFallback />}><NotFound /></Suspense>} />

        {/* 404 Catch-All within Public Layout */}
        <Route path="*" element={<Suspense fallback={<PageFallback />}><NotFound /></Suspense>} />
      </Route>
    </Routes>
  );
}
