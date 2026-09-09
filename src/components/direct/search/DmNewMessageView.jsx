import React, { useState, useEffect, useRef, useMemo } from 'react';
import DmUserSearchHeader from './DmUserSearchHeader';
import DmUserSearchInput from './DmUserSearchInput';
import DmSearchTabs from './DmSearchTabs';
import RecentConversations from './RecentConversations';
import OnlineUsers from './OnlineUsers';
import SuggestedPeople from './SuggestedPeople';
import UserSearchResult from './UserSearchResult';
import SearchLoadingSkeleton from './SearchLoadingSkeleton';
import EmptySearchState from './EmptySearchState';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

export default function DmNewMessageView({
  onBack,
  onSelectUser,
  onSelectConv,
  conversations = [],
  devs = [],
  currentUser = null,
  initialQuery = '',
  onQueryChange,
}) {
  const { user: authUser } = useAuth();
  const currentLoggedInUser = currentUser || authUser;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [query, setQuery] = useState(initialQuery || '');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'recent' | 'suggested'

  // Sync state if initialQuery changes externally (e.g. browser back/forward)
  useEffect(() => {
    if (initialQuery !== undefined && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleQueryChange = (val) => {
    setQuery(val);
    if (onQueryChange) {
      onQueryChange(val);
    }
  };

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const debounceTimerRef = useRef(null);
  const lastQueryRef = useRef('');

  // Extract online/active candidates from conversations and devs without fabricating presence
  const activeCandidates = useMemo(() => {
    const map = new Map();
    // From recent conversations
    conversations.forEach(c => {
      if (c.other_is_active && c.other_username) {
        map.set(c.other_username.toLowerCase(), {
          id: c.id,
          username: c.other_username,
          name: c.other_name || c.other_username,
          avatar_url: c.other_avatar,
          is_active: true,
          other_is_active: true,
        });
      }
    });
    // From devs list
    devs.forEach(d => {
      if ((d.is_active || d.isActive) && d.username && !map.has(d.username.toLowerCase())) {
        map.set(d.username.toLowerCase(), {
          ...d,
          is_active: true,
        });
      }
    });
    return Array.from(map.values());
  }, [conversations, devs]);

  // Filter suggested users to exclude current user and existing 1-on-1 conversations
  const filteredSuggested = useMemo(() => {
    const myUsername = currentLoggedInUser?.username?.toLowerCase();
    return devs.filter(d => {
      if (!d.username) return false;
      const u = d.username.toLowerCase();
      if (myUsername && u === myUsername) return false;
      return true;
    });
  }, [devs, currentLoggedInUser]);

  // Live user search effect
  useEffect(() => {
    const trimmed = query.trim();
    lastQueryRef.current = trimmed;

    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        let results = [];
        // Primary: Elasticsearch section people search
        try {
          const esRes = await api.get('/search/section', {
            params: { type: 'people', q: trimmed, limit: 20 }
          });
          results = esRes.data?.items || [];
        } catch {
          // Silent fallback to SQL/direct user search
        }

        // Secondary: users search endpoint
        if (!results || results.length === 0) {
          try {
            const sqlRes = await api.get('/users/search', {
              params: { q: trimmed, limit: 20 }
            });
            results = sqlRes.data?.users || sqlRes.data?.items || [];
          } catch {
            const fbRes = await api.get('/users', {
              params: { q: trimmed, limit: 20 }
            });
            results = fbRes.data?.users || [];
          }
        }

        // Tertiary fallback: client-side filter over existing devs + conversations if backend returned nothing
        if (!results || results.length === 0) {
          const qLower = trimmed.toLowerCase();
          const localMatches = devs.filter(d =>
            d.name?.toLowerCase().includes(qLower) ||
            d.username?.toLowerCase().includes(qLower) ||
            d.bio?.toLowerCase().includes(qLower) ||
            d.role?.toLowerCase().includes(qLower)
          );
          results = localMatches;
        }

        // Normalize and deduplicate by username
        const myUsername = currentLoggedInUser?.username?.toLowerCase();
        const seen = new Set();
        const mapped = [];

        results.forEach(u => {
          const uname = (u.username || '').toLowerCase();
          if (!uname || seen.has(uname) || (myUsername && uname === myUsername)) {
            return;
          }
          seen.add(uname);
          mapped.push({
            id: u.id || u.user_id,
            name: u.name || u.displayName || u.username,
            username: u.username,
            avatar_url: u.avatar_url || u.avatar || u.profile_picture || null,
            bio: u.bio || '',
            headline: u.headline || '',
            role: u.role || '',
            account_type: u.account_type || 'learner',
            tech_interests: u.tech_interests || [],
            is_active: Boolean(u.is_active || u.isActive),
          });
        });

        // Ensure we only update state if the query is still the latest one
        if (lastQueryRef.current === trimmed) {
          setSearchResults(mapped);
          setIsSearching(false);
        }
      } catch (err) {
        console.error('[DmNewMessageView] Search failed:', err);
        if (lastQueryRef.current === trimmed) {
          setSearchError('Search failed. Please try again.');
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, currentLoggedInUser, devs]);

  const hasQuery = query.trim().length > 0;

  // Filtered search results based on active tab if user switches tabs while searching
  const displayedSearchResults = useMemo(() => {
    if (!hasQuery) return [];
    if (activeTab === 'recent') {
      const recentUsernames = new Set(
        conversations.map(c => (c.other_username || '').toLowerCase())
      );
      return searchResults.filter(u => recentUsernames.has(u.username.toLowerCase()));
    }
    return searchResults;
  }, [searchResults, activeTab, hasQuery, conversations]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        maxHeight: '100dvh',
        background: isDark ? '#0B0F19' : '#F8F9FE',
        boxSizing: 'border-box',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        position: 'relative',
      }}
    >
      {/* Centered Max-Width Container for Desktop & Mobile */}
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <DmUserSearchHeader onBack={onBack} isDark={isDark} />

        {/* Content Body */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '16px 18px max(48px, env(safe-area-inset-bottom, 48px))',
            boxSizing: 'border-box',
          }}
        >
          {/* Search Input */}
          <DmUserSearchInput
            value={query}
            onChange={handleQueryChange}
            onClear={() => handleQueryChange('')}
            isLoading={isSearching}
            isDark={isDark}
            placeholder="Search people, username or profession..."
          />

          {/* Segmented Filter Tabs */}
          <DmSearchTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isDark={isDark}
          />

          {/* Active Search Results Mode */}
          {hasQuery ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {/* Results Section Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '2px 4px 6px',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    fontFamily: "'Manrope', 'Space Grotesk', sans-serif",
                    letterSpacing: '-0.2px',
                  }}
                >
                  People {displayedSearchResults.length > 0 ? `(${displayedSearchResults.length})` : ''}
                </span>
                {isSearching && (
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#8B5CF6',
                      fontFamily: "'Inter', 'Geist', sans-serif",
                    }}
                  >
                    Searching...
                  </span>
                )}
              </div>

              {/* Skeletons while searching and no results yet */}
              {isSearching && displayedSearchResults.length === 0 ? (
                <SearchLoadingSkeleton count={5} isDark={isDark} />
              ) : displayedSearchResults.length > 0 ? (
                /* Matching Results */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {displayedSearchResults.map((u) => (
                    <UserSearchResult
                      key={u.id || u.username}
                      user={u}
                      onSelectUser={onSelectUser}
                      isDark={isDark}
                    />
                  ))}
                </div>
              ) : (
                /* Empty state */
                <EmptySearchState query={query} isDark={isDark} />
              )}
            </div>
          ) : (
            /* Discovery Mode (No active query) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 1. Recent Conversations */}
              {(activeTab === 'all' || activeTab === 'recent') && (
                <RecentConversations
                  conversations={conversations}
                  onSelectConv={onSelectConv}
                  onSeeAll={() => setActiveTab('recent')}
                  isDark={isDark}
                />
              )}

              {/* 2. Online Users (Rendered only if real active members exist) */}
              {activeTab === 'all' && (
                <OnlineUsers
                  users={activeCandidates}
                  onSelectUser={onSelectUser}
                  onSeeAll={() => {}}
                  isDark={isDark}
                />
              )}

              {/* 3. Suggested People */}
              {(activeTab === 'all' || activeTab === 'suggested') && (
                <SuggestedPeople
                  users={filteredSuggested}
                  onSelectUser={onSelectUser}
                  onSeeAll={() => setActiveTab('suggested')}
                  isDark={isDark}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
