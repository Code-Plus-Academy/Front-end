'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ConsentBanner() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const [preferences, setPreferences] = useState({
    functional: true,
    analytics: false,
    advertising: false
  });

  // Check minor status
  let isMinor = false;
  if (user && user.date_of_birth) {
    const ageDifMs = Date.now() - new Date(user.date_of_birth).getTime();
    const ageDate = new Date(ageDifMs);
    isMinor = Math.abs(ageDate.getUTCFullYear() - 1970) < 18;
  }

  useEffect(() => {
    const savedConsent = localStorage.getItem('cpa_cookie_consent_v2');
    if (!savedConsent) {
      setShow(true);
    } else {
      try {
        const parsed = JSON.parse(savedConsent);
        updateConsent(parsed);
      } catch (e) {
        setShow(true);
      }
    }
  }, [isMinor]);

  const updateConsent = (prefs) => {
    // If minor, force denied for analytics & advertising
    const finalPrefs = {
      functional: prefs.functional,
      analytics: isMinor ? false : prefs.analytics,
      advertising: isMinor ? false : prefs.advertising
    };

    if (typeof window !== 'undefined' && window.dataLayer) {
      function gtag() { window.dataLayer.push(arguments); }
      gtag('consent', 'update', {
        ad_storage: finalPrefs.advertising ? 'granted' : 'denied',
        analytics_storage: finalPrefs.analytics ? 'granted' : 'denied',
        ad_user_data: finalPrefs.advertising ? 'granted' : 'denied',
        ad_personalization: finalPrefs.advertising ? 'granted' : 'denied',
        personalization_storage: finalPrefs.functional ? 'granted' : 'denied'
      });
      localStorage.setItem('cpa_cookie_consent_v2', JSON.stringify(finalPrefs));
      setShow(false);
    }
  };

  const handleAcceptAll = () => {
    updateConsent({ functional: true, analytics: true, advertising: true });
  };

  const handleRejectAll = () => {
    updateConsent({ functional: false, analytics: false, advertising: false });
  };

  const handleSavePreferences = () => {
    updateConsent(preferences);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: 24,
      right: 24,
      maxWidth: 600,
      background: 'rgba(11, 11, 15, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      padding: 24,
      zIndex: 9999,
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(12px)',
      color: '#f5f5f7',
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h4 style={{ margin: '0 0 6px', fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>
            Cookie Consent & Privacy Preferences
          </h4>
          <p style={{ margin: 0, fontSize: 13, color: '#9ca0ae', lineHeight: 1.5 }}>
            We use cookies to optimize your experience, analyze traffic, and support marketing. You can customize your preferences below. 
            {isMinor && (
              <span style={{ display: 'block', marginTop: 8, color: '#ffb340', fontWeight: 600 }}>
                ⚠️ Minor Account Detected: Behavioral analytics and advertising cookies are permanently disabled for your privacy.
              </span>
            )}
          </p>
        </div>

        {showPreferences && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: 16,
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: 13, display: 'block' }}>Essential Cookies</strong>
                <span style={{ fontSize: 11, color: '#9ca0ae' }}>Required for core site functionality.</span>
              </div>
              <input type="checkbox" checked disabled style={{ cursor: 'not-allowed' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: 13, display: 'block' }}>Functional Cookies</strong>
                <span style={{ fontSize: 11, color: '#9ca0ae' }}>Remember your theme and preferences.</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.functional}
                onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: isMinor ? 0.5 : 1 }}>
              <div>
                <strong style={{ fontSize: 13, display: 'block' }}>Analytics Cookies</strong>
                <span style={{ fontSize: 11, color: '#9ca0ae' }}>Help us analyze and improve platform performance.</span>
              </div>
              <input
                type="checkbox"
                disabled={isMinor}
                checked={isMinor ? false : preferences.analytics}
                onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                style={{ cursor: isMinor ? 'not-allowed' : 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: isMinor ? 0.5 : 1 }}>
              <div>
                <strong style={{ fontSize: 13, display: 'block' }}>Advertising Cookies</strong>
                <span style={{ fontSize: 11, color: '#9ca0ae' }}>Used for personalized notifications and recommendations.</span>
              </div>
              <input
                type="checkbox"
                disabled={isMinor}
                checked={isMinor ? false : preferences.advertising}
                onChange={(e) => setPreferences({ ...preferences, advertising: e.target.checked })}
                style={{ cursor: isMinor ? 'not-allowed' : 'pointer' }}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8a2bff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0
            }}
          >
            {showPreferences ? 'Hide Preferences' : 'Customize Preferences'}
          </button>
          
          <div style={{ display: 'flex', gap: 8 }}>
            {showPreferences ? (
              <button
                onClick={handleSavePreferences}
                style={{
                  background: 'linear-gradient(135deg, #8a2bff 0%, #4da3ff 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Save Preferences
              </button>
            ) : (
              <>
                <button
                  onClick={handleRejectAll}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#f5f5f7',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    minWidth: 100
                  }}
                >
                  Reject All
                </button>
                <button
                  onClick={handleAcceptAll}
                  style={{
                    background: 'linear-gradient(135deg, #8a2bff 0%, #4da3ff 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    minWidth: 100
                  }}
                >
                  Accept All
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
