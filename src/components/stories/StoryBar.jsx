import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import StoryModal from './StoryModal';
import CreateStoryModal from './CreateStoryModal';
import { useAuth } from '../../context/AuthContext';

/* ─── Inline keyframes (injected once) ─── */
const STYLE_ID = 'story-bar-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const sheet = document.createElement('style');
  sheet.id = STYLE_ID;
  sheet.textContent = `
    @keyframes storyRingSpin {
      0%   { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes storyShimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .story-scroll::-webkit-scrollbar { display: none; }
    .story-scroll { -ms-overflow-style: none; scrollbar-width: none; }
  `;
  document.head.appendChild(sheet);
}

export default function StoryBar() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const storyParam = searchParams.get('story');
  const isOpenedViaClickRef = useRef(false);

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef(null);

  const fetchStories = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const { data } = await api.get('/stories');
      setStories(data.stories || []);
    } catch (err) {
      console.error('Failed to fetch stories:', err);
      setFetchError(true);
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStories(); }, []);

  /* ── Scroll shadow detection ── */
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [stories, loading]);

  const formatStoryGroup = useCallback((userGroup) => {
    if (!userGroup) return null;
    return userGroup.stories && userGroup.stories.length > 0
      ? userGroup.stories.map(s => ({
          ...s,
          username: userGroup.username,
          user_avatar: userGroup.avatar_url || userGroup.user_avatar,
          user: userGroup.user || { username: userGroup.username, avatar_url: userGroup.avatar_url }
        }))
      : [{
          id: userGroup.id,
          content_url: userGroup.content_url || userGroup.url,
          caption: userGroup.caption,
          username: userGroup.username,
          user_avatar: userGroup.avatar_url || userGroup.user_avatar,
          user: userGroup.user
        }];
  }, []);

  const activeGroup = useMemo(() => {
    if (!storyParam || stories.length === 0) return null;
    const lower = storyParam.toLowerCase();
    return stories.find(g => {
      const uName = (g.username || '').toLowerCase();
      const gId = String(g.id || '');
      const uId = String(g.user_id || g.user?.id || '');
      const hasStoryId = g.stories?.some(s => String(s.id) === storyParam);
      return uName === lower || gId === storyParam || uId === storyParam || hasStoryId;
    }) || null;
  }, [storyParam, stories]);

  const selectedStories = useMemo(() => {
    if (!activeGroup) return null;
    return formatStoryGroup(activeGroup);
  }, [activeGroup, formatStoryGroup]);

  const currentGroupIndex = useMemo(() => {
    if (!activeGroup) return -1;
    return stories.findIndex(g => g === activeGroup);
  }, [stories, activeGroup]);

  const handleStoryClick = (userGroup) => {
    const storyKey = userGroup.username || userGroup.id || userGroup.stories?.[0]?.id;
    if (!storyKey) return;
    isOpenedViaClickRef.current = true;
    const currentParams = new URLSearchParams(location.search);
    currentParams.set('story', storyKey);
    navigate(`${location.pathname}?${currentParams.toString()}`);
  };

  const handleCloseStory = useCallback(() => {
    if (isOpenedViaClickRef.current && typeof window !== 'undefined' && window.history.length > 1) {
      isOpenedViaClickRef.current = false;
      navigate(-1);
    } else {
      isOpenedViaClickRef.current = false;
      const currentParams = new URLSearchParams(location.search);
      currentParams.delete('story');
      const newSearch = currentParams.toString();
      navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
    }
  }, [location.search, location.pathname, navigate]);

  const handleNextGroup = useCallback(() => {
    if (currentGroupIndex >= 0 && currentGroupIndex < stories.length - 1) {
      const nextGroup = stories[currentGroupIndex + 1];
      const nextKey = nextGroup.username || nextGroup.id;
      const currentParams = new URLSearchParams(location.search);
      currentParams.set('story', nextKey);
      navigate(`${location.pathname}?${currentParams.toString()}`, { replace: true });
    } else {
      handleCloseStory();
    }
  }, [currentGroupIndex, stories, location.search, location.pathname, navigate, handleCloseStory]);

  const handlePrevGroup = useCallback(() => {
    if (currentGroupIndex > 0) {
      const prevGroup = stories[currentGroupIndex - 1];
      const prevKey = prevGroup.username || prevGroup.id;
      const currentParams = new URLSearchParams(location.search);
      currentParams.set('story', prevKey);
      navigate(`${location.pathname}?${currentParams.toString()}`, { replace: true });
    }
  }, [currentGroupIndex, stories, location.search, location.pathname, navigate]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const displayStories = stories;

  /* ─── Shared sizes ─── */
  const AVATAR_SIZE = 68;
  const RING_SIZE = AVATAR_SIZE + 8; // ring wrapper includes padding

  return (
    <>
      {/* Redesigned Create Story Modal */}
      <CreateStoryModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onStoryCreated={fetchStories}
      />

      {/* ───────── Main StoryBar Container ───────── */}
      <div
        style={{
          borderRadius: 'clamp(14px, 1.8vw, 20px)',
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-card)',
          padding: 'clamp(14px, 1.6vw, 20px)',
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {/* Ambient glow effects */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            left: '15%',
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 124, 255, 0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -40,
            right: '10%',
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* ── Story Avatars Row ── */}
        <div
          ref={scrollRef}
          className="story-scroll"
          style={{
            display: 'flex',
            gap: 'clamp(16px, 2vw, 24px)',
            padding: '4px 4px 2px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* ── Add Story Button ── */}
          <motion.div
            tabIndex={0}
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            onClick={() => setShowUpload(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              flexShrink: 0,
              minWidth: RING_SIZE,
            }}
          >
            <div
              style={{
                width: RING_SIZE,
                height: RING_SIZE,
                borderRadius: '50%',
                border: '2px dashed var(--primary, #3B7CFF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 18px rgba(59, 124, 255, 0.15)',
                transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  borderRadius: '50%',
                  background: 'var(--s2, #1E293B)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username || 'You'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, filter: 'brightness(0.7)' }}
                  />
                ) : null}
                {/* Plus overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: user?.avatar_url ? 'rgba(0,0,0,0.35)' : 'transparent',
                  }}
                >
                  <Plus size={24} color="var(--primary, #3B7CFF)" strokeWidth={2.5} />
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: 'clamp(0.65rem, 0.85vw, 0.75rem)',
                fontFamily: 'var(--font-body, sans-serif)',
                color: 'var(--text-secondary, var(--sub))',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              Add Story
            </span>
          </motion.div>

          {/* ── Creator Stories ── */}
          {displayStories.map((story, i) => (
            <motion.div
              key={story.id}
              whileHover={{ scale: 1.06, y: -3 }}
              whileTap={{ scale: 0.94 }}
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                type: 'spring',
                damping: 22,
                stiffness: 260,
                delay: i * 0.05,
              }}
              onClick={() => handleStoryClick(story)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                flexShrink: 0,
                minWidth: RING_SIZE,
              }}
            >
              {/* Animated gradient ring */}
              <div
                style={{
                  width: RING_SIZE,
                  height: RING_SIZE,
                  borderRadius: '50%',
                  padding: 3,
                  position: 'relative',
                }}
              >
                {/* Spinning conic gradient ring */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, #3B7CFF, #9333EA, #34C77B, #3B7CFF)',
                    animation: 'storyRingSpin 4s linear infinite',
                  }}
                />
                {/* Inner cutout (creates the ring effect) */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 3,
                    borderRadius: '50%',
                    background: 'var(--surface)',
                  }}
                />
                {/* Avatar */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 5,
                    borderRadius: '50%',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={story.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${story.username}`}
                    alt={story.username}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
              </div>
              <span
                style={{
                  fontSize: 'clamp(0.65rem, 0.85vw, 0.75rem)',
                  fontFamily: 'var(--font-body, sans-serif)',
                  color: 'var(--text-primary, var(--text))',
                  fontWeight: 600,
                  maxWidth: 80,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.01em',
                  textAlign: 'center',
                }}
              >
                {story.username}
              </span>
            </motion.div>
          ))}

          {/* ── Loading Skeletons ── */}
          {loading && Array(4).fill(0).map((_, i) => (
            <div
              key={`skel-${i}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
                minWidth: RING_SIZE,
              }}
            >
              <div
                style={{
                  width: RING_SIZE,
                  height: RING_SIZE,
                  borderRadius: '50%',
                  background: 'linear-gradient(90deg, var(--border) 25%, var(--border-bright) 50%, var(--border) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'storyShimmer 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.12}s`,
                }}
              />
              <div
                style={{
                  width: 48,
                  height: 10,
                  borderRadius: 5,
                  background: 'linear-gradient(90deg, var(--border) 25%, var(--border-bright) 50%, var(--border) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'storyShimmer 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.12 + 0.1}s`,
                }}
              />
            </div>
          ))}

          {/* ── Empty / Error State ── */}
          {!loading && displayStories.length === 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '4px 8px',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(0.72rem, 0.9vw, 0.82rem)',
                  color: 'var(--dim)',
                  fontFamily: 'var(--font-body, sans-serif)',
                  whiteSpace: 'nowrap',
                }}
              >
                {fetchError ? 'Could not load stories' : 'No stories yet — be the first!'}
              </span>
              {fetchError && (
                <button
                  onClick={fetchStories}
                  style={{
                    background: 'var(--s3)',
                    border: '1px solid var(--border-bright)',
                    borderRadius: 8,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body, sans-serif)',
                    transition: 'background 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedStories && (
          <StoryModal
            userStories={selectedStories}
            onClose={handleCloseStory}
            onNextGroup={handleNextGroup}
            onPrevGroup={handlePrevGroup}
          />
        )}
      </AnimatePresence>
    </>
  );
}
