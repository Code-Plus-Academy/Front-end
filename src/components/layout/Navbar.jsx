import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import logoDark from '../../assets/cpa-logo-dark.png';
import logoLight from '../../assets/cpa-logo-light.png';

export default function Navbar({ notifCount = 0 }) {
  const { user, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const logoImage = resolvedTheme === 'dark' ? logoDark : logoLight;
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
        @media(max-width: 768px) {
          .nav-hide-mobile { display: none !important; }
          .nav-show-mobile { display: inline !important; }
          .glass-nav-explore { padding: 0 14px !important; }
        }
      `}</style>

      <nav className="glass-nav-explore" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 64, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate(user ? '/feed' : '/')}>
            <img src={logoImage} alt="Code Plus Academy" style={{ height: 'clamp(36px, 8vw, 52px)', width: 'auto', objectFit: 'contain' }} className="cpa-brand-logo" />
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
          {user ? (
            <>
              {/* Search Bar */}
              <div style={{ position: 'relative' }} className="nav-hide-mobile">
                <span className="material-symbols-rounded" style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 16, color: '#9ca3af', fontVariationSettings: "'FILL' 0, 'wght' 400"
                }}>pageview</span>
                <input
                  type="text"
                  placeholder="Search resources..."
                  className="hub-search-input"
                  onKeyDown={e => { if (e.key === 'Enter') navigate('/explore'); }}
                />
              </div>

              {/* Notifications */}
              <Link to="/notifications" style={{ position: 'relative' }}>
                <button className="hub-icon-action">
                  <span className="material-symbols-rounded" style={{ fontSize: 22, fontVariationSettings: "'FILL' 0, 'wght' 400" }}>notifications</span>
                </button>
              </Link>

              {/* Avatar dropdown */}
              <div ref={dropRef} style={{ position: 'relative' }}>
                <button onClick={() => setDropOpen(v => !v)} style={{
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
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(208,188,255,0.2)' }}
                  />
                  <ChevronDown size={14} color="#9ca3af" style={{ transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {dropOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 12,
                    background: '#1b2025', border: '1px solid rgba(74,68,87,0.3)',
                    borderRadius: '12px', padding: 8, minWidth: 200,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)', animation: 'fadeIn 0.15s ease',
                    zIndex: 200,
                  }}>
                    {[
                      { to: `/u/${user.username}`, icon: 'account_circle', label: 'My Profile' },
                      { to: '/creator/dashboard', icon: 'dashboard', label: 'Dashboard' },
                      { to: '/saved', icon: 'bookmark', label: 'Saved Resources' },
                      { to: '/settings', icon: 'settings', label: 'Settings' },
                    ].map(({ to, icon, label }) => (
                      <Link key={to} to={to} onClick={() => setDropOpen(false)}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 12px', borderRadius: '8px',
                          color: '#dbe1ff', fontSize: 13, transition: 'all 0.15s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#dbe1ff'; }}
                        >
                          {/* Fixed: added material-symbols-rounded class */}
                          <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9ca3af', fontVariationSettings: "'FILL' 0, 'wght' 400" }}>{icon}</span>
                          {label}
                        </div>
                      </Link>
                    ))}
                    <div style={{ height: 1, background: 'rgba(74,68,87,0.3)', margin: '8px 0' }} />
                    <button onClick={() => { logout(); setDropOpen(false); }} style={{
                      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                      padding: '10px 12px', borderRadius: '8px',
                      color: '#ef4444', fontSize: 13, background: 'none', border: 'none',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 18, fontVariationSettings: "'FILL' 0, 'wght' 400" }}>logout</span>
                      Sign Out
                    </button>
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