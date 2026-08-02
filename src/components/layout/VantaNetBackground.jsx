'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function VantaNetBackground({
  color = 0xd13fff,
  maxDistance = 31,
  ...vantaOpts
}) {
  const containerRef = useRef(null);
  const effectRef = useRef(null);
  const [threeLoaded, setThreeLoaded] = useState(false);
  const [vantaLoaded, setVantaLoaded] = useState(false);

  useEffect(() => {
    if (!vantaLoaded || !containerRef.current || effectRef.current) return;

    effectRef.current = window.VANTA.NET({
      el: containerRef.current,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,
      color,
      maxDistance,
      ...vantaOpts,
    });

    return () => {
      effectRef.current?.destroy();
      effectRef.current = null;
    };
  }, [vantaLoaded, color, maxDistance]);

  return (
    <>
      <Script
        src="/three.r134.min.js"
        strategy="afterInteractive"
        onLoad={() => setThreeLoaded(true)}
      />
      {threeLoaded && (
        <Script
          src="/vanta.net.min.js"
          strategy="afterInteractive"
          onLoad={() => setVantaLoaded(true)}
        />
      )}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
    </>
  );
}