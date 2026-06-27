// frontend/src/components/shared/GlobalStyles.jsx
import { useTheme } from '../../context/ThemeContext';
import { DARK, LIGHT } from '../../styles/tokens';

export default function GlobalStyles() {
  const { resolvedTheme } = useTheme();
  const T = resolvedTheme === 'dark' ? DARK : LIGHT;

  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@300;400;500;600;700;800&family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
      *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { -webkit-font-smoothing: antialiased; overflow-x: hidden; }
      ::-webkit-scrollbar { width: 3px; height: 3px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: ${T.isDark ? 'rgba(138,43,255,0.35)' : 'rgba(123,44,255,0.25)'}; border-radius: 3px; }
      button { font-family: inherit; cursor: pointer; border: none; outline: none; background: none; -webkit-tap-highlight-color: transparent; }
      input, textarea, select { font-family: inherit; outline: none; }
      input::placeholder, textarea::placeholder { color: ${T.isDark ? 'rgba(156,160,174,0.5)' : 'rgba(92,95,114,0.5)'}; }

      @keyframes fadeUp    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
      @keyframes drawLine  { from{stroke-dashoffset:400} to{stroke-dashoffset:0} }
      @keyframes slideUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
      @keyframes spin      { to{transform:rotate(360deg)} }
      @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }
      @keyframes glowPulse { 0%,100%{opacity:.7} 50%{opacity:1} }
      @keyframes orb       { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-25px) scale(1.12)} 66%{transform:translate(-25px,20px) scale(0.94)} }

      .page-enter > * { animation: fadeUp 0.3s ease both; }
      .page-enter > *:nth-child(1){animation-delay:.02s}
      .page-enter > *:nth-child(2){animation-delay:.05s}
      .page-enter > *:nth-child(3){animation-delay:.08s}
      .page-enter > *:nth-child(4){animation-delay:.11s}
      .page-enter > *:nth-child(5){animation-delay:.14s}

      .cpa-card-hover:hover {
        transform: translateY(-1px);
        box-shadow: ${T.isDark
          ? '0 8px 32px rgba(0,0,0,0.6),0 0 0 1px rgba(138,43,255,0.18)'
          : '0 8px 24px rgba(0,0,0,0.1),0 0 0 1px rgba(123,44,255,0.12)'} !important;
      }

      /* Desktop sidebar always visible, mobile bottom nav always visible */
      @media(max-width:768px) { .desktop-only { display: none !important; } }
      @media(min-width:769px) { .mobile-only  { display: none !important; } }
    `}</style>
  );
}
