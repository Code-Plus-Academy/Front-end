'use client';
import { useState, useEffect } from 'react';

export default function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if consent is already saved in localStorage
    const savedConsent = localStorage.getItem('cpa_cookie_consent');
    if (!savedConsent) {
      setShow(true);
    } else if (savedConsent === 'granted') {
      updateConsent(true);
    }
  }, []);

  const updateConsent = (isGranted) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      function gtag() { window.dataLayer.push(arguments); }
      gtag('consent', 'update', {
        ad_storage: isGranted ? 'granted' : 'denied',
        analytics_storage: isGranted ? 'granted' : 'denied',
        ad_user_data: isGranted ? 'granted' : 'denied',
        ad_personalization: isGranted ? 'granted' : 'denied',
      });
      localStorage.setItem('cpa_cookie_consent', isGranted ? 'granted' : 'denied');
      setShow(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 w-full bg-slate-900 border-t border-slate-700 p-4 z-50 flex justify-between items-center text-sm text-slate-300">
      <p>We use cookies to analyze traffic and improve our services. By clicking "Accept", you consent to our use of cookies.</p>
      <div className="flex gap-4">
        <button onClick={() => updateConsent(false)} className="px-4 py-2 text-slate-400 hover:text-white">Decline</button>
        <button onClick={() => updateConsent(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md">Accept</button>
      </div>
    </div>
  );
}
