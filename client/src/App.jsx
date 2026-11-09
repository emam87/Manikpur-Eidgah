import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './components/layout/PublicLayout.jsx';
import { Home } from './pages/Home.jsx';
import { NotFound } from './pages/NotFound.jsx';
import {
  About,
  LifetimeMembers,
  Donors,
  Gallery,
  GalleryFolder,
  Designs,
  MapPage,
  LandMaps,
  Documents,
  Notices,
  NoticeDetail,
  Contact,
} from './pages/PublicPages.jsx';

// Lazy-loaded secret admin SPA chunk
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

// Get secret admin path from environment variable
const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || 'eidgah-manage-k29x';

export function App() {
  return (
    <Routes>
      {/* Public Pages Layout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/lifetime-members" element={<LifetimeMembers />} />
        <Route path="/donors" element={<Donors />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/gallery/:slug" element={<GalleryFolder />} />
        <Route path="/designs" element={<Designs />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/land-maps" element={<LandMaps />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/notices/:slug" element={<NoticeDetail />} />
        <Route path="/contact" element={<Contact />} />

        {/* Decoy Scanner Paths -> Explicitly Render Public 404 */}
        <Route path="/admin" element={<NotFound />} />
        <Route path="/admin/*" element={<NotFound />} />
        <Route path="/login" element={<NotFound />} />
        <Route path="/dashboard" element={<NotFound />} />
        <Route path="/wp-admin" element={<NotFound />} />
        <Route path="/wp-admin/*" element={<NotFound />} />
        <Route path="/phpmyadmin" element={<NotFound />} />
        <Route path="/phpmyadmin/*" element={<NotFound />} />
        <Route path="/cpanel" element={<NotFound />} />

        {/* 404 Catch-All within Public Layout */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Secret Admin Panel Route (Only accessible via secret VITE_ADMIN_PATH) */}
      <Route
        path={`/${ADMIN_PATH}/*`}
        element={
          <Suspense fallback={<div className="min-h-screen bg-stone-900" />}>
            <AdminApp />
          </Suspense>
        }
      />
    </Routes>
  );
}
