import React, { useState } from 'react';
import { Navbar } from './components/navbar_landing';
import { Hero } from './components/hero_landing';
import { ExploreHubSpotlight } from './components/explore_hub_landing';
import { SocialCluster } from './components/social_cluster_landing';
import { LearningCluster } from './components/learning_cluster_landing';
import { StudioSpotlight } from './components/studio_spotlight_landing';
import { InteractiveAppDemo } from './components/interactive_demo_landing';
import { Footer } from './components/footer_landing';
import { VantaGlobeBackground } from './components/vanta_globe_landing';
import { TabType } from './models';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('social');
  const { theme } = useTheme();

  const scrollToExplore = () => {
    const exploreElement = document.getElementById('explore-spotlight');
    if (exploreElement) {
      exploreElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`relative min-h-screen transition-colors duration-200 font-sans ${
      theme === 'dark' 
        ? 'bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950' 
        : 'bg-slate-50 text-slate-900 selection:bg-cyan-500 selection:text-white'
    }`}>
      {/* Interactive Vanta Globe Background Canvas */}
      <VantaGlobeBackground />

      <div className="relative z-10">
        {/* 1. Header Navigation Bar */}
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onOpenDemo={scrollToExplore} 
        />

        {/* 2. Hero Section */}
        <Hero 
          onExploreClick={scrollToExplore} 
          onSelectTab={setActiveTab} 
        />

        {/* 3. Explore Content Discovery Hub Spotlight */}
        <div id="explore-spotlight">
          <ExploreHubSpotlight />
        </div>

        {/* 4. Group A: Social Feature Cluster (Feed, Network, Profile) */}
        <div id="social-section">
          <SocialCluster />
        </div>

        {/* 5. Group B: Learning & Development Cluster (Notes Arena, Articles) */}
        <div id="learning-section">
          <LearningCluster />
        </div>

        {/* 6. Creator Studio Command Center */}
        <div id="studio-section">
          <StudioSpotlight />
        </div>

        {/* 7. Live CPA Platform Interactive Explore */}
        <InteractiveAppDemo />

        {/* 8. Corporate Footer */}
        <Footer onSelectTab={setActiveTab} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainAppContent />
    </ThemeProvider>
  );
}
