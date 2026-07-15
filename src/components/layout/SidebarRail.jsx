import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';

const ICONS = {
  home: (isActive) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style={{ pointerEvents: 'none', display: 'inherit', width: '100%', height: '100%' }}>
      <path d={isActive 
        ? "M4 21V10.08l8-4.8 8 4.8V21h-6v-6h-4v6H4z" 
        : "m11.485 2.143-8 4.8-2 1.2a1 1 0 001.03 1.714L3 9.567V20a2 2 0 002 2h5v-8h4v8h5a2 2 0 002-2V9.567l.485.29a1 1 0 001.03-1.714l-2-1.2-8-4.8a1 1 0 00-1.03 0Z"
      }></path>
    </svg>
  ),
  pageview: (isActive) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style={{ pointerEvents: 'none', display: 'inherit', width: '100%', height: '100%' }}>
      <path d={isActive
        ? "M14.12 10.12L12 18l-2.12-7.88L2 8l7.88-2.12L12 2l2.12 7.88L22 12z M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1 1.1-.49 1.1-1.1-.49-1.1-1.1-1.1z"
        : "M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 1c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm1.75 4.67l-5.08 2.16-2.16 5.08 5.08-2.16 2.16-5.08zM12 11c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"
      }></path>
    </svg>
  ),
  chat_bubble: (isActive) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style={{ pointerEvents: 'none', display: 'inherit', width: '100%', height: '100%' }}>
      <path d={isActive
        ? "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 9H6V9h12v2zm-5 3H6v-2h7v2zm5-6H6V6h12v2z"
        : "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"
      }></path>
    </svg>
  ),
  bookmark: (isActive) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style={{ pointerEvents: 'none', display: 'inherit', width: '100%', height: '100%' }}>
      <path d={isActive
        ? "M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"
        : "M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"
      }></path>
    </svg>
  ),
  notifications: (isActive) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style={{ pointerEvents: 'none', display: 'inherit', width: '100%', height: '100%' }}>
      <path d={isActive
        ? "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
        : "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"
      }></path>
    </svg>
  )
};

export default function SidebarRail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadNotifications, unreadMessages } = useNotifications();

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
                      background-color 0.2s ease,
                      padding 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          width: 240px; /* expanded by default */
          padding: 20px 10px;
          align-items: flex-start;
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

        ytd-guide-section-renderer {
          display: block;
          width: 100%;
        }
        
        #items {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }
        
        ytd-guide-entry-renderer {
          display: block;
          width: 100%;
          box-sizing: border-box;
          padding: 0 4px;
        }
        
        a.yt-simple-endpoint {
          text-decoration: none;
          color: inherit;
          display: block;
          width: 100%;
        }
        
        tp-yt-paper-item {
          display: flex;
          align-items: center;
          width: 100%;
          box-sizing: border-box;
          cursor: pointer;
          transition: background-color 0.15s ease, color 0.15s ease;
          position: relative;
          color: var(--text);
          opacity: 0.7;
          border: none;
          background: none;
          
          /* Expanded state defaults */
          height: 44px;
          padding: 0 12px 0 20px;
          border-radius: 12px;
          flex-direction: row;
          gap: 20px;
        }
        
        tp-yt-paper-item:hover {
          background-color: rgba(255, 255, 255, 0.08);
          color: var(--text);
          opacity: 1;
        }
        
        body.light-mode tp-yt-paper-item:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        ytd-guide-entry-renderer[active] tp-yt-paper-item {
          background-color: rgba(255, 255, 255, 0.12);
          color: var(--color-brand-teal);
          opacity: 1;
        }
        
        body.light-mode ytd-guide-entry-renderer[active] tp-yt-paper-item {
          background-color: rgba(0, 180, 216, 0.1);
        }
        
        yt-icon {
          width: 24px;
          height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          fill: currentColor;
          color: inherit;
          flex-shrink: 0;
        }
        
        yt-formatted-string.title {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: inherit;
          transition: opacity 0.2s ease;
        }
        
        ytd-guide-entry-renderer[active] yt-formatted-string.title {
          font-weight: 600;
        }

        .active-indicator {
          position: absolute;
          left: 4px;
          top: 25%;
          width: 4px;
          height: 50%;
          border-radius: 99px;
          background: var(--color-brand-teal);
          box-shadow: 0 0 10px rgba(0, 180, 216, 0.6);
          transition: opacity 0.2s ease;
        }
        ytd-guide-entry-renderer:not([active]) .active-indicator {
          opacity: 0;
        }

        /* ── Collapsed / Mini Sidebar (< 1312px) ── */
        @media (max-width: 1311px) {
          .hub-sidebar {
            width: 72px;
            padding: 20px 4px;
            align-items: center;
          }
          ytd-guide-entry-renderer {
            padding: 0 2px;
          }
          tp-yt-paper-item {
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 74px;
            padding: 10px 2px 8px;
            gap: 6px;
            border-radius: 10px;
          }
          yt-formatted-string.title {
            font-size: 10px;
            font-weight: 400;
            text-align: center;
            width: 100%;
          }
          .active-indicator {
            left: 50%;
            top: auto;
            bottom: 4px;
            width: 16px;
            height: 3px;
            transform: translateX(-50%);
            border-radius: 99px;
          }
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
          display: 'flex',
          flexDirection: 'column',
          zIndex: 105,
        }}
      >
        <ytd-guide-section-renderer className="style-scope ytd-guide-renderer" guide-persistent-and-visible="">
          <div id="items" className="style-scope ytd-guide-section-renderer">
            {navItems.map(item => {
              const isActive = location.pathname === item.path
                || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <ytd-guide-entry-renderer
                  key={item.id}
                  class="style-scope ytd-guide-section-renderer"
                  active={isActive ? "" : undefined}
                  is-primary=""
                  line-end-style="none"
                >
                  <a
                    id="endpoint"
                    className="yt-simple-endpoint style-scope ytd-guide-entry-renderer"
                    title={item.label}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.path);
                    }}
                    href={item.path}
                  >
                    <tp-yt-paper-item
                      role="link"
                      className="style-scope ytd-guide-entry-renderer"
                      style-target="host"
                      tabIndex={0}
                      aria-disabled="false"
                    >
                      <div className="active-indicator" />
                      <yt-icon className="guide-icon style-scope ytd-guide-entry-renderer">
                        <span className="yt-icon-shape style-scope yt-icon ytSpecIconShapeHost">
                          <div style={{ width: '100%', height: '100%', display: 'block', fill: 'currentColor', position: 'relative' }}>
                            {ICONS[item.icon] ? ICONS[item.icon](isActive) : null}
                            
                            {item.id === 'messages' && unreadMessages > 0 && (
                              <span className="badge-pop" style={{
                                position: 'absolute', top: -4, right: -4, minWidth: 14, height: 14,
                                background: '#e04242', borderRadius: '50%', color: '#fff',
                                fontSize: 7.5, fontWeight: 700, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', border: '1px solid var(--bg)',
                                padding: '0 2px', zIndex: 10
                              }}>
                                {unreadMessages > 99 ? '99+' : unreadMessages}
                              </span>
                            )}
                            {item.id === 'notifications' && unreadNotifications > 0 && (
                              <span className="badge-pop" style={{
                                position: 'absolute', top: -4, right: -4, minWidth: 14, height: 14,
                                background: '#e04242', borderRadius: '50%', color: '#fff',
                                fontSize: 7.5, fontWeight: 700, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', border: '1px solid var(--bg)',
                                padding: '0 2px', zIndex: 10
                              }}>
                                {unreadNotifications > 99 ? '99+' : unreadNotifications}
                              </span>
                            )}
                          </div>
                        </span>
                      </yt-icon>
                      <yt-formatted-string className="title style-scope ytd-guide-entry-renderer">
                        {item.label}
                      </yt-formatted-string>
                    </tp-yt-paper-item>
                  </a>
                  <yt-interaction className="style-scope ytd-guide-entry-renderer">
                    <div className="stroke style-scope yt-interaction"></div>
                    <div className="fill style-scope yt-interaction"></div>
                  </yt-interaction>
                </ytd-guide-entry-renderer>
              );
            })}
          </div>
        </ytd-guide-section-renderer>
      </aside>
    </>
  );
}