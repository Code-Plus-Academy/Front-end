import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    font-family: 'Outfit', sans-serif;
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
            fontFamily: "'Outfit',sans-serif", fontWeight: 800
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
          <h2 style={{ fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 16, fontFamily: "'Outfit',sans-serif" }}>
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
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: t.text, fontFamily: "'Outfit',sans-serif" }}>Top Match</h3>
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
                      <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: t.text, fontFamily: "'Outfit',sans-serif" }}>{displayTitle}</h3>
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
                      <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: t.text, fontFamily: "'Outfit',sans-serif" }}>{displayTitle}</h3>
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
      <style>{ARTICLE_CARD_CSS}</style>
      
      {/* Search Header */}
      <div style={{ marginBottom: 24 }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{
            flex: 1, position: 'relative', display: 'flex', alignItems: 'center',
            background: t.isDark ? '#1a1a1a' : '#f3f4f6', borderRadius: 24,
            border: `1.5px solid ${t.border}`, overflow: 'hidden'
          }}>
            <span style={{ position: 'absolute', left: 16, fontSize: 18, color: t.muted }}>🔍</span>
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Search videos, courses, articles, and creators..."
              style={{
                width: '100%', padding: '12px 16px 12px 44px',
                background: 'transparent', border: 'none', outline: 'none',
                color: t.text, fontSize: 14, fontFamily: "'Inter',sans-serif"
              }}
            />
          </div>
          <button type="submit" style={{
            background: t.purple, color: '#fff', border: 'none', borderRadius: 24,
            padding: '0 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center',
            boxShadow: `0 4px 12px ${t.purple}30`
          }}>
            Search
          </button>
        </form>

        {/* Results Title & Filters Row */}
        {query.trim().length >= 2 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 16
          }}>
            <h1 style={{
              fontSize: 22, fontWeight: 800, color: t.text, margin: 0,
              fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.02em', lineHeight: 1.2
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
      </div>

      {/* Content Area */}
      <div style={{ minHeight: '50vh' }}>
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
