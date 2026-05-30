'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Users, MessageSquare, Bell, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const tabs = [
  { to: '/feed',         icon: Home,         label: 'Feed' },
  { to: '/explore',      icon: Compass,       label: 'Explore' },
  { to: '/network',      icon: Users,         label: 'Network' },
  { to: '/network', icon: MessageSquare, label: 'Messages' },
  { to: '/notifications',icon: Bell,          label: 'Alerts' },
];


export default function BottomNav({ notifCount = 0 }) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user) return null;

  return (
    <nav className="hide-desktop" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(8,12,15,0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(({ to, icon: Icon, label }) => {
        const active = pathname === to;
        return (
          <Link key={to} to={to} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: 2, position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Icon size={18} color={active ? 'var(--green)' : 'var(--dim)'} strokeWidth={active ? 2.5 : 1.5} />
              {label === 'Alerts' && notifCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -6,
                  width: 14, height: 14, background: 'var(--green)',
                  borderRadius: '50%', border: '2px solid var(--bg)',
                  fontSize: 8, fontWeight: 700, color: 'var(--bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{notifCount > 9 ? '9+' : notifCount}</span>
              )}
            </div>
            <span style={{ fontSize: 10, color: active ? 'var(--green)' : 'var(--dim)', fontFamily: 'var(--font-mono)' }}>{label}</span>
            {active && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 20, height: 2, background: 'var(--green)', borderRadius: 2 }} />}
          </Link>
        );
      })}
      <Link href={`/u/${user.username}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: 2 }}>
        <img src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`} alt="" style={{ width: 20, height: 20, borderRadius: '50%', border: pathname.startsWith('/u/') ? '2px solid var(--green)' : '2px solid transparent' }} />
        <span style={{ fontSize: 10, color: pathname.startsWith('/u/') ? 'var(--green)' : 'var(--dim)', fontFamily: 'var(--font-mono)' }}>Profile</span>
      </Link>
    </nav>
  );
}
