import { useNavigate, useLocation } from 'react-router-dom';

export default function SidebarRail() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', external: 'https://www.codeplusacademy.in/feed', icon: 'home', label: 'Home' },
    { id: 'explore', path: '/explore', icon: 'pageview', label: 'Explorer' },
    { id: 'messages', path: '/network', icon: 'chat_bubble', label: 'Messages' },
    { id: 'saved', path: '/saved', icon: 'bookmark', label: 'Saved' },
    { id: 'notifications', path: '/notifications', icon: 'notifications', label: 'Notifs' },
  ];

  return (
    <>
      <style>{`
        .hub-sidebar { border-right: 1px solid var(--border); background: var(--surface); }
        .hub-icon-btn { display: flex; flex-direction: row; align-items: center; gap: 16px; padding: 14px 20px; color: var(--sub); transition: all 0.3s; cursor: pointer; border-radius: 12px; width: 100%; box-sizing: border-box; }
        .hub-icon-btn:hover, .hub-icon-btn.active { color: var(--color-brand-teal); background: var(--green-dim); }
        .hub-icon-btn .nav-label { font-size: 15px; font-family: var(--font-display); font-weight: 600; letter-spacing: 0.02em; }
        @media(max-width: 768px) { .hub-sidebar { display: none !important; } }
      `}</style>
      <aside className="hub-sidebar" style={{ position: 'fixed', left: 0, top: 64, bottom: 0, width: 240, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '24px 16px', zIndex: 40 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          {navItems.map(item => {
            const isActive = !item.external && (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)));
            return (
              <div
                key={item.id}
                className={`hub-icon-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (item.external) {
                    window.location.href = item.external;
                  } else {
                    navigate(item.path);
                  }
                }}
              >
                <span
                  className="material-symbols-rounded"
                  style={{
                    fontSize: 24,
                    fontVariationSettings: `'FILL' ${isActive ? 1 : 0}, 'wght' ${isActive ? 600 : 400}`
                  }}
                >{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}