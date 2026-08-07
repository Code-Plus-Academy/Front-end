import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

declare global {
  interface Window {
    VANTA?: any;
    THREE?: any;
  }
}

export const VantaGlobeBackground: React.FC = () => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);
  const { theme } = useTheme();

  useEffect(() => {
    let interval: any;

    const initVanta = () => {
      const vantaFunc = window.VANTA?.GLOBE || window.VANTA?.NET;
      if (vantaFunc && vantaRef.current) {
        if (vantaEffect.current) {
          vantaEffect.current.destroy();
        }

        const isDark = theme === 'dark';

        vantaEffect.current = vantaFunc({
          el: vantaRef.current,
          THREE: window.THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          size: 2.00,
          color: isDark ? 0x06b6d4 : 0x2563eb,
          color2: isDark ? 0xa855f7 : 0x7c3aed,
          backgroundColor: isDark ? 0x020617 : 0xf8fafc,
        });

        if (interval) clearInterval(interval);
      }
    };

    if (window.VANTA && (window.VANTA.GLOBE || window.VANTA.NET)) {
      initVanta();
    } else {
      interval = setInterval(() => {
        if (window.VANTA && (window.VANTA.GLOBE || window.VANTA.NET)) {
          initVanta();
        }
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, [theme]);

  return (
    <div 
      ref={vantaRef} 
      className="fixed inset-0 pointer-events-none -z-10 transition-opacity duration-500 overflow-hidden" 
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none' }}
      aria-hidden="true"
    />
  );
};

