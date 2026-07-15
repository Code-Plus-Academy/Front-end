import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import { DARK as D, LIGHT as L } from '../styles/tokens';
import { useAuth } from '../context/AuthContext';
import { TopProfileCard, PeopleCard } from '../components/people/PeopleCards';
import VideoCard from '../components/videos/VideoCard';
import VideoDiscoveryBlock from '../components/videos/VideoDiscoveryBlock';
import { ShortCard } from '../components/videos/VideoShortsRow';
import LazyImage from '../components/common/LazyImage';
import MobileBottomNav from '../components/layout/MobileBottomNav';

function useT() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const base = isDark ? D : L;
  return {
    isDark,
    bg: base.bg,
    card: isDark ? D.card : L.surface,
    text: base.txt,
    sub: base.txt2,
    muted: base.txt3,
    border: isDark ? D.cardBorder : 'rgba(0,0,0,0.08)',
    purple: base.accent,
    purpleDark: isDark ? '#9333EA' : '#7c3aed',
    purpleTint: isDark ? 'rgba(122,0,255,0.12)' : '#F3E8FF',
  };
}

const TABS = ['All', 'Videos', 'Shorts', 'People', 'Articles'];

// Utility for formatting view counts, time, and article covers
function timeAgo(date) {
  if (!date) return '';
  const m = Math.floor((Date.now() - new Date(date)) / 60000);
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  if (m < 43200) return `${Math.floor(m / 1440)}d ago`;
  return `${Math.floor(m / 43200)}mo ago`;
}

// -------------------------------------------------------------
// Article Search Card (Horizontal layout matching design)
// -------------------------------------------------------------
// Shared article card styles (injected once)
const ARTICLE_CARD_CSS = `
  .article-card-cover {
    width: 120px;
    min-height: 90px;
    border-radius: 12px;
    overflow: hidden;
    flex-shrink: 0;
    position: relative;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    background: linear-gradient(145deg, #1a1060, #0a0830);
  }
  .article-card-title {
    font-size: 15px;
    font-weight: 800;
    margin: 4px 0 6px 0;
    color: var(--txt);
    font-family: 'Geist', sans-serif;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .article-card-desc {
    font-size: 12px;
    color: var(--txt2);
    font-family: 'Inter', sans-serif;
    line-height: 1.5;
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  @media (max-width: 768px) {
    .article-card-cover {
      width: 80px !important;
      min-height: 80px !important;
      border-radius: 10px !important;
    }
    .article-card-title {
      font-size: 13px !important;
      margin: 2px 0 4px 0 !important;
    }
    .article-card-desc {
      display: none !important;
    }
  }
`;

function ArticleSearchCard({ article, t }) {
  const navigate = useNavigate();
  const type = article.page_type || 'standard-article';
  const isProject = type === 'project-showcase';
  const fallbackGrad = isProject
    ? 'linear-gradient(145deg, #002a38, #001520)'
    : 'linear-gradient(145deg, #1a1060, #0a0830)';

  let thumbnail = article.cover_image || article.og_image_url;
  if (!thumbnail) {
    const blocks = typeof article.content_blocks === 'string'
      ? (() => { try { return JSON.parse(article.content_blocks); } catch { return []; } })()
      : article.content_blocks || [];
    for (const b of blocks) {
      if (b?.src?.startsWith('http')) { thumbnail = b.src; break; }
      if (b?.url?.startsWith('http')) { thumbnail = b.url; break; }
      if (b?.html || b?.content) {
        const match = (b.html || b.content).match(/src=["'](http[^"']+)["']/);
        if (match) { thumbnail = match[1]; break; }
      }
    }
  }

  // Determine tag text
  let tagText = 'CONCEPTS';
  if (isProject) tagText = 'PROJECT';
  else if (type === 'tutorial') tagText = 'TUTORIAL';
  else if (article.tags && article.tags.length > 0) tagText = article.tags[0].toUpperCase();
  else if (article.category) tagText = article.category.toUpperCase();

  // Estimate read time
  const wordCount = (article.content || '').split(/\s+/).length || 150;
  const readTime = Math.max(2, Math.ceil(wordCount / 200));

  // Fallback icon letter from title
  const fallbackLetter = (article.title || 'A')[0].toUpperCase();

  return (
    <div
      onClick={() => navigate(`/articles/${article.slug || article.id}`)}
      style={{
        display: 'flex', gap: 14, padding: '14px 0', background: 'transparent',
        borderBottom: `1px solid ${t.border}`, cursor: 'pointer',
        transition: 'opacity 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = 0.92; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = 1; }}
    >
      {/* Thumbnail */}
      <div className="article-card-cover">
        {thumbnail ? (
          <LazyImage 
            src={thumbnail}
            alt={article.title || 'Article'}
            responsive={true}
            sizes="120px"
            skeletonColor={isProject ? '#002a38' : '#1a1060'}
            fallbackIcon={isProject ? '📂' : '📄'}
            fallbackBackground={fallbackGrad}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', minHeight: 90,
            background: fallbackGrad,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, color: 'rgba(255,255,255,0.5)',
            fontFamily: "'Geist',sans-serif", fontWeight: 800
          }}>
            {fallbackLetter}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Category Tag */}
        <span style={{
          fontSize: 9,
          fontWeight: 800,
          color: t.purple,
          letterSpacing: '0.08em',
          fontFamily: "'JetBrains Mono', monospace"
        }}>
          {tagText}
        </span>

        {/* Title */}
        <h3 className="article-card-title">
          {article.title}
        </h3>

        {/* Description */}
        <div className="article-card-desc">
          {article.description || article.excerpt || ''}
        </div>

        {/* Meta Row & Bookmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', width: '100%' }}>
          <span style={{ fontSize: 11, color: t.muted, fontFamily: "'Inter', sans-serif" }}>
            By {article.author_name || article.creator_username || 'Toppers Academy'} • {readTime} min read
          </span>
          
          <span 
            className="material-symbols-rounded" 
            style={{ 
              fontSize: 18, 
              color: t.muted, 
              cursor: 'pointer', 
              marginLeft: 'auto',
              padding: '0 4px'
            }} 
            onClick={e => { e.stopPropagation(); }}
          >
            bookmark
          </span>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Search Page Component
// -------------------------------------------------------------
export default function SearchPage() {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [inputVal, setInputVal] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('All');
  
  // Local pagination state
  const [visibleVideoCount, setVisibleVideoCount] = useState(6);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setVisibleVideoCount(window.innerWidth < 1024 ? 6 : 9);
    }
  }, []);
  
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [results, setResults] = useState({ topProfileCard: null, sections: [] });
  const { user } = useAuth();

  // Update when URL changes
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q') || '';
    if (q !== query) {
      setQuery(q);
      setInputVal(q);
      if (typeof window !== 'undefined') {
        setVisibleVideoCount(window.innerWidth < 1024 ? 6 : 9);
      }
    }
  }, [location.search, query]);

  // Fetch initial search results
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ topProfileCard: null, sections: [] });
      return;
    }

    const fetchSearch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}&limit=12`);
        setResults(res.data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSearch();
  }, [query]);

  const handleLoadMoreNetwork = async (sectionType) => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const currentSec = results.sections.find(s => s.type === sectionType || (sectionType === 'videos' && s.type === 'more_videos'));
      const offset = currentSec?.items?.length || 0;
      
      const res = await api.get(`/search?q=${encodeURIComponent(query)}&offset=${offset}&limit=12`);
      
      setResults(prev => {
        const next = { ...prev, sections: prev.sections.map(s => ({ ...s, items: [...s.items] })) };
        res.data.sections.forEach(newSec => {
          const oldSec = next.sections.find(s => s.type === newSec.type || (newSec.type === 'videos' && s.type === 'more_videos'));
          if (oldSec) {
             oldSec.items = [...oldSec.items, ...newSec.items];
             oldSec.hasMore = newSec.hasMore;
          } else {
             next.sections.push(newSec);
          }
        });
        return next;
      });
      
      if (sectionType === 'videos') {
        setVisibleVideoCount(prev => prev + 12);
      }
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      navigate(`/explore/search?q=${encodeURIComponent(inputVal.trim())}`);
    }
  };

  const handleAuthRequired = () => navigate('/login');

  // Filter sections by tab if not "All"
  const renderTabContent = () => {
    const isQueryEmpty = query.trim().length < 2;

    if (isQueryEmpty) {
      return (
        <div style={{ padding: '20px 0', animation: 'fadeIn 0.3s ease' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 16, fontFamily: "'Geist',sans-serif" }}>
            Trending Searches
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {['React Hooks', 'Next.js 14', 'System Design', 'Frontend Interviews', 'CSS Animations'].map(tag => (
              <button
                key={tag}
                onClick={() => {
                  setInputVal(tag);
                  navigate(`/explore/search?q=${encodeURIComponent(tag)}`);
                }}
                style={{
                  background: t.isDark ? '#1a1a1a' : '#f3f4f6',
                  border: `1px solid ${t.border}`,
                  padding: '10px 16px',
                  borderRadius: 20,
                  color: t.text,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = t.purple;
                  e.currentTarget.style.background = t.purpleTint;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = t.border;
                  e.currentTarget.style.background = t.isDark ? '#1a1a1a' : '#f3f4f6';
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16, color: t.purple }}>trending_up</span>
                {tag}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            border: `3px solid ${t.purple}33`, borderTopColor: t.purple,
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
      );
    }

    if (results.sections.length === 0 && !results.topProfileCard) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: t.sub }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>No results found for "{query}"</div>
          <div style={{ fontSize: 14, marginTop: 8, color: t.muted }}>Try different keywords or filters.</div>
        </div>
      );
    }

    if (activeTab === 'All') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Top Match Profile */}
          {results.topProfileCard && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: t.text, fontFamily: "'Geist',sans-serif" }}>Top Match</h3>
              <TopProfileCard profile={results.topProfileCard} onAuthRequired={handleAuthRequired} />
            </div>
          )}

          {/* Video & Shorts Woven Block */}
          {(() => {
            const videoSec = results.sections.find(s => s.type === 'videos' || s.type === 'more_videos');
            const shortsSec = results.sections.find(s => s.type === 'shorts');
            const allVideos = videoSec?.items || [];
            const allShorts = shortsSec?.items || [];
            
            if (allVideos.length === 0 && allShorts.length === 0) return null;
            
            const visibleVideos = allVideos.slice(0, visibleVideoCount);
            
            return (
              <div key="videos-woven">
                <VideoDiscoveryBlock 
                  videos={visibleVideos} 
                  shorts={allShorts} 
                  query={query} 
                  onViewAllVideos={() => { setActiveTab('Videos'); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  onViewAllShorts={() => { setActiveTab('Shorts'); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                />
                {visibleVideoCount < allVideos.length ? (
                  <button onClick={() => setVisibleVideoCount(prev => prev + 6)} style={{
                    width: '100%', padding: 12, background: t.purpleTint, color: t.purpleDark,
                    border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif",
                    transition: 'opacity 0.2s', marginTop: 16
                  }} onMouseEnter={e => e.currentTarget.style.opacity = 0.8} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                    Load more videos
                  </button>
                ) : videoSec?.hasMore ? (
                  <button onClick={() => handleLoadMoreNetwork('videos')} disabled={loadingMore} style={{
                    width: '100%', padding: 12, background: t.purpleTint, color: t.purpleDark,
                    border: 'none', borderRadius: 8, fontWeight: 600, cursor: loadingMore ? 'default' : 'pointer', fontFamily: "'Inter',sans-serif",
                    transition: 'opacity 0.2s', opacity: loadingMore ? 0.6 : 1, marginTop: 16
                  }}>
                    {loadingMore ? 'Loading...' : 'Load more videos'}
                  </button>
                ) : null}
              </div>
            );
          })()}

          {/* Other Dynamic Sections (People, Articles) */}
          {results.sections.filter(s => s.type !== 'videos' && s.type !== 'shorts' && s.type !== 'more_videos').map((sec, i) => {
            if (!sec.items || sec.items.length === 0) return null;

            const sectionTitles = {
              'people': 'People',
              'articles': 'Articles'
            };
            const displayTitle = sectionTitles[sec.type] || sec.type;

            const handleViewAll = () => {
              const targetTab = sec.type === 'people' ? 'People' : (sec.type === 'articles' ? 'Articles' : 'All');
              setActiveTab(targetTab);
              if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
            };

            const renderLoadMoreBtn = () => {
              if (!sec.hasMore) return null;
              return (
                <button onClick={() => handleLoadMoreNetwork(sec.type)} disabled={loadingMore} style={{
                  width: '100%', padding: 12, background: t.purpleTint, color: t.purpleDark,
                  border: 'none', borderRadius: 8, fontWeight: 600, cursor: loadingMore ? 'default' : 'pointer', fontFamily: "'Inter',sans-serif",
                  transition: 'opacity 0.2s', opacity: loadingMore ? 0.6 : 1, marginTop: 16
                }}>
                  {loadingMore ? 'Loading...' : `Load more ${displayTitle.toLowerCase()}`}
                </button>
              );
            };

            if (sec.type === 'people') {
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                      <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: t.text, fontFamily: "'Geist',sans-serif" }}>{displayTitle}</h3>
                    </div>
                    <span 
                      onClick={handleViewAll}
                      style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}
                    >
                      View all people
                    </span>
                  </div>
                  <div className="hide-scrollbar" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                    {sec.items.map(person => <PeopleCard key={person.id} person={person} onAuthRequired={handleAuthRequired} />)}
                  </div>
                  {renderLoadMoreBtn()}
                </div>
              );
            }

            if (sec.type === 'articles') {
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 6px #F59E0B' }} />
                      <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: t.text, fontFamily: "'Geist',sans-serif" }}>{displayTitle}</h3>
                    </div>
                    <span 
                      onClick={handleViewAll}
                      style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}
                    >
                      View all articles
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {sec.items.map(article => <ArticleSearchCard key={article.id} article={article} t={t} />)}
                  </div>
                  {renderLoadMoreBtn()}
                </div>
              );
            }

            return null;
          })}
        </div>
      );
    }

    // Specific Tabs Rendering
    const typeMap = { 'Videos': 'videos', 'Shorts': 'shorts', 'People': 'people', 'Articles': 'articles' };
    const tabType = typeMap[activeTab];
    const section = results.sections.find(s => s.type === tabType || (tabType === 'videos' && s.type === 'more_videos'));
    
    if (!section || !section.items || section.items.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: t.muted }}>
          No {activeTab.toLowerCase()} found for "{query}".
        </div>
      );
    }

    const renderLoadMoreBtn = () => {
      if (!section.hasMore) return null;
      return (
        <button onClick={() => handleLoadMoreNetwork(section.type)} disabled={loadingMore} style={{
          width: '100%', padding: 12, background: t.purpleTint, color: t.purpleDark,
          border: 'none', borderRadius: 8, fontWeight: 600, cursor: loadingMore ? 'default' : 'pointer', fontFamily: "'Inter',sans-serif",
          transition: 'opacity 0.2s', opacity: loadingMore ? 0.6 : 1, marginTop: 16
        }}>
          {loadingMore ? 'Loading...' : `Load more ${activeTab.toLowerCase()}`}
        </button>
      );
    };

    if (activeTab === 'Videos') {
      const allVideos = section.items;
      const visibleVideos = allVideos.slice(0, visibleVideoCount);
      // In the Videos-only tab, we still weave shorts if they exist in the results
      const shortsSec = results.sections.find(s => s.type === 'shorts');
      const allShorts = shortsSec?.items || [];
      
      return (
        <div>
          <VideoDiscoveryBlock videos={visibleVideos} shorts={allShorts} query={query} />
          {visibleVideoCount < allVideos.length ? (
            <button onClick={() => setVisibleVideoCount(prev => prev + 6)} style={{
              width: '100%', padding: 12, background: t.purpleTint, color: t.purpleDark,
              border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif",
              transition: 'opacity 0.2s', marginTop: 16
            }} onMouseEnter={e => e.currentTarget.style.opacity = 0.8} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
              Load more videos
            </button>
          ) : renderLoadMoreBtn()}
        </div>
      );
    }

    if (activeTab === 'Shorts') {
      return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(136px, 1fr))', gap: 16 }}>
            {section.items.map((short, idx) => (
              <ShortCard 
                key={short.id} 
                v={short} 
                i={idx} 
                onClick={(v) => {
                  navigate(`/shorts/${v.id}`, {
                    state: {
                      shorts: section.items,
                      startIndex: idx,
                      query: query
                    }
                  });
                }} 
              />
            ))}
          </div>
          {renderLoadMoreBtn()}
        </div>
      );
    }

    if (activeTab === 'People') {
      return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {section.items.map(person => <PeopleCard key={person.id} person={person} onAuthRequired={handleAuthRequired} />)}
          </div>
          {renderLoadMoreBtn()}
        </div>
      );
    }

    if (activeTab === 'Articles') {
      return (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {section.items.map(article => <ArticleSearchCard key={article.id} article={article} t={t} />)}
          </div>
          {renderLoadMoreBtn()}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="search-page-wrapper" style={{ padding: '0 16px 40px', maxWidth: 1040, margin: '0 auto', width: '100%' }}>
      <Helmet><title>Search "{query}" - Code+ Academy</title></Helmet>
      <style>{`
        ${ARTICLE_CARD_CSS}

        /* YouTube Masthead Container */
        .ytd-masthead-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: ${t.card};
          border: 1px solid ${t.border};
          border-radius: 20px;
          margin-bottom: 24px;
          gap: 16px;
          box-shadow: ${t.isDark ? '0 12px 36px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.03)'};
        }

        .ytd-masthead-start {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .ytd-topbar-logo-renderer {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .yt-simple-endpoint {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: ${t.text};
        }

        #country-code {
          font-size: 10px;
          color: ${t.muted};
          align-self: flex-start;
          margin-top: -2px;
          font-weight: 500;
        }

        .ytd-masthead-center {
          display: flex;
          align-items: center;
          flex: 1;
          max-width: 600px;
          justify-content: center;
        }

        .ytSearchboxComponentHost {
          display: flex;
          width: 100%;
        }

        .ytSearchboxComponentInputWrapper {
          display: flex;
          flex: 1;
          position: relative;
        }

        .ytSearchboxComponentInputContainer {
          display: flex;
          width: 100%;
          align-items: center;
          border-radius: 40px;
          border: 1px solid ${t.border};
          background: ${t.isDark ? '#1a1a1a' : '#f3f4f6'};
          overflow: hidden;
          height: 40px;
          transition: all 0.2s ease;
        }

        .ytSearchboxComponentInputContainer:focus-within {
          border-color: ${t.purple};
          box-shadow: 0 0 0 1px ${t.purple};
          background: ${t.isDark ? '#000000' : '#ffffff'};
        }

        .ytSearchboxComponentInputBox {
          display: flex;
          flex: 1;
          height: 100%;
          padding: 0 16px;
          align-items: center;
        }

        .ytSearchboxComponentSearchForm {
          display: flex;
          flex: 1;
          height: 100%;
        }

        .ytSearchboxComponentInput {
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: ${t.text};
          font-size: 15px;
          font-family: inherit;
        }

        .ytSearchboxComponentSearchButton {
          width: 64px;
          height: 100%;
          border: none;
          background: ${t.isDark ? '#222222' : '#e2e8f0'};
          border-left: 1px solid ${t.border};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${t.text};
          transition: background 0.2s;
        }

        .ytSearchboxComponentSearchButton:hover {
          background: ${t.isDark ? '#333333' : '#cbd5e1'};
        }

        #voice-search-button {
          margin-left: 8px;
          display: flex;
          align-items: center;
        }

        .voice-search-btn {
          background: ${t.isDark ? '#222222' : '#e2e8f0'};
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: ${t.text};
          transition: background 0.2s;
        }

        .voice-search-btn:hover {
          background: ${t.isDark ? '#333333' : '#cbd5e1'};
        }

        .ytd-masthead-end {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .yt-icon-button {
          background: transparent;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          color: ${t.text};
          transition: background 0.2s;
        }

        .yt-icon-button:hover {
          background: ${t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'};
        }

        .yt-icon-shape {
          width: 24px;
          height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        /* Responsive styles */
        @media (max-width: 800px) {
          #guide-button, #voice-search-button, #logo, .ytd-masthead-end {
            display: none !important;
          }
          .ytd-masthead-start {
            margin-right: 4px;
          }
          .ytd-masthead-center {
            max-width: none;
            width: 100%;
          }
          .ytd-masthead-container {
            border-radius: 0;
            border-left: none;
            border-right: none;
            padding: 8px 12px;
            margin: 0 -16px 20px -16px;
          }
          .ytSearchboxComponentSearchButton {
            width: 50px;
          }
        }
        @media (min-width: 801px) {
          .ytd-masthead-container {
            display: none !important;
          }
        }
      `}</style>

      {/* YouTube Masthead Container */}
      <div className="ytd-masthead-container">
        <div id="start" className="ytd-masthead-start">
          <button
            id="back-button"
            className="yt-icon-button"
            aria-label="Back"
            onClick={() => navigate(-1)}
          >
            <span className="yt-icon-shape">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ pointerEvents: 'none', display: 'inherit', width: '100%', height: '100%', fill: 'currentColor' }}>
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path>
              </svg>
            </span>
          </button>
          
          <button id="guide-button" className="yt-icon-button" aria-label="Guide">
            <span className="yt-icon-shape">
              <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" style={{ pointerEvents: 'none', display: 'inherit', width: '100%', height: '100%', fill: 'currentColor' }}>
                <path d="M20 5H4a1 1 0 000 2h16a1 1 0 100-2Zm0 6H4a1 1 0 000 2h16a1 1 0 000-2Zm0 6H4a1 1 0 000 2h16a1 1 0 000-2Z"></path>
              </svg>
            </span>
          </button>
          
          <div id="logo" className="ytd-topbar-logo-renderer">
            <Link to="/feed" className="yt-simple-endpoint">
              <span className="yt-icon-shape" style={{ width: 93, height: 20 }}>
                <svg xmlns="http://www.w3.org/2000/svg" id="yt-ringo2-svg_yt9" width="93" height="20" viewBox="0 0 93 20" style={{ pointerEvents: 'none', display: 'inherit', width: '100%', height: '100%' }}>
                  <g>
                    <path d="M14.4848 20C14.4848 20 23.5695 20 25.8229 19.4C27.0917 19.06 28.0459 18.08 28.3808 16.87C29 14.65 29 9.98 29 9.98C29 9.98 29 5.34 28.3808 3.14C28.0459 1.9 27.0917 0.94 25.8229 0.61C23.5695 0 14.4848 0 14.4848 0C14.4848 0 5.42037 0 3.17711 0.61C1.9286 0.94 0.954148 1.9 0.59888 3.14C0 5.34 0 9.98 0 9.98C0 9.98 0 14.65 0.59888 16.87C0.954148 18.08 1.9286 19.06 3.17711 19.4C5.42037 20 14.4848 20 14.4848 20Z" fill="#FF0033"></path>
                    <path d="M19 10L11.5 5.75V14.25L19 10Z" fill="white"></path>
                  </g>
                  <g id="youtube-paths_yt9" fill="currentColor">
                    <path d="M37.1384 18.8999V13.4399L40.6084 2.09994H38.0184L36.6984 7.24994C36.3984 8.42994 36.1284 9.65994 35.9284 10.7999H35.7684C35.6584 9.79994 35.3384 8.48994 35.0184 7.22994L33.7384 2.09994H31.1484L34.5684 13.4399V18.8999H37.1384Z"></path>
                    <path d="M44.1003 6.29994C41.0703 6.29994 40.0303 8.04994 40.0303 11.8199V13.6099C40.0303 16.9899 40.6803 19.1099 44.0403 19.1099C47.3503 19.1099 48.0603 17.0899 48.0603 13.6099V11.8199C48.0603 8.44994 47.3803 6.29994 44.1003 6.29994ZM45.3903 14.7199C45.3903 16.3599 45.1003 17.3899 44.0503 17.3899C43.0203 17.3899 42.7303 16.3499 42.7303 14.7199V10.6799C42.7303 9.27994 42.9303 8.02994 44.0503 8.02994C45.2303 8.02994 45.3903 9.34994 45.3903 10.6799V14.7199Z"></path>
                    <path d="M52.2713 19.0899C53.7313 19.0899 54.6413 18.4799 55.3913 17.3799H55.5013L55.6113 18.8999H57.6012V6.53994H54.9613V16.4699C54.6812 16.9599 54.0312 17.3199 53.4212 17.3199C52.6512 17.3199 52.4113 16.7099 52.4113 15.6899V6.53994H49.7812V15.8099C49.7812 17.8199 50.3613 19.0899 52.2713 19.0899Z"></path>
                    <path d="M62.8261 18.8999V4.14994H65.8661V2.09994H57.1761V4.14994H60.2161V18.8999H62.8261Z"></path>
                    <path d="M67.8728 19.0899C69.3328 19.0899 70.2428 18.4799 70.9928 17.3799H71.1028L71.2128 18.8999H73.2028V6.53994H70.5628V16.4699C70.2828 16.9599 69.6328 17.3199 69.0228 17.3199C68.2528 17.3199 68.0128 16.7099 68.0128 15.6899V6.53994H65.3828V15.8099C65.3828 17.8199 65.9628 19.0899 67.8728 19.0899Z"></path>
                    <path d="M80.6744 6.26994C79.3944 6.26994 78.4744 6.82994 77.8644 7.73994H77.7344C77.8144 6.53994 77.8744 5.51994 77.8744 4.70994V1.43994H75.3244L75.3144 12.1799L75.3244 18.8999H77.5444L77.7344 17.6999H77.8044C78.3944 18.5099 79.3044 19.0199 80.5144 19.0199C82.5244 19.0199 83.3844 17.2899 83.3844 13.6099V11.6999C83.3844 8.25994 82.9944 6.26994 80.6744 6.26994ZM80.7644 13.6099C80.7644 15.9099 80.4244 17.2799 79.3544 17.2799C78.8544 17.2799 78.1644 17.0399 77.8544 16.5899V9.23994C78.1244 8.53994 78.7244 8.02994 79.3944 8.02994C80.4744 8.02994 80.7644 9.33994 80.7644 11.7299V13.6099Z"></path>
                    <path d="M92.6517 11.4999C92.6517 8.51994 92.3517 6.30994 88.9217 6.30994C85.6917 6.30994 84.9717 8.45994 84.9717 11.6199V13.7899C84.9717 16.8699 85.6317 19.1099 88.8417 19.1099C91.3817 19.1099 92.6917 17.8399 92.5417 15.3799L90.2917 15.2599C90.2617 16.7799 89.9117 17.3999 88.9017 17.3999C87.6317 17.3999 87.5717 16.1899 87.5717 14.3899V13.5499H92.6517V11.4999ZM88.8617 7.96994C90.0817 7.96994 90.1717 9.11994 90.1717 11.0699V12.0799H87.5717V11.0699C87.5717 9.13994 87.6517 7.96994 88.8617 7.96994Z"></path>
                  </g>
                </svg>
              </span>
            </Link>
            <span id="country-code">IN</span>
          </div>
        </div>

        <div id="center" className="ytd-masthead-center">
          <div className="ytSearchboxComponentHost ytSearchboxComponentDesktop ytSearchboxComponentHostDark ytSearchboxComponentHostNoSuggestions">
            <div className="ytSearchboxComponentInputWrapper">
              <div className="ytSearchboxComponentInputContainer">
                <div className="ytSearchboxComponentInputBox ytSearchboxComponentInputBoxDark">
                  <form onSubmit={handleSearchSubmit} className="ytSearchboxComponentSearchForm">
                    <input
                      className="ytSearchboxComponentInput yt-searchbox-input title"
                      name="search_query"
                      type="text"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                      placeholder="Search"
                      value={inputVal}
                      onChange={e => setInputVal(e.target.value)}
                    />
                  </form>
                </div>
                <button
                  type="submit"
                  onClick={handleSearchSubmit}
                  aria-label="Search"
                  className="ytSearchboxComponentSearchButton ytSearchboxComponentSearchButtonDark"
                  title="Search"
                >
                  <span className="ytIconWrapperHost">
                    <span className="yt-icon-shape">
                      <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" style={{ pointerEvents: 'none', display: 'inherit', width: '100%', height: '100%', fill: 'currentColor' }}>
                        <path d="M11 2a9 9 0 105.641 16.01.966.966 0 00.152.197l3.5 3.5a1 1 0 101.414-1.414l-3.5-3.5a1 1 0 00-.197-.153A8.96 8.96 0 0020 11a9 9 0 00-9-9Zm0 2a7 7 0 110 14 7 7 0 010-14Z"></path>
                      </svg>
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>
          <div id="voice-search-button">
            <button className="voice-search-btn" title="Search with your voice">
              <span className="yt-icon-shape">
                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" style={{ pointerEvents: 'none', display: 'inherit', width: '100%', height: '100%', fill: 'currentColor' }}>
                  <path d="M18.063 14.5a1 1 0 111.73 1A8.998 8.998 0 0113 19.942V22a1 1 0 11-2 0v-2.058A8.999 8.999 0 014.206 15.5l.866-.5.865-.5a7.002 7.002 0 0012.125 0ZM12 1a5 5 0 015 5v5a5 5 0 01-10 0V6a5 5 0 015-5ZM4.572 14.134a1 1 0 011.365.366l-1.731 1a1 1 0 01.366-1.366ZM12 3a3 3 0 00-3 3v5a3 3 0 106 0V6a3 3 0 00-3-3Z"></path>
                </svg>
              </span>
            </button>
          </div>
        </div>

        <div id="end" className="ytd-masthead-end">
          <div id="buttons" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Create button */}
            <button
              className="action-btn"
              onClick={() => navigate('/posts/new')}
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: t.text,
                padding: '8px 14px',
                fontSize: 13,
                border: `1px solid ${t.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 24 24" width="18" fill="currentColor">
                <path d="M12 3a1 1 0 00-1 1v7H4a1 1 0 000 2h7v7a1 1 0 002 0v-7h7a1 1 0 000-2h-7V4a1 1 0 00-1-1Z"></path>
              </svg>
              Create
            </button>
            
            {/* Notification button */}
            <button
              className="yt-icon-button"
              onClick={() => navigate('/notifications')}
              aria-label="Notifications"
            >
              <span className="yt-icon-shape">
                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" style={{ pointerEvents: 'none', display: 'inherit', width: '100%', height: '100%', fill: 'currentColor' }}>
                  <path d="M16 19a4 4 0 11-8 0H4.765C3.21 19 2.25 17.304 3.05 15.97l1.806-3.01A1 1 0 005 12.446V8a7 7 0 0114 0v4.446c0 .181.05.36.142.515l1.807 3.01c.8 1.333-.161 3.029-1.716 3.029H16ZM12 3a5 5 0 00-5 5v4.446a3 3 0 01-.428 1.543L4.765 17h14.468l-1.805-3.01A3 3 0 0117 12.445V8a5 5 0 00-5-5Zm-2 16a2 2 0 104 0h-4Z"></path>
                </svg>
              </span>
            </button>

            {/* Avatar button */}
            <button
              id="avatar-btn"
              className="yt-icon-button"
              aria-label="Account menu"
              onClick={() => navigate(user ? `/u/${user.username}` : '/login')}
              style={{ padding: 2 }}
            >
              <img
                alt="Avatar"
                height="32"
                width="32"
                src={user?.avatar_url || 'https://yt3.ggpht.com/yti/ANjgQV-ra9qU1yJQnUkusr5X30fHFd04oDSKK-PLiJZqLzofvQ=s88-c-k-c0x00ffffff-no-rj-mo'}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
            </button>
          </div>
        </div>
      </div>


        {/* Results Title & Filters Row */}
        {query.trim().length >= 2 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 16
          }}>
            <h1 style={{
              fontSize: 22, fontWeight: 800, color: t.text, margin: 0,
              fontFamily: "'Geist',sans-serif", letterSpacing: '-0.02em', lineHeight: 1.2
            }}>
              Search results for <span style={{ color: t.purple }}>"{query}"</span>
            </h1>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: 'transparent', border: `1px solid ${t.border}`, borderRadius: 20,
              color: t.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif"
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-8h6m2 10h6" strokeLinecap="round"/>
              </svg>
              Filters
            </button>
          </div>
        )}

        {/* Tabs Pills */}
        {query.trim().length >= 2 && (
          <div className="hide-scrollbar" style={{
            display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12,
            borderBottom: `1px solid ${t.border}`
          }}>
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px', borderRadius: 20,
                  background: activeTab === tab ? t.purple : (t.isDark ? '#1a1a1a' : '#f3f4f6'),
                  color: activeTab === tab ? '#fff' : t.text,
                  border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  fontFamily: "'Inter',sans-serif", whiteSpace: 'nowrap', transition: 'all 0.2s'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        )}


      {/* Content Area */}
     <div style={{ minHeight: query.trim().length >= 2 ? '50vh' : 'auto' }}>
  {renderTabContent()}
</div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .hide-scrollbar {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        @media (min-width: 1024px) {
          .search-page-wrapper {
            padding-left: 24px !important;
            padding-right: 24px !important;
          }
        }
        @media (max-width: 480px) {
          .search-page-wrapper {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
        }
      `}</style>
      <MobileBottomNav />
    </div>
  );
}
