import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';
import { ServerWakeupBanner } from '../common/ServerWakeupBanner.jsx';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory-100">
      <ServerWakeupBanner />
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
