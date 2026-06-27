import { useNavigate, useLocation } from 'react-router-dom';
import {  Plus} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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

  if (!user) return null;

  const currentPath = location.pathname;

  return (
    <>
      <style>{`
        .mobile-bottom-nav { display: flex; }
        @media (min-width: 901px) { .mobile-bottom-nav { display: none !important; } }
      `}</style>
      <div className="mobile-bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100 }}>
        {/* Floating Post Button */}
        <div style={{ position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)', zIndex: 110 }}>
          <button
            onClick={() => navigate('/posts/new')}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: `linear-gradient(135deg, ${T.primaryC}, ${T.secondary})`,
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(122,0,255,0.4)', color: '#fff', cursor: 'pointer',
              transition: 'transform 0.15s'
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Bottom Tab Bar */}
       <nav style={{
  width: '100%',
  background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
  backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
  borderTop: '1px solid var(--border)',
  boxShadow: '0 -8px 24px rgba(122,0,255,0.08)',
  display: 'flex', justifyContent: 'space-around', alignItems: 'center',
  padding: '8px 16px calc(12px + env(safe-area-inset-bottom))',
  borderTopLeftRadius: 14, borderTopRightRadius: 14
}}>
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
                  color: active ? T.secondary : T.outlineV, transition: 'color 0.2s'
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
