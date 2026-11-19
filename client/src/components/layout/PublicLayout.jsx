import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';
import { MobileTabBar } from './MobileTabBar.jsx';
import { ServerWakeupBanner } from '../common/ServerWakeupBanner.jsx';
import { BackToTopButton } from '../common/BackToTopButton.jsx';
import { A2HSHint } from '../common/A2HSHint.jsx';
import { SkipToContent } from '../common/SkipToContent.jsx';

export function PublicLayout() {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink transition-colors duration-200">
      <SkipToContent />
      <ServerWakeupBanner />
      <Navbar />
      <main id="main-content" className="flex-grow focus:outline-none">
        <Outlet />
      </main>
      <Footer />
      <MobileTabBar />
      <BackToTopButton />
      <A2HSHint />
    </div>
  );
}
