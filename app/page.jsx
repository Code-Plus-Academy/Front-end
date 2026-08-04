'use client';

import { useState } from 'react';
import { Navbar } from '@/src/components/navbar_landing';
import { Hero } from '@/src/components/hero_landing';
import { ExploreHubSpotlight } from '@/src/components/explore_hub_landing';
import { SocialCluster } from '@/src/components/social_cluster_landing';
import { LearningCluster } from '@/src/components/learning_cluster_landing';
import { StudioSpotlight } from '@/src/components/studio_spotlight_landing';
import { InteractiveAppDemo } from '@/src/components/interactive_demo_landing';
import { Footer } from '@/src/components/footer_landing';
import { VantaGlobeBackground } from '@/src/components/vanta_globe_landing';
import { ThemeProvider } from '@/src/context/ThemeContext';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('feed');

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-purple-500 selection:text-white transition-colors duration-300 relative overflow-x-hidden">
        <VantaGlobeBackground />
        <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />
        <main>
          <Hero onSelectTab={setActiveTab} />
          <SocialCluster />
          <LearningCluster />
          <ExploreHubSpotlight />
          <StudioSpotlight />
          <InteractiveAppDemo />
        </main>
        <Footer onSelectTab={setActiveTab} />
      </div>
    </ThemeProvider>
  );
}
