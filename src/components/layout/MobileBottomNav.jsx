import { useNavigate, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useImmersiveChrome } from '../../context/ImmersiveChromeContext';

const T = {
  primary: '#D0BCFF',
  primaryC: '#7A00FF',
  secondary: '#00C1FD',
  outlineV: '#64748b', // slate-500
};
const FONT_LABEL = '"Inter", sans-serif';

const TABS = [
  { icon: 'home', label: 'Home', route: '/feed', key: 'home' },
  { icon: 'pageview', label: 'Explore', route: '/explore', key: 'explore' },
  { special: true, key: 'spacer' },
  { icon: 'chat_bubble', label: 'Network', route: '/network', key: 'network' },
  { icon: 'account_circle', label: 'Profile', route: null, key: 'profile' },
];

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { chromeVisible } = useImmersiveChrome();

  if (!user) return null;

  const currentPath = location.pathname;

  return (
    <>
      <style>{`
        .mobile-bottom-nav { 
          display: flex; 
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
        }
        @media (min-width: 901px) { .mobile-bottom-nav { display: none !important; } }
        @media (prefers-reduced-motion: reduce) {
          .mobile-bottom-nav {
            transition: none !important;
          }
        }
      `}</style>
      <div 
        className="mobile-bottom-nav" 
        style={{ 
          position: 'fixed', 
          bottom: 'calc(16px + env(safe-area-inset-bottom))', 
          left: 16, 
          right: 16, 
          zIndex: 100,
          opacity: chromeVisible ? 1 : 0,
          transform: chromeVisible ? 'translateY(0)' : 'translateY(120%)',
          pointerEvents: chromeVisible ? 'auto' : 'none',
        }}
      >
        <nav style={{
          position: 'relative',
          width: '100%',
          background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
          backdropFilter: 'blur(24px)', 
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 -4px 16px rgba(122,0,255,0.04)',
          display: 'flex', 
          justifyContent: 'space-around', 
          alignItems: 'center',
          padding: '8px 12px',
          borderRadius: 32,
        }}>
          {/* Floating Post Button - Center overlapping */}
          <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', zIndex: 110 }}>
            <button
              onClick={() => navigate('/posts/new')}
              style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `linear-gradient(135deg, ${T.primaryC}, ${T.secondary})`,
                border: '3px solid var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(122,0,255,0.4)', color: '#fff', cursor: 'pointer',
                transition: 'transform 0.15s'
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Plus size={22} strokeWidth={2.5} />
            </button>
          </div>

          {TABS.map((item) => {
            if (item.special) return <div key={item.key} style={{ width: 48 }} />;

            const route = item.key === 'profile' ? `/u/${user.username}` : item.route;
            const active = item.key === 'profile'
              ? currentPath.startsWith('/u/')
              : currentPath === item.route || (item.key === 'home' && currentPath === '/feed');

            return (
              <button
                key={item.key}
                onClick={() => navigate(route)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0 8px',
                  color: active ? T.secondary : T.outlineV, transition: 'color 0.2s', zIndex: 105
                }}
              >
                <span className="material-symbols-rounded"
                  style={{ fontSize: 24, fontVariationSettings: `'FILL' ${active ? 1 : 0}, 'wght' 400` }}>
                  {item.icon}
                </span>
                <span style={{
                  fontFamily: FONT_LABEL, fontSize: 9,
                  color: active ? T.secondary : T.outlineV,
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 3, fontWeight: active ? 700 : 500
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
