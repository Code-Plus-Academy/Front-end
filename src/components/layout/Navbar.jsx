import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import logoDark from '../../assets/cpa-logo-dark.png';
import logoLight from '../../assets/cpa-logo-light.png';
import cpaIcon from '../../assets/cpa-icon.png';
import api from '../../api/axios';

export default function Navbar({ notifCount = 0 }) {
  const { user, logout } = useAuth();
  const { resolvedTheme } = useTheme();
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
        .hub-search-input { background: var(--s2); border: 1px solid var(--border); border-radius: 8px; padding: 8px 16px 8px 36px; color: var(--text); font-size: 14px; outline: none; width: 240px; transition: border-color 0.2s; }
        .hub-search-input:focus { border-color: var(--green); }
        .neon-create-btn { background: linear-gradient(135deg, #d0bcff, #6e00ff); color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-family: var(--font-display); font-weight: 700; font-size: 12px; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .neon-create-btn:active { transform: scale(0.95); }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate(user ? '/feed' : '/')}>
            <img src={cpaIcon?.src || cpaIcon} alt="CPA Icon" style={{ height: 'clamp(44px, 10vw, 56px)', width: 'auto', objectFit: 'contain' }} />
            <img src={logoImage?.src || logoImage} alt="Code Plus Academy" style={{ height: 'clamp(32px, 8vw, 48px)', width: 'auto', objectFit: 'contain' }} className="cpa-brand-logo" />
          </div>

          {/* Top Links */}
          {user && (
            <nav style={{ display: 'flex', gap: 24, marginLeft: 24 }} className="nav-hide-mobile">
              {[
                { label: 'Explore', path: '/explore' },
                { label: 'Academy', path: '/courses' },
                { label: 'Mentors', path: '/network' },
                { label: 'Labs', path: '/feed' },
              ].map(item => (
                <Link key={item.label} to={item.path} className="hub-nav-link" style={{
                  color: isActive(item.path) && item.path !== '/' ? '#d0bcff' : '#9ca3af',
                  borderBottom: isActive(item.path) && item.path !== '/' ? '2px solid #d0bcff' : '2px solid transparent'
                }}>
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Search Bar - Visible ONLY on Explore page */}
          {isExplorePage && (
            <div ref={suggestionsRef} style={{ position: 'relative' }} className="nav-hide-mobile">
              <span className="material-symbols-rounded" style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 16, color: '#9ca3af', fontVariationSettings: "'FILL' 0, 'wght' 400"
              }}>pageview</span>
              <input
                type="text"
                placeholder="Search resources..."
                className="hub-search-input"
                value={searchValue}
                onChange={e => {
                  setSearchValue(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setShowSuggestions(false);
                    navigate('/explore/search?q=' + encodeURIComponent(e.target.value));
                  }
                }}
              />

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
              {/* Notifications */}
              <Link to="/notifications" style={{ position: 'relative' }}>
                <button className="hub-icon-action">
                  <span className="material-symbols-rounded" style={{ fontSize: 22, fontVariationSettings: "'FILL' 0, 'wght' 400" }}>notifications</span>
                </button>
              </Link>

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
                    fontFamily: "'Outfit', sans-serif",
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
            <div style={{ display: 'flex', gap: 12 }}>
              <Link to="/login"><button className="hub-icon-action" style={{ padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 700 }}>Login</button></Link>
              <Link to="/register"><button className="neon-create-btn">Get Started</button></Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}