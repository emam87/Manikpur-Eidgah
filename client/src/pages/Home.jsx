import React, { useState, useEffect } from 'react';
import { SEO } from '../components/common/SEO.jsx';
import { HeroSection } from '../components/home/HeroSection.jsx';
import { HomeJamatAndNotice } from '../components/home/HomeJamatAndNotice.jsx';
import { StatsSection } from '../components/home/StatsSection.jsx';
import { QuickLinksSection } from '../components/home/QuickLinksSection.jsx';
import { RecentGallerySection } from '../components/home/RecentGallerySection.jsx';
import { HomeDirectionsCard } from '../components/home/HomeDirectionsCard.jsx';

export function Home() {
  const [homeData, setHomeData] = useState({
    stats: { members: 0, donors: 0, photos: 0 },
    latestNotices: [],
    recentAlbums: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/home')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch home data');
        return res.json();
      })
      .then((data) => {
        if (data && data.success) {
          setHomeData(data);
        }
      })
      .catch(() => {
        // Fall back to clean default state
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="page-enter">
      <SEO />
      {/* Block 1: Compact Hero */}
      <HeroSection />

      {/* Block 2: Eid Jamat card (shown once) + Latest Notice card */}
      <HomeJamatAndNotice notices={homeData.latestNotices} />

      {/* Block 3: Compact Stats Row */}
      <StatsSection stats={loading ? null : homeData.stats} />

      {/* Block 4: 2x3 Quick Links Grid */}
      <QuickLinksSection />

      {/* Block 5: Horizontal Photo Strip (Max 6) */}
      <RecentGallerySection albums={homeData.recentAlbums} />

      {/* Block 6: Directions & Address Card */}
      <HomeDirectionsCard />
    </div>
  );
}
