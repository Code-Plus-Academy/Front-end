'use client';

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { useState, useRef, useEffect } from 'react';
import logoDark from '../../assets/cpa-logo-dark.png';
import logoLight from '../../assets/cpa-logo-light.png';
import cpaIcon from '../../assets/cpa-icon.png';
import api from '../../api/axios';

export default function Navbar({ notifCount = 0 }) {
  const { user, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const { unreadNotifications } = useNotifications();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || resolvedTheme === 'dark';
  const logoImage = isDark ? logoDark : logoLight;
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isSearchPage = location.pathname.includes('/explore=SEARCH') || location.pathname.includes('/explore/search');
  const isExplorePage = location.pathname === '/explore';
  const isNotesPage = location.pathname.startsWith('/notes') || location.pathname.startsWith('/resources') || location.pathname.startsWith('/articles');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setShowSuggestions(false);
      navigate('/explore/search?q=' + encodeURIComponent(searchValue.trim()));
    }
  };


  const searchParams = new URLSearchParams(location.search);
  const initialQ = searchParams.get('q') || '';
  const [searchValue, setSearchValue] = useState(initialQ);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const qVal = new URLSearchParams(location.search).get('q') || '';
    setSearchValue(qVal);
  }, [location.search]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!searchValue || searchValue.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const response = await api.get(`/search/suggest?q=${encodeURIComponent(searchValue)}`);
        setSuggestions(response.data);
      } catch (err) {
        console.error('[Navbar Suggest] Fetch failed:', err);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchValue]);

  // Close dropdown on Escape key
  useEffect(() => {
    if (!dropOpen) return;
    const onEsc = (e) => { if (e.key === 'Escape') setDropOpen(false); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [dropOpen]);

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <>
      <style>{`
        .glass-nav-explore { background: color-mix(in srgb, var(--surface) 90%, transparent); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); }
        .ytSearchboxComponentInputContainer {
          display: flex;
          width: 100%;
          align-items: center;
          border-radius: 40px;
          border: 1px solid var(--border);
          background: var(--s2);
          overflow: hidden;
          height: 38px;
          transition: all 0.2s ease;
        }
        .ytSearchboxComponentInputContainer:focus-within {
          border-color: #a855f7;
          background: var(--bg);
        }
        .ytSearchboxComponentInputBox {
          display: flex;
          flex: 1;
          height: 100%;
          padding: 0 14px;
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
          color: var(--text);
          font-size: 14px;
          font-family: inherit;
        }
        .ytSearchboxComponentSearchButton {
          width: 48px;
          height: 100%;
          border: none;
          background: var(--s3);
          border-left: 1px solid var(--border);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text);
          transition: background 0.2s;
        }
        .ytSearchboxComponentSearchButton:hover {
          background: var(--border-bright);
        }
        .hub-search-input { background: var(--s2); border: 1px solid var(--border); border-radius: 8px; padding: 8px 16px 8px 36px; color: var(--text); font-size: 14px; outline: none; width: 240px; transition: border-color 0.2s; }
        .hub-search-input:focus { border-color: var(--green); }
        .signup-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 22px;
          border: none;
          border-radius: 9999px;
          background: linear-gradient(135deg, #a855f7 0%, #7c3aed 45%, #4f46e5 100%);
          color: #fff;
          font-family: 'Geist', var(--font-display), sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 0 0 1px rgba(168,85,247,0.35), 0 4px 20px rgba(124,58,237,0.45);
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
          overflow: hidden;
        }
        .signup-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%);
          background-size: 200% 100%;
          background-position: -100% 0;
          transition: background-position 0.55s ease;
          border-radius: inherit;
          pointer-events: none;
        }
        .signup-btn:hover::before { background-position: 150% 0; }
        .signup-btn:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 0 0 1px rgba(168,85,247,0.5), 0 8px 28px rgba(124,58,237,0.55);
          filter: brightness(1.08);
        }
        .signup-btn:active { transform: scale(0.96); filter: brightness(0.95); }
        .signup-btn .signup-label { display: inline; }
        @media (max-width: 400px) {
          .signup-btn { padding: 9px 13px; }
          .signup-btn .signup-label { display: none; }
        }
        .hub-icon-action { background: none; border: none; color: var(--sub); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 8px; border-radius: 8px; transition: all 0.2s; }
        .hub-icon-action:hover { color: var(--text); background: var(--border-bright); }
        .search-suggestion-item:hover { background: var(--border-bright) !important; }
        @media(max-width: 768px) {
          .nav-hide-mobile { display: none !important; }
          .nav-show-mobile { display: flex !important; }
          .glass-nav-explore { padding: 0 14px !important; }
        }
      `}</style>

      <nav className="glass-nav-explore" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 64, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, minWidth: 0, flexShrink: 1 }}>
          {/* Brand Logo */}
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', minWidth: 0, flexShrink: 1 }} 
            onClick={() => navigate(location.pathname.startsWith('/notes') || location.pathname.startsWith('/resources') || location.pathname.startsWith('/articles') ? '/notes' : (user ? '/feed' : '/'))}
          >
            {isNotesPage ? (
              <>
                <img
                  src={isDark ? '/favicon-dark.png' : '/favicon-light.png'}
                  alt="Notes Arena Icon"
                  style={{ height: 'clamp(32px, 8vw, 42px)', width: 'auto', objectFit: 'contain', flexShrink: 0 }}
                />
                <img
                  src="/notes-arena-logo.png"
                  alt="Notes Arena"
                  style={{ height: 'clamp(44px, 12vw, 54px)', width: 'auto', objectFit: 'contain', minWidth: 0, flexShrink: 1 }}
                  className="cpa-brand-logo"
                />
              </>
            ) : (
              <>
                <img src={cpaIcon?.src || cpaIcon} alt="CPA Icon" style={{ height: 'clamp(48px, 12vw, 58px)', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
                <img src={logoImage?.src || logoImage} alt="Code Plus Academy" style={{ height: 'clamp(40px, 10vw, 52px)', width: 'auto', objectFit: 'contain', minWidth: 0, flexShrink: 1 }} className="cpa-brand-logo" />
              </>
            )}
          </div>

          {(location.pathname.startsWith('/notes') || location.pathname.startsWith('/resources') || location.pathname.startsWith('/articles')) && (
            <nav className="nav-hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 20, marginLeft: 12 }}>
              <Link
                to="/notes"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: location.pathname === '/notes' ? 'var(--green)' : 'var(--sub)',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>home</span>
                <span>Home</span>
              </Link>

              <Link
                to="/notes/colleges"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: location.pathname.startsWith('/notes/colleges') ? 'var(--green)' : 'var(--sub)',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>school</span>
                <span>Colleges</span>
              </Link>

              <Link
                to="/notes/university"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: location.pathname.startsWith('/notes/university') ? 'var(--green)' : 'var(--sub)',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>account_balance</span>
                <span>Universities</span>
              </Link>

              <Link
                to="/notes/departments"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: location.pathname.startsWith('/notes/departments') ? 'var(--green)' : 'var(--sub)',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>domain</span>
                <span>Departments</span>
              </Link>

              <Link
                to="/notes/upload"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: location.pathname.startsWith('/notes/upload') ? 'var(--green)' : 'var(--sub)',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>upload</span>
                <span>Upload Notes</span>
              </Link>
            </nav>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>

          {/* Search Bar - Visible on Explore and Search page */}
          {(isExplorePage || isSearchPage) && (
            <div ref={suggestionsRef} style={{ position: 'relative', width: 320 }} className="nav-hide-mobile">
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
                      value={searchValue}
                      onChange={e => {
                        setSearchValue(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
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
                      <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" style={{ pointerEvents: 'none', display: 'inherit', width: '100%', height: '100%', fill: 'currentColor' }}>
                        <path d="M11 2a9 9 0 105.641 16.01.966.966 0 00.152.197l3.5 3.5a1 1 0 101.414-1.414l-3.5-3.5a1 1 0 00-.197-.153A8.96 8.96 0 0020 11a9 9 0 00-9-9Zm0 2a7 7 0 110 14 7 7 0 010-14Z"></path>
                      </svg>
                    </span>
                  </span>
                </button>
              </div>


              {showSuggestions && suggestions.length > 0 && (
                <div className="search-suggestions-dropdown" style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  minWidth: 420,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
                  padding: '8px 0',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 480,
                  overflowY: 'auto'
                }}>
                  {suggestions.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      onClick={() => {
                        setShowSuggestions(false);
                        if (item.type === 'text') {
                          setSearchValue(item.text);
                        }
                        navigate(item.targetUrl);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      className="search-suggestion-item"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
                        <span className="material-symbols-rounded" style={{
                          fontSize: 18,
                          color: 'var(--sub)',
                          marginRight: 12,
                          flexShrink: 0
                        }}>
                          {item.type === 'profile' ? 'person' : 'search'}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: 'var(--text)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.text}
                          </span>
                          {item.type === 'profile' && item.subtext && (
                            <span style={{
                              fontSize: 12,
                              color: 'var(--sub)',
                              marginTop: 1
                            }}>
                              {item.subtext}
                            </span>
                          )}
                        </div>
                      </div>

                      {item.type === 'profile' && item.avatar_url && (
                        <img
                          src={item.avatar_url}
                          alt=""
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            marginLeft: 12,
                            flexShrink: 0
                          }}
                        />
                      )}

                      {item.type === 'video' && item.thumbnail_url && (
                        <img
                          src={item.thumbnail_url}
                          alt=""
                          style={{
                            width: 48,
                            height: 28,
                            borderRadius: 4,
                            objectFit: 'cover',
                            marginLeft: 12,
                            flexShrink: 0
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mobile Search Icon */}
          {isExplorePage && (
            <Link to="/explore/search" className="nav-show-mobile" style={{ display: 'none', position: 'relative' }}>
              <button className="hub-icon-action">
                <span className="material-symbols-rounded" style={{ fontSize: 22, fontVariationSettings: "'FILL' 0, 'wght' 400" }}>search</span>
              </button>
            </Link>
          )}

          {user ? (
            <>
              {/* Notifications - Hidden on Notes Arena navbar */}
              {!isNotesPage && (
                <Link to="/notifications" style={{ position: 'relative' }}>
                  <button className="hub-icon-action" style={{ position: 'relative' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 22, fontVariationSettings: "'FILL' 0, 'wght' 400" }}>notifications</span>
                    {unreadNotifications > 0 && (
                      <span className="badge-pop" style={{
                        position: 'absolute', top: -3, right: -3, minWidth: 15, height: 15,
                        background: '#e04242', borderRadius: '50%', color: '#fff',
                        fontSize: 8, fontWeight: 700, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--bg)',
                        padding: '0 3px', boxSizing: 'border-box'
                      }}>
                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                      </span>
                    )}
                  </button>
                </Link>
              )}

              {/* Avatar dropdown */}
              <div ref={dropRef} style={{ position: 'relative' }}>
                <button onClick={() => setDropOpen(v => !v)} aria-expanded={dropOpen} aria-haspopup="true" style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'transparent',
                  border: '1px solid ' + (dropOpen ? 'rgba(208,188,255,0.4)' : 'transparent'),
                  borderRadius: 'var(--r-md)',
                  padding: '4px',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                    alt={user.name}
                    style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(208,188,255,0.2)' }}
                  />
                </button>

                {dropOpen && (
                  <div role="menu" style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 12,
                    background: isDark ? '#1A1D21' : '#FFFFFF', 
                    border: `1px solid ${isDark ? '#2F343B' : '#E2E8F0'}`,
                    borderRadius: 'var(--r-xl)', padding: '16px', minWidth: 360,
                    boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(0,209,255,0.06)' : '0 10px 40px rgba(0,0,0,0.1)', 
                    animation: 'fadeIn 0.15s ease',
                    zIndex: 200,
                    fontFamily: "'Geist', sans-serif",
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                  }}>
                    {/* Top Header: Email & Close Button */}
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ width: 32 }} /> {/* spacer to center email */}
                      <div style={{ fontSize: 13, color: isDark ? '#A1A7B3' : '#64748B', flex: 1, textAlign: 'center', fontWeight: 500 }}>
                        {user.email || `@${user.username}`}
                      </div>
                      <button onClick={() => setDropOpen(false)} style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, borderRadius: '50%',
                        color: isDark ? '#FFFFFF' : '#0F172A', transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = isDark ? '#25292F' : '#F1F5F9'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 20 }}>close</span>
                      </button>
                    </div>

                    {/* Big Avatar */}
                    <div style={{ position: 'relative', marginBottom: 12 }}>
                      <img
                        src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                        alt={user.name}
                        style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover', border: '2px solid #00D1FF', boxShadow: '0 0 16px rgba(0,209,255,0.2)' }}
                      />
                    </div>

                    {/* Greeting */}
                    <div style={{ fontSize: 20, color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 700, marginBottom: 16, textAlign: 'center', letterSpacing: '-0.01em' }}>
                      Hi, {user.name || user.username}!
                    </div>

                    {/* Manage Profile Pill */}
                    <Link to={`/u/${user.username}`} onClick={() => setDropOpen(false)} style={{ textDecoration: 'none', marginBottom: 20 }}>
                      <button style={{
                        background: '#00D1FF',
                        border: '2px solid #00D1FF',
                        borderRadius: 'var(--r-full)',
                        padding: '8px 24px',
                        color: '#1A1D21',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        display: 'inline-block',
                        letterSpacing: '0.01em'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#00D1FF'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,209,255,0.25)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#00D1FF'; e.currentTarget.style.color = '#1A1D21'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        Manage your Profile
                      </button>
                    </Link>

                    {/* Inner List Container */}
                    <div style={{
                      width: '100%',
                      background: isDark ? '#25292F' : '#F8FAFC',
                      borderRadius: 'var(--r-lg)',
                      padding: '8px 0',
                      display: 'flex', flexDirection: 'column',
                      border: `1px solid ${isDark ? '#2F343B' : '#E2E8F0'}`,
                      boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.3)' : 'none'
                    }}>
                      {[
                        { to: '/creator/dashboard', icon: 'dashboard', label: 'Dashboard' },
                        { to: '/saved', icon: 'bookmark', label: 'Saved Resources' },
                        { to: '/settings', icon: 'settings', label: 'Settings' },
                      ].map(({ to, icon, label }) => (
                        <Link key={to} to={to} onClick={() => setDropOpen(false)} style={{ textDecoration: 'none' }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                            padding: '12px 24px',
                            color: isDark ? '#FFFFFF' : '#0F172A', fontSize: 14, transition: 'all 0.15s',
                            cursor: 'pointer', borderRadius: 8
                          }}
                            onMouseEnter={e => { e.currentTarget.style.background = isDark ? '#2F343B' : '#E2E8F0'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <span className="material-symbols-rounded" style={{ fontSize: 20, color: isDark ? '#A1A7B3' : '#64748B', fontVariationSettings: "'FILL' 0, 'wght' 400" }}>{icon}</span>
                            <span style={{ fontWeight: 400 }}>{label}</span>
                          </div>
                        </Link>
                      ))}
                      
                      <div style={{ height: 1, background: isDark ? '#3F4651' : '#E2E8F0', margin: '4px 0' }} />
                      
                      <button onClick={() => { logout(); setDropOpen(false); }} style={{
                        display: 'flex', alignItems: 'center', gap: 16, width: '100%',
                        padding: '12px 24px',
                        color: isDark ? '#FFFFFF' : '#0F172A', fontSize: 14, background: 'none', border: 'none',
                        cursor: 'pointer', transition: 'background 0.15s',
                        fontWeight: 400, textAlign: 'left', borderRadius: 8
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = isDark ? '#2F343B' : '#E2E8F0'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 20, color: isDark ? '#A1A7B3' : '#64748B', fontVariationSettings: "'FILL' 0, 'wght' 400" }}>logout</span>
                        Sign out
                      </button>
                    </div>

                    {/* Footer Links */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, fontSize: 12, color: '#A1A7B3' }}>
                      <span style={{ cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>Privacy policy</span>
                      <span>•</span>
                      <span style={{ cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>Terms of Service</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/register">
              <button className="signup-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
                <span className="signup-label">Sign Up</span>
              </button>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}