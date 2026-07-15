import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { DARK as D, LIGHT as L } from '../../styles/tokens';
import VideoCard from './VideoCard';
import LazyImage from '../common/LazyImage';
import { ShortCard } from './VideoShortsRow';

function useT() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const base = isDark ? D : L;
  return {
    isDark,
    text: base.txt,
    sub: base.txt2,
    muted: base.txt3,
    purple: base.accent,
    border: isDark ? D.cardBorder : 'rgba(0,0,0,0.08)',
    bg: isDark ? D.card : L.surface,
    bgHov: isDark ? D.cardHover : '#F5F5FA'
  };
}

function SectionHeader({ title, linkText, onLinkClick, color = '#8A2BFF' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
        <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--txt)', fontFamily: "'Geist',sans-serif" }}>
          {title}
        </h3>
      </div>
      {linkText && onLinkClick && (
        <span 
          onClick={onLinkClick} 
          style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}
        >
          {linkText}
        </span>
      )}
    </div>
  );
}

export default function VideoDiscoveryBlock({ videos = [], shorts = [], query = '', loading = false, onViewAllVideos, onViewAllShorts }) {
  const t = useT();
  const navigate = useNavigate();
  const [winWidth, setWinWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1024));

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = winWidth < 1024;

  const handleShortClick = (item) => {
    const index = shorts.findIndex(s => s.id === item.id);
    navigate(`/shorts/${item.id}`, {
      state: {
        shorts: shorts,
        startIndex: index >= 0 ? index : 0,
        query: query
      }
    });
  };

  if (loading) {
    return (
      <div style={{ marginBottom: 20 }}>
        <SectionHeader title="Videos" color="#8A2BFF" />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-card" style={{ aspectRatio: '16/9', borderRadius: 14, background: 'var(--s2)', animation: 'pulse 1.8s infinite ease-in-out' }} />
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0 && shorts.length === 0) return null;

  const topVideos = videos.slice(0, 3);
  const moreVideos = videos.slice(3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <style>{`
        .shorts-row-container {
          display: flex;
          gap: 10px;
          overflow-x: auto;
        }
        .short-card-item {
          flex-shrink: 0;
          width: 210px;
          height: 373px;
          border-radius: 16px;
        }
        @media (max-width: 768px) {
          .shorts-row-container {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            overflow-x: visible !important;
            gap: 10px;
          }
          .short-card-item {
            width: 100% !important;
            height: auto !important;
            aspect-ratio: 9/16;
            flex-shrink: 1;
          }
          .short-card-item:nth-child(n+5) {
            display: none !important;
          }
        }
      `}</style>
      {/* Top Videos */}
      {topVideos.length > 0 && (
        <div>
          <SectionHeader 
            title="Top Videos" 
            linkText="View all videos" 
            onLinkClick={onViewAllVideos} 
            color="#3B82F6" 
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 16 }}>
            {topVideos.map(v => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </div>
      )}

      {/* Shorts Row */}
      {shorts.length > 0 && (
        <div style={{
          margin: '0 -16px',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '16px 10px 0px'
        }}>
          <div style={{ padding: '0 16px' }}>
            <SectionHeader 
              title="Shorts" 
              linkText="View all shorts" 
              onLinkClick={onViewAllShorts} 
              color="#EF4444" 
            />
          </div>
          <div className="shorts-row-container hide-scrollbar" style={{ paddingBottom: 16 }}>
            {shorts.map((s, i) => (
              <ShortCard key={s.id} v={s} i={i} onClick={handleShortClick} />
            ))}
          </div>
        </div>
      )}

      {/* More Videos */}
      {moreVideos.length > 0 && (
        <div>
          <SectionHeader 
            title="More Videos" 
            linkText="View all videos" 
            onLinkClick={onViewAllVideos} 
            color="#8A2BFF" 
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 16 }}>
            {moreVideos.map(v => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
