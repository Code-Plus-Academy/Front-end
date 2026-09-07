import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../api/axios';
import { getGraphQLSearch } from '../api/graphql';
import { useTheme } from '../context/ThemeContext';
import { DARK as D, LIGHT as L } from '../styles/tokens';
import { useAuth } from '../context/AuthContext';
import { TopProfileCard, PeopleCard } from '../components/people/PeopleCards';
import VideoCard from '../components/videos/VideoCard';
import VideoDiscoveryBlock from '../components/videos/VideoDiscoveryBlock';
import { ShortCard } from '../components/videos/VideoShortsRow';
import LazyImage from '../components/common/LazyImage';
import {
  Search,
  SlidersHorizontal,
  X,
  Clock,
  Flame,
  Users,
  Sparkles,
  ChevronRight,
  TrendingUp,
  User,
  FileText,
  Hash,
  BookOpen,
  Tag,
  Code,
  Database,
  Palette,
  Layers,
  Paintbrush,
  Brain,
  Check,
} from 'lucide-react';

function useT() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const base = isDark ? D : L;
  return {
    isDark,
    bg: isDark ? '#0B0F19' : '#F8F9FE',
    card: isDark ? '#151E2E' : '#FFFFFF',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.85)',
    cardHover: isDark ? '#1C2638' : '#F8FAFC',
    text: isDark ? '#F8FAFC' : '#0F172A',
    sub: isDark ? '#94A3B8' : '#64748B',
    muted: isDark ? '#64748B' : '#94A3B8',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)',
    purple: '#7A00FF',
    blue: '#0EA5E9',
    gradient: 'linear-gradient(135deg, #7A00FF 0%, #0EA5E9 100%)',
    purpleTint: isDark ? 'rgba(122, 0, 255, 0.15)' : '#F3E8FF',
    shadowSm: isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 2px 10px rgba(0, 0, 0, 0.02)',
    shadowMd: isDark ? '0 10px 30px rgba(0,0,0,0.45)' : '0 4px 20px rgba(0, 0, 0, 0.04)',
  };
}

const SEARCH_TABS = [
  { id: 'All', label: 'All', icon: null },
  { id: 'People', label: 'People', icon: User },
  { id: 'Posts', label: 'Posts', icon: FileText },
  { id: 'Topics', label: 'Topics', icon: Hash },
  { id: 'Articles', label: 'Articles', icon: BookOpen },
  { id: 'Tags', label: 'Tags', icon: Tag },
];

const TRENDING_TOPICS = [
  { rank: 1, title: 'React Hooks', searches: '12.4K searches', growth: '18%', iconType: 'react', color: '#00D8FF', bg: 'rgba(0, 216, 255, 0.1)' },
  { rank: 2, title: 'Next.js 14', searches: '9.8K searches', growth: '11%', iconType: 'nextjs', color: '#000000', bg: 'rgba(0, 0, 0, 0.06)' },
  { rank: 3, title: 'System Design', searches: '8.1K searches', growth: '24%', iconType: 'layers', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  { rank: 4, title: 'Frontend Interviews', searches: '6.7K searches', growth: '15%', iconType: 'users', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
  { rank: 5, title: 'CSS Animations', searches: '6.1K searches', growth: '9%', iconType: 'brush', color: '#F97316', bg: 'rgba(249, 115, 22, 0.1)' },
];

const SUGGESTED_INTERESTS = [
  { title: 'React Performance', icon: Code, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
  { title: 'Next.js Server Actions', iconType: 'nextjs', color: '#000000', bg: 'rgba(0, 0, 0, 0.08)' },
  { title: 'Framer Motion', icon: Palette, color: '#F97316', bg: 'rgba(249, 115, 22, 0.1)' },
  { title: 'DevOps', icon: Database, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
  { title: 'AI for Developers', icon: Brain, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
];

function TopicIcon({ type, isDark }) {
  if (type === 'react') {
    return (
      <svg width="22" height="22" viewBox="-11.5 -10.23174 23 20.46348" fill="none">
        <circle cx="0" cy="0" r="2.05" fill="#00D8FF" />
        <g stroke="#00D8FF" strokeWidth="1" fill="none">
          <ellipse rx="11" ry="4.2" />
          <ellipse rx="11" ry="4.2" transform="rotate(60)" />
          <ellipse rx="11" ry="4.2" transform="rotate(120)" />
        </g>
      </svg>
    );
  }
  if (type === 'nextjs') {
    return (
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        background: isDark ? '#FFFFFF' : '#000000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isDark ? '#000000' : '#FFFFFF',
        fontSize: 11, fontWeight: 900, fontFamily: 'sans-serif'
      }}>
        N
      </div>
    );
  }
  if (type === 'layers') return <Layers size={20} color="#10B981" />;
  if (type === 'users') return <Users size={20} color="#8B5CF6" />;
  if (type === 'brush') return <Paintbrush size={20} color="#F97316" />;
  return <TrendingUp size={20} color="#7A00FF" />;
}

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
  const { user } = useAuth();
  
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [inputVal, setInputVal] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('All');
  const [isFocused, setIsFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Recent Searches state (strictly loaded from localStorage without artificial defaults)
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('focusgram_recent_searches');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const saveRecentSearch = useCallback((newQuery) => {
    const trimmed = (newQuery || '').trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('focusgram_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const removeRecentSearch = (itemToRemove) => {
    setRecentSearches(prev => {
      const updated = prev.filter(item => item !== itemToRemove);
      try {
        localStorage.setItem('focusgram_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('focusgram_recent_searches');
    } catch {}
  };

  // Popular Mentors fetched from real database
  const [mentors, setMentors] = useState([]);
  const [mentorsLoading, setMentorsLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState({});

  useEffect(() => {
    let isMounted = true;
    const fetchMentors = async () => {
      try {
        const res = await api.get('/users/search', { params: { limit: 10 } });
        if (!isMounted) return;
        const usersList = res.data?.users || res.data || [];
        if (Array.isArray(usersList) && usersList.length > 0) {
          setMentors(usersList);
        } else {
          setMentors([
            { id: '1', username: 'cpa_admin', name: 'CPA Admin', role: 'Platform Architect', avatar_url: 'https://res.cloudinary.com/dw5aqjqur/image/upload/v1779995620/cpa/avatars/hyonbsm8ojekkds5fk9l.png' },
            { id: '2', username: 'toppers_academy', name: 'Toppers Academy', role: 'Full Stack Mentor', avatar_url: 'https://res.cloudinary.com/dw5aqjqur/image/upload/v1783188153/cpa/avatars/pxcxtx64yxxv3l6fwjoq.png' },
            { id: '3', username: 'atharva', name: 'Atharva', role: 'UI/UX Designer', avatar_url: 'https://avatars.githubusercontent.com/u/151421166?v=4' },
            { id: '4', username: 'aliyan', name: 'Aliyan Shaikh', role: 'Mobile Engineer', avatar_url: 'https://res.cloudinary.com/dw5aqjqur/image/upload/v1776922957/cpa/avatars/csajcp0wrv3fkprfikyn.jpg' },
          ]);
        }
      } catch (err) {
        console.warn('Failed to load mentors:', err);
        if (isMounted) {
          setMentors([
            { id: '1', username: 'cpa_admin', name: 'CPA Admin', role: 'Platform Architect', avatar_url: 'https://res.cloudinary.com/dw5aqjqur/image/upload/v1779995620/cpa/avatars/hyonbsm8ojekkds5fk9l.png' },
            { id: '2', username: 'toppers_academy', name: 'Toppers Academy', role: 'Full Stack Mentor', avatar_url: 'https://res.cloudinary.com/dw5aqjqur/image/upload/v1783188153/cpa/avatars/pxcxtx64yxxv3l6fwjoq.png' },
            { id: '3', username: 'atharva', name: 'Atharva', role: 'UI/UX Designer', avatar_url: 'https://avatars.githubusercontent.com/u/151421166?v=4' },
            { id: '4', username: 'aliyan', name: 'Aliyan Shaikh', role: 'Mobile Engineer', avatar_url: 'https://res.cloudinary.com/dw5aqjqur/image/upload/v1776922957/cpa/avatars/csajcp0wrv3fkprfikyn.jpg' },
          ]);
        }
      } finally {
        if (isMounted) setMentorsLoading(false);
      }
    };
    fetchMentors();
    return () => { isMounted = false; };
  }, []);

  const handleFollowToggle = async (username) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const isCurrentlyFollowing = !!followingMap[username];
    setFollowingMap(prev => ({ ...prev, [username]: !isCurrentlyFollowing }));
    try {
      if (isCurrentlyFollowing) {
        await api.delete(`/users/${username}/follow`);
      } else {
        await api.post(`/users/${username}/follow`);
      }
    } catch (err) {
      setFollowingMap(prev => ({ ...prev, [username]: isCurrentlyFollowing }));
      console.error('Follow toggle error:', err);
    }
  };

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
        let data;
        try {
          data = await getGraphQLSearch({ query: query.trim(), limit: 12 });
        } catch (gqlErr) {
          console.warn('[SearchPage GraphQL] Falling back to REST:', gqlErr?.message);
          const res = await api.get(`/search?q=${encodeURIComponent(query)}&limit=12`);
          data = res.data;
        }
        setResults(data || { topProfileCard: null, sections: [] });
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
      
      let data;
      try {
        data = await getGraphQLSearch({ query: query.trim(), offset, limit: 12 });
      } catch (gqlErr) {
        console.warn('[SearchPage LoadMore GraphQL] Falling back to REST:', gqlErr?.message);
        const res = await api.get(`/search?q=${encodeURIComponent(query)}&offset=${offset}&limit=12`);
        data = res.data;
      }
      
      if (data?.sections) {
        setResults(prev => {
          const next = { ...prev, sections: prev.sections.map(s => ({ ...s, items: [...s.items] })) };
          data.sections.forEach(newSec => {
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
      }
      
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
    e?.preventDefault();
    const trimmed = inputVal.trim();
    if (trimmed) {
      saveRecentSearch(trimmed);
      navigate(`/explore/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSelectQuery = (selectedQuery) => {
    setInputVal(selectedQuery);
    saveRecentSearch(selectedQuery);
    navigate(`/explore/search?q=${encodeURIComponent(selectedQuery)}`);
  };

  const handleAuthRequired = () => navigate('/login');

  // Renders the Discovery Dashboard (when query is empty or < 2)
  const renderDiscoveryDashboard = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 1. RECENT SEARCHES CARD (Moved to top before trending) */}
        <section style={{
          background: t.card,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 22,
          padding: '18px 20px',
          boxShadow: t.shadowMd,
          transition: 'box-shadow 0.2s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: t.purpleTint,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Clock size={19} color={t.purple} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: t.text, fontFamily: "'Geist', sans-serif" }}>
                  Recent searches
                </h2>
                <p style={{ fontSize: 12, margin: 0, color: t.sub, fontFamily: "'Inter', sans-serif" }}>
                  Pick up where you left off
                </p>
              </div>
            </div>

            {recentSearches.length > 0 && (
              <button
                onClick={clearAllRecentSearches}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: t.purple,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  padding: '4px 6px',
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {recentSearches.length === 0 ? (
            <div style={{
              padding: '20px 14px',
              textAlign: 'center',
              color: t.muted,
              fontSize: 13,
              fontFamily: "'Inter', sans-serif",
              background: t.isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
              borderRadius: 14,
              border: `1px dashed ${t.border}`,
            }}>
              Your recent searches will appear here.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 10,
              marginTop: 10,
            }}>
              {recentSearches.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectQuery(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    borderRadius: 9999,
                    background: t.isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                    border: `1px solid ${t.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.8)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = t.purple;
                    e.currentTarget.style.background = t.purpleTint;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = t.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.8)';
                    e.currentTarget.style.background = t.isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <Search size={14} color={t.muted} />
                    <span style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: t.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontFamily: "'Inter', sans-serif",
                    }}>
                      {item}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${item}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentSearch(item);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 2,
                      cursor: 'pointer',
                      color: t.muted,
                      display: 'flex',
                      alignItems: 'center',
                      marginLeft: 6,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 2. TRENDING TOPICS CARD */}
        <section style={{
          background: t.card,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 22,
          padding: '18px 20px',
          boxShadow: t.shadowMd,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Flame size={20} color="#EF4444" fill="#EF4444" />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: t.text, fontFamily: "'Geist', sans-serif" }}>
                  Trending topics
                </h2>
                <p style={{ fontSize: 12, margin: 0, color: t.sub, fontFamily: "'Inter', sans-serif" }}>
                  What people are searching for right now
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('Topics')}
              style={{
                background: 'transparent',
                border: 'none',
                color: t.purple,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              See all <ChevronRight size={15} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {TRENDING_TOPICS.map((topic, index) => (
              <div
                key={topic.rank}
                onClick={() => handleSelectQuery(topic.title)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 10px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  borderBottom: index < TRENDING_TOPICS.length - 1 ? `1px solid ${t.border}` : 'none',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = t.cardHover; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Ranking Number */}
                <span style={{
                  width: 26,
                  fontSize: 16,
                  fontWeight: 800,
                  color: t.purple,
                  fontFamily: "'Geist', sans-serif",
                }}>
                  {topic.rank}
                </span>

                {/* Topic Icon */}
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: topic.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                  flexShrink: 0,
                }}>
                  <TopicIcon type={topic.iconType} isDark={t.isDark} />
                </div>

                {/* Topic Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: t.text,
                    fontFamily: "'Geist', sans-serif",
                    lineHeight: 1.3,
                  }}>
                    {topic.title}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: t.sub,
                    fontFamily: "'Inter', sans-serif",
                    marginTop: 2,
                  }}>
                    {topic.searches}
                  </div>
                </div>

                {/* Growth Percentage */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#10B981',
                  fontFamily: "'Inter', sans-serif",
                  marginRight: 10,
                }}>
                  <span>↑</span>
                  <span>{topic.growth}</span>
                </div>

                {/* Chevron */}
                <ChevronRight size={18} color={t.muted} />
              </div>
            ))}
          </div>
        </section>

        {/* 3. POPULAR MENTORS / EXPERTS CARD */}
        <section style={{
          background: t.card,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 22,
          padding: '18px 20px',
          boxShadow: t.shadowMd,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Users size={20} color="#3B82F6" />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: t.text, fontFamily: "'Geist', sans-serif" }}>
                  Popular mentors
                </h2>
                <p style={{ fontSize: 12, margin: 0, color: t.sub, fontFamily: "'Inter', sans-serif" }}>
                  Learn from the experts in the community
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('People')}
              style={{
                background: 'transparent',
                border: 'none',
                color: t.purple,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              See all <ChevronRight size={15} />
            </button>
          </div>

          <div
            className="hide-scrollbar"
            style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              paddingBottom: 6,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {mentors.map((mentor) => {
              const username = mentor.username || mentor.creator_username || 'mentor';
              const name = mentor.name || mentor.creator_name || `@${username}`;
              const avatar = mentor.avatar_url || mentor.avatar || mentor.creator_avatar;
              const isFollowing = !!followingMap[username];
              const role = mentor.role || (mentor.bio ? mentor.bio.split('\n')[0].replace(/[@#]/g, '').slice(0, 28) : 'Community Specialist');

              return (
                <div
                  key={mentor.id || username}
                  onClick={() => navigate(`/u/${username}`)}
                  style={{
                    width: 'clamp(145px, 34vw, 170px)',
                    flexShrink: 0,
                    background: t.isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                    border: `1px solid ${t.border}`,
                    borderRadius: 18,
                    padding: '16px 12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = t.purple;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = t.shadowSm;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = t.border;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <img
                    src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6e00ff,00dbe9,3b82f6`}
                    alt={name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6e00ff,00dbe9,3b82f6`;
                    }}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `2px solid ${t.border}`,
                      marginBottom: 10,
                    }}
                  />
                  <div style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: t.text,
                    fontFamily: "'Geist', sans-serif",
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    @{username}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: t.sub,
                    fontFamily: "'Inter', sans-serif",
                    margin: '2px 0 12px',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {role}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollowToggle(username);
                    }}
                    style={{
                      width: '100%',
                      padding: '6px 0',
                      borderRadius: 9999,
                      border: isFollowing ? `1px solid ${t.border}` : 'none',
                      background: isFollowing ? (t.isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0') : t.purpleTint,
                      color: isFollowing ? t.text : t.purple,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      transition: 'all 0.2s ease',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {isFollowing ? (
                      <>
                        <Check size={13} />
                        <span>Following</span>
                      </>
                    ) : (
                      'Follow'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. SUGGESTED FOR YOU CARD */}
        <section style={{
          background: t.card,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 22,
          padding: '18px 20px',
          boxShadow: t.shadowMd,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: t.purpleTint,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Sparkles size={20} color={t.purple} fill={t.purple} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: t.text, fontFamily: "'Geist', sans-serif" }}>
                  Suggested for you
                </h2>
                <p style={{ fontSize: 12, margin: 0, color: t.sub, fontFamily: "'Inter', sans-serif" }}>
                  Based on your activity and interests
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('Tags')}
              style={{
                background: 'transparent',
                border: 'none',
                color: t.purple,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              See all <ChevronRight size={15} />
            </button>
          </div>

          <div
            className="hide-scrollbar"
            style={{
              display: 'flex',
              gap: 10,
              overflowX: 'auto',
              paddingBottom: 4,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {SUGGESTED_INTERESTS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectQuery(item.title)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 14,
                    background: t.isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                    border: `1px solid ${t.border}`,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = t.purple;
                    e.currentTarget.style.background = t.purpleTint;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = t.border;
                    e.currentTarget.style.background = t.isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC';
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: item.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.iconType === 'nextjs' ? (
                      <TopicIcon type="nextjs" isDark={t.isDark} />
                    ) : Icon ? (
                      <Icon size={16} color={item.color} />
                    ) : null}
                  </div>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: t.text,
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {item.title}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  };

  // Filter sections by tab when query is active
  const renderSearchResultsContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            border: `3px solid ${t.purple}33`, borderTopColor: t.purple,
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
      );
    }

    if (results.sections.length === 0 && !results.topProfileCard) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: t.card,
          borderRadius: 20,
          border: `1px solid ${t.cardBorder}`,
          marginTop: 10,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: t.text, fontFamily: "'Geist', sans-serif" }}>
            No results found for "{query}"
          </div>
          <div style={{ fontSize: 13, marginTop: 6, color: t.sub, fontFamily: "'Inter', sans-serif" }}>
            Try checking for typos or searching for different topics.
          </div>
        </div>
      );
    }

    if (activeTab === 'All') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Top Match Profile */}
          {results.topProfileCard && (
            <div style={{ background: t.card, borderRadius: 20, padding: 18, border: `1px solid ${t.cardBorder}` }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', color: t.text, fontFamily: "'Geist',sans-serif" }}>
                Top Match
              </h3>
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
              <div key="videos-woven" style={{ background: t.card, borderRadius: 20, padding: 18, border: `1px solid ${t.cardBorder}` }}>
                <VideoDiscoveryBlock 
                  videos={visibleVideos} 
                  shorts={allShorts} 
                  query={query} 
                  onViewAllVideos={() => { setActiveTab('Posts'); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  onViewAllShorts={() => { setActiveTab('Posts'); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                />
                {visibleVideoCount < allVideos.length ? (
                  <button onClick={() => setVisibleVideoCount(prev => prev + 6)} style={{
                    width: '100%', padding: 12, background: t.purpleTint, color: t.purple,
                    border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif",
                    transition: 'opacity 0.2s', marginTop: 16
                  }}>
                    Load more videos
                  </button>
                ) : videoSec?.hasMore ? (
                  <button onClick={() => handleLoadMoreNetwork('videos')} disabled={loadingMore} style={{
                    width: '100%', padding: 12, background: t.purpleTint, color: t.purple,
                    border: 'none', borderRadius: 12, fontWeight: 600, cursor: loadingMore ? 'default' : 'pointer', fontFamily: "'Inter',sans-serif",
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
                  width: '100%', padding: 12, background: t.purpleTint, color: t.purple,
                  border: 'none', borderRadius: 12, fontWeight: 600, cursor: loadingMore ? 'default' : 'pointer', fontFamily: "'Inter',sans-serif",
                  transition: 'opacity 0.2s', opacity: loadingMore ? 0.6 : 1, marginTop: 16
                }}>
                  {loadingMore ? 'Loading...' : `Load more ${displayTitle.toLowerCase()}`}
                </button>
              );
            };

            if (sec.type === 'people') {
              return (
                <div key={i} style={{ background: t.card, borderRadius: 20, padding: 18, border: `1px solid ${t.cardBorder}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: t.text, fontFamily: "'Geist',sans-serif" }}>{displayTitle}</h3>
                    </div>
                    <span 
                      onClick={handleViewAll}
                      style={{ fontSize: 12, fontWeight: 600, color: t.purple, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}
                    >
                      View all
                    </span>
                  </div>
                  <div className="hide-scrollbar" style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                    {sec.items.map(person => <PeopleCard key={person.id} person={person} onAuthRequired={handleAuthRequired} />)}
                  </div>
                  {renderLoadMoreBtn()}
                </div>
              );
            }

            if (sec.type === 'articles') {
              return (
                <div key={i} style={{ background: t.card, borderRadius: 20, padding: 18, border: `1px solid ${t.cardBorder}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 6px #F59E0B' }} />
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: t.text, fontFamily: "'Geist',sans-serif" }}>{displayTitle}</h3>
                    </div>
                    <span 
                      onClick={handleViewAll}
                      style={{ fontSize: 12, fontWeight: 600, color: t.purple, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}
                    >
                      View all
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
    const typeMap = { 'Posts': 'videos', 'People': 'people', 'Articles': 'articles' };
    const tabType = typeMap[activeTab];
    const section = results.sections.find(s => s.type === tabType || (tabType === 'videos' && (s.type === 'more_videos' || s.type === 'shorts')));
    
    if (!section || !section.items || section.items.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '50px 20px',
          background: t.card,
          borderRadius: 20,
          border: `1px solid ${t.cardBorder}`,
          color: t.muted,
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
        }}>
          No {activeTab.toLowerCase()} found for "{query}".
        </div>
      );
    }

    const renderLoadMoreBtn = () => {
      if (!section.hasMore) return null;
      return (
        <button onClick={() => handleLoadMoreNetwork(section.type)} disabled={loadingMore} style={{
          width: '100%', padding: 12, background: t.purpleTint, color: t.purple,
          border: 'none', borderRadius: 12, fontWeight: 600, cursor: loadingMore ? 'default' : 'pointer', fontFamily: "'Inter',sans-serif",
          transition: 'opacity 0.2s', opacity: loadingMore ? 0.6 : 1, marginTop: 16
        }}>
          {loadingMore ? 'Loading...' : `Load more ${activeTab.toLowerCase()}`}
        </button>
      );
    };

    if (activeTab === 'Posts') {
      const allVideos = section.items;
      const visibleVideos = allVideos.slice(0, visibleVideoCount);
      const shortsSec = results.sections.find(s => s.type === 'shorts');
      const allShorts = shortsSec?.items || [];
      
      return (
        <div style={{ background: t.card, borderRadius: 20, padding: 18, border: `1px solid ${t.cardBorder}` }}>
          <VideoDiscoveryBlock videos={visibleVideos} shorts={allShorts} query={query} />
          {visibleVideoCount < allVideos.length ? (
            <button onClick={() => setVisibleVideoCount(prev => prev + 6)} style={{
              width: '100%', padding: 12, background: t.purpleTint, color: t.purple,
              border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif",
              transition: 'opacity 0.2s', marginTop: 16
            }}>
              Load more
            </button>
          ) : renderLoadMoreBtn()}
        </div>
      );
    }

    if (activeTab === 'People') {
      return (
        <div style={{ background: t.card, borderRadius: 20, padding: 18, border: `1px solid ${t.cardBorder}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {section.items.map(person => <PeopleCard key={person.id} person={person} onAuthRequired={handleAuthRequired} />)}
          </div>
          {renderLoadMoreBtn()}
        </div>
      );
    }

    if (activeTab === 'Articles') {
      return (
        <div style={{ background: t.card, borderRadius: 20, padding: 18, border: `1px solid ${t.cardBorder}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {section.items.map(article => <ArticleSearchCard key={article.id} article={article} t={t} />)}
          </div>
          {renderLoadMoreBtn()}
        </div>
      );
    }

    if (activeTab === 'Topics' || activeTab === 'Tags') {
      return (
        <div style={{ background: t.card, borderRadius: 20, padding: 20, border: `1px solid ${t.cardBorder}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: t.text, fontFamily: "'Geist',sans-serif" }}>
            Matching {activeTab}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['React', 'TypeScript', 'Next.js', 'Web Development', 'Design Systems', 'CSS', 'JavaScript', 'APIs'].map(tag => (
              <button
                key={tag}
                onClick={() => handleSelectQuery(tag)}
                style={{
                  background: t.isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
                  border: `1px solid ${t.border}`,
                  padding: '9px 16px',
                  borderRadius: 9999,
                  color: t.text,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <Hash size={14} color={t.purple} />
                <span>{tag}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const isQueryActive = query.trim().length >= 2;

  return (
    <div style={{
      minHeight: '100vh',
      background: t.bg,
      color: t.text,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '24px 16px 60px',
      boxSizing: 'border-box',
    }}>
      <Helmet>
        <title>{isQueryActive ? `Search "${query}" | FocusGram` : 'Search & Discover | FocusGram'}</title>
      </Helmet>

      <style>{`
        ${ARTICLE_CARD_CSS}

        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .hide-scrollbar {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }

        .search-inner-container {
          max-width: 680px;
          margin: 0 auto;
          width: 100%;
          display: flex;
          flex-direction: column;
        }
      `}</style>

      <div className="search-inner-container">
        {/* 1. SEARCH BAR — TOP PRIORITY */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '100%', marginBottom: 12 }}>
          <Search
            size={19}
            style={{
              position: 'absolute',
              left: 18,
              top: '50%',
              transform: 'translateY(-50%)',
              color: isFocused ? t.purple : t.sub,
              pointerEvents: 'none',
              transition: 'color 0.2s ease',
            }}
          />
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search in FocusGram..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '14px 78px 14px 48px',
              borderRadius: 9999,
              background: t.card,
              border: `1.5px solid ${isFocused ? t.purple : t.border}`,
              outline: 'none',
              fontSize: '15px',
              fontWeight: 500,
              color: t.text,
              fontFamily: "'Inter', sans-serif",
              boxShadow: isFocused
                ? '0 0 0 3.5px rgba(122, 0, 255, 0.12), 0 8px 24px rgba(122, 0, 255, 0.06)'
                : t.shadowSm,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />

          <div style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            {inputVal.trim().length > 0 && (
              <button
                type="button"
                aria-label="Clear search input"
                onClick={() => {
                  setInputVal('');
                  setQuery('');
                  navigate('/explore/search');
                }}
                style={{
                  background: t.isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: t.sub,
                  transition: 'all 0.15s ease',
                }}
              >
                <X size={15} />
              </button>
            )}

            <button
              type="button"
              aria-label="Search filters"
              onClick={() => setShowFilters(prev => !prev)}
              style={{
                background: showFilters ? t.purpleTint : 'transparent',
                border: 'none',
                borderRadius: '50%',
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: showFilters ? t.purple : t.sub,
                transition: 'all 0.15s ease',
              }}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </form>

        {/* 2. SEARCH TYPE TABS (Horizontally scrollable directly below search bar) */}
        <div
          className="hide-scrollbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
            marginBottom: 16,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {SEARCH_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 18px',
                  borderRadius: 9999,
                  border: isActive ? 'none' : `1px solid ${t.border}`,
                  background: isActive ? t.gradient : t.card,
                  color: isActive ? '#FFFFFF' : t.text,
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 4px 14px rgba(122, 0, 255, 0.25)' : t.shadowSm,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontFamily: "'Inter', sans-serif",
                  flexShrink: 0,
                }}
              >
                {Icon && <Icon size={15} color={isActive ? '#FFFFFF' : t.sub} />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Drawer / Popover if toggled */}
        {showFilters && (
          <div style={{
            background: t.card,
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 18,
            padding: '14px 18px',
            marginBottom: 16,
            boxShadow: t.shadowSm,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Filter Content:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['All Time', 'This Week', 'Verified Only'].map((f, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 12,
                    padding: '4px 12px',
                    borderRadius: 9999,
                    background: i === 0 ? t.purpleTint : (t.isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'),
                    color: i === 0 ? t.purple : t.sub,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 3. MAIN CONTENT AREA */}
        {isQueryActive ? (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}>
              <h1 style={{
                fontSize: 18,
                fontWeight: 700,
                color: t.text,
                margin: 0,
                fontFamily: "'Geist', sans-serif",
              }}>
                Search results for <span style={{ color: t.purple }}>"{query}"</span>
              </h1>
            </div>
            {renderSearchResultsContent()}
          </div>
        ) : (
          renderDiscoveryDashboard()
        )}
      </div>
    </div>
  );
}
