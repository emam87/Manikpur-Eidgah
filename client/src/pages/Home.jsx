import React, { useState, useEffect } from 'react';
import { SEO } from '../components/common/SEO.jsx';
import { HeroSection } from '../components/home/HeroSection.jsx';
import { StatsSection } from '../components/home/StatsSection.jsx';
import { LatestNoticesSection } from '../components/home/LatestNoticesSection.jsx';
import { RecentGallerySection } from '../components/home/RecentGallerySection.jsx';
import { DesignsTeaserSection } from '../components/home/DesignsTeaserSection.jsx';
import { MembersDonorsTeaser } from '../components/home/MembersDonorsTeaser.jsx';
import { TransparencyTeaser } from '../components/home/TransparencyTeaser.jsx';
import { CommitteePreviewSection } from '../components/home/CommitteePreviewSection.jsx';
import { MapTeaserSection } from '../components/home/MapTeaserSection.jsx';

export function Home() {
  const [homeData, setHomeData] = useState({
    stats: { members: 0, donors: 0, photos: 0 },
    latestNotices: [],
    recentAlbums: [],
    featuredDesignImages: [],
    committeeLeaders: [],
    featuredMembers: [],
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
    <>
      <SEO />
      <HeroSection />
      <StatsSection stats={homeData.stats} />
      <LatestNoticesSection notices={homeData.latestNotices} />
      <RecentGallerySection albums={homeData.recentAlbums} />
      <DesignsTeaserSection designs={homeData.featuredDesignImages} />
      <MembersDonorsTeaser members={homeData.featuredMembers} />
      <TransparencyTeaser />
      <CommitteePreviewSection leaders={homeData.committeeLeaders} />
      <MapTeaserSection />
    </>
  );
}

