import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';

const COLLAPSED_W = 72;
const EXPANDED_W = 240;

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
        
        .hub-icon-btn {
          display: flex;
          align-items: center;
          color: var(--text);
          opacity: 0.6;
          position: relative;
          transition: background-color 0.22s ease,
                      color 0.22s ease,
                      opacity 0.22s ease,
                      padding 0.28s cubic-bezier(0.4, 0, 0.2, 1),
                      flex-direction 0.28s ease,
                      gap 0.28s ease;
          cursor: pointer;
          width: 100%;
          box-sizing: border-box;
          white-space: nowrap;
          font: inherit;
          background: none;
          border: none;
          
          /* expanded by default */
          flex-direction: row;
          padding: 12px 16px 12px 20px;
          justify-content: flex-start;
          gap: 14px;
          border-radius: 14px;
        }
        
        .hub-icon-btn:hover, .hub-icon-btn.active {
          color: var(--color-brand-teal);
          opacity: 1;
          background-color: var(--green-dim);
        }
        
        .hub-icon-btn .nav-label {
          font-family: var(--font-display);
          font-weight: 600;
          transition: opacity 0.2s ease, font-size 0.2s ease, letter-spacing 0.2s ease;
          overflow: hidden;
          font-size: 14px; /* expanded */
          letter-spacing: 0.03em;
          line-height: 1.2;
          text-align: center;
        }
        
        .hub-icon-btn .material-symbols-rounded {
           font-size: 22px; /* expanded */
           flex-shrink: 0;
           transition: transform 0.2s ease, font-size 0.2s ease;
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
        
        /* ── Collapsed / Mini Sidebar (< 1312px) ── */
        @media (max-width: 1311px) {
          .hub-sidebar {
            width: 72px;
            padding: 20px 6px;
            align-items: center;
          }
          .hub-sidebar .hub-icon-btn {
            flex-direction: column;
            padding: 10px 4px 6px;
            justify-content: center;
            gap: 2px;
            border-radius: 12px;
          }
          .hub-sidebar .hub-icon-btn .nav-label {
            font-size: 10px;
            letter-spacing: 0.01em;
          }
          .hub-sidebar .hub-icon-btn .material-symbols-rounded {
            font-size: 20px;
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
        <div className="hub-nav-items-container" style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          {navItems.map(item => {
            const isActive = location.pathname === item.path
              || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.id}
                className={`hub-icon-btn${isActive ? ' active' : ''}`}
                onClick={() => navigate(item.path)}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="active-indicator" />
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span
                    className="material-symbols-rounded"
                    style={{
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
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}