import { useEffect, useState } from 'react';
import AdUnit from './AdUnit';

/**
 * RightPanelAd — 300×250 medium rectangle for sticky right panels
 * Only renders on desktop (window.innerWidth >= 1024)
 */
export default function RightPanelAd() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(window.innerWidth >= 1024);
    const handler = () => setShow(window.innerWidth >= 1024);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (!show) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <AdUnit
        slot="5678901234"
        format="rectangle"
        style={{ width: 300, height: 250 }}
      />
    </div>
  );
}
