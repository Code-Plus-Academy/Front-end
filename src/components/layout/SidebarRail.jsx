import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';

const COLLAPSED_W = 76;
const EXPANDED_W = 240;

export default function SidebarRail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [canHover, setCanHover] = useState(true);
  const { unreadNotifications, unreadMessages } = useNotifications();

  // Detect hover capability — touch devices get tap-to-toggle fallback
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover)');
    setCanHover(mq.matches);
    const handler = (e) => setCanHover(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const navItems = [
    { id: 'home', path: '/feed', icon: 'home', label: 'Home' },
    { id: 'explore', path: '/explore', icon: 'pageview', label: 'Explore' },
    { id: 'messages', path: '/network', icon: 'chat_bubble', label: 'Messages' },
    { id: 'saved', path: '/saved', icon: 'bookmark', label: 'Saved' },
    { id: 'notifications', path: '/notifications', icon: 'notifications', label: 'Notifs' },
  ];

  return (
    <>
      <style>{`
        .hub-sidebar {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.12);
          transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow 0.3s ease,
                      background-color 0.2s ease;
          overflow: hidden;
        }
        .hub-sidebar:hover {
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
          border-color: rgba(255, 255, 255, 0.18);
        }
        body.light-mode .hub-sidebar {
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }
        body.light-mode .hub-sidebar:hover {
          box-shadow: 0 24px 48px rgba(15, 23, 42, 0.12);
        }
        .hub-icon-btn {
          display: flex;
          flex-direction: row;
          align-items: center;
          color: var(--text);
          opacity: 0.6;
          position: relative;
          transition: background-color 0.22s ease,
                      color 0.22s ease,
                      opacity 0.22s ease,
                      padding 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          border-radius: 14px;
          width: 100%;
          box-sizing: border-box;
          white-space: nowrap;
          font: inherit;
          background: none;
          border: none;
        }
        .hub-icon-btn:hover {
          color: var(--color-brand-teal);
          opacity: 1;
          background-color: var(--green-dim);
        }
        .hub-icon-btn.active {
          color: var(--color-brand-teal);
          opacity: 1;
          background-color: var(--green-dim);
        }
        .hub-icon-btn .nav-label {
          font-size: 14px;
          font-family: var(--font-display);
          font-weight: 600;
          letter-spacing: 0.03em;
          transition: opacity 0.2s ease;
          overflow: hidden;
        }
        .active-indicator {
          position: absolute;
          left: 4px;
          width: 4px;
          height: 18px;
          border-radius: 99px;
          background: var(--color-brand-teal);
          box-shadow: 0 0 10px rgba(0, 180, 216, 0.6);
          transition: opacity 0.2s ease, height 0.2s ease;
        }
        .hub-icon-btn:not(.active) .active-indicator {
          opacity: 0;
          height: 0;
        }
        @media(max-width: 768px) {
          .hub-sidebar { display: none !important; }
        }
      `}</style>
      <aside
        className="hub-sidebar"
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: 'fixed',
          left: 20,
          top: 84,
          bottom: 20,
          width: expanded ? EXPANDED_W : COLLAPSED_W,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px 10px',
          zIndex: 105,
        }}
        onMouseEnter={() => canHover && setExpanded(true)}
        onMouseLeave={() => canHover && setExpanded(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          {navItems.map(item => {
            const isActive = location.pathname === item.path
              || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.id}
                className={`hub-icon-btn${isActive ? ' active' : ''}`}
                style={{
                  padding: expanded ? '12px 16px 12px 20px' : '12px 0',
                  justifyContent: expanded ? 'flex-start' : 'center',
                  gap: expanded ? '14px' : '0px',
                }}
                onClick={() => navigate(item.path)}
                title={!expanded ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="active-indicator" />
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span
                    className="material-symbols-rounded"
                    style={{
                      fontSize: 22,
                      flexShrink: 0,
                      transition: 'transform 0.2s ease',
                      fontVariationSettings: `'FILL' ${isActive ? 1 : 0}, 'wght' ${isActive ? 600 : 400}`,
                    }}
                  >{item.icon}</span>
                  {item.id === 'messages' && unreadMessages > 0 && (
                    <span className="badge-pop" style={{
                      position: 'absolute', top: -5, right: -5, minWidth: 14, height: 14,
                      background: '#e04242', borderRadius: '50%', color: '#fff',
                      fontSize: 7.5, fontWeight: 700, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', border: '1px solid var(--bg)',
                      padding: '0 2px'
                    }}>
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                  {item.id === 'notifications' && unreadNotifications > 0 && (
                    <span className="badge-pop" style={{
                      position: 'absolute', top: -5, right: -5, minWidth: 14, height: 14,
                      background: '#e04242', borderRadius: '50%', color: '#fff',
                      fontSize: 7.5, fontWeight: 700, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', border: '1px solid var(--bg)',
                      padding: '0 2px'
                    }}>
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                </div>
                <span
                  className="nav-label"
                  style={{
                    opacity: expanded ? 1 : 0,
                    display: expanded ? 'inline-block' : 'none',
                  }}
                >{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Touch-device toggle — only shown when hover isn't available */}
        {!canHover && (
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              marginTop: 'auto',
              padding: '10px 0',
              background: 'none',
              border: 'none',
              color: 'var(--dim)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <span className="material-symbols-rounded" style={{
              fontSize: 22,
              transition: 'transform 0.2s',
              transform: expanded ? 'rotate(180deg)' : 'none',
            }}>chevron_right</span>
          </button>
        )}
      </aside>
    </>
  );
}