'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Calendar, 
  MapPin, 
  User, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  ShieldCheck, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import LottieProfileLoader from '../components/ui/LottieProfileLoader';

export default function AboutAccount({ username: propUsername, isModal = false, onClose }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser, loading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const targetUsername = propUsername || searchParams.get('username') || searchParams.get('u') || authUser?.username;

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFormerUsernamesModal, setShowFormerUsernamesModal] = useState(false);

  useEffect(() => {
    if (!targetUsername) {
      if (!authLoading && !authUser) {
        setLoading(false);
        setError('User not found. Please specify a username or sign in.');
      }
      return;
    }

    let isMounted = true;
    async function fetchUserData() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/users/${targetUsername}`);
        if (!isMounted) return;
        const u = res.data?.user || res.data;
        if (u) {
          setProfileUser(u);
        } else {
          setError('User profile not found.');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('[AboutAccount fetch]', err);
        setError(err.response?.data?.message || 'Failed to load user information.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchUserData();
    return () => { isMounted = false; };
  }, [targetUsername, authLoading, authUser]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else if (targetUsername) {
      router.push(`/u/${targetUsername}`);
    } else {
      router.push('/feed');
    }
  };

  const formattedDateJoined = profileUser?.created_at
    ? new Date(profileUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const accountLocation = profileUser?.location || 'India';
  const formerUsernamesCount = profileUser?.former_usernames_count ?? 0;

  const C = {
    bg: isDark ? '#050507' : '#f8f9fa',
    cardBg: isDark ? '#121217' : '#ffffff',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    text: isDark ? '#ffffff' : '#111827',
    textSec: isDark ? '#9ca3af' : '#6b7280',
    accent: '#8a2bff',
    accentSoft: isDark ? 'rgba(138, 43, 255, 0.15)' : 'rgba(138, 43, 255, 0.08)',
    rowHover: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
    sep: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
  };

  if (loading) {
    return (
      <div style={{
        minHeight: isModal ? 'auto' : '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        color: C.textSec,
      }}>
        <LottieProfileLoader />
        <p style={{ marginTop: 12, fontSize: 13, fontFamily: "'Space Grotesk', sans-serif" }}>
          Loading account information...
        </p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div style={{
        minHeight: isModal ? 'auto' : '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        textAlign: 'center',
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          background: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          color: '#ef4444'
        }}>
          <Info size={28} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
          Account Unavailable
        </h3>
        <p style={{ fontSize: 14, color: C.textSec, maxWidth: 360, margin: '0 0 24px' }}>
          {error || 'Unable to retrieve information for this profile.'}
        </p>
        <button
          onClick={handleClose}
          style={{
            padding: '10px 24px',
            borderRadius: 999,
            background: C.accent,
            color: '#ffffff',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      minHeight: isModal ? 'auto' : '90vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: isModal ? 'flex-start' : 'center',
      padding: isModal ? '0' : '24px 16px 80px',
      boxSizing: 'border-box',
    }}>
      {/* Top Bar for Mobile Page Mode */}
      {!isModal && (
        <div style={{
          width: '100%',
          maxWidth: 440,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          padding: '0 4px',
        }}>
          <button
            onClick={handleClose}
            aria-label="Back"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: C.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 8,
              borderRadius: 8,
            }}
          >
            <ChevronLeft size={24} />
          </button>
          <span style={{
            fontSize: 16,
            fontWeight: 700,
            color: C.text,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            {profileUser.username}
          </span>
          <div style={{ width: 40 }} />
        </div>
      )}

      {/* Main Instagram-Inspired Dialog / Card */}
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: C.cardBg,
        border: `1px solid ${C.cardBorder}`,
        borderRadius: 24,
        boxShadow: isDark 
          ? '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
          : '0 20px 45px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Card Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${C.sep}`,
          textAlign: 'center',
          position: 'relative',
        }}>
          {isModal && (
            <button
              onClick={handleClose}
              aria-label="Close"
              style={{
                position: 'absolute',
                right: 16,
                top: 18,
                background: 'transparent',
                border: 'none',
                color: C.textSec,
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
              }}
            >
              <X size={20} />
            </button>
          )}
          <h2 style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: C.text,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '-0.01em',
          }}>
            About this account
          </h2>
        </div>

        {/* Profile Identity Section */}
        <div style={{
          padding: '28px 24px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}>
          {/* Avatar with optional ring */}
          <div style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            padding: 3,
            background: profileUser.is_verified || profileUser.account_type === 'professional'
              ? 'linear-gradient(135deg, #8a2bff, #4da3ff)'
              : C.sep,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              overflow: 'hidden',
              background: C.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {profileUser.avatar_url ? (
                <img
                  src={profileUser.avatar_url}
                  alt={profileUser.name || profileUser.username}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: C.accent,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {(profileUser.name || profileUser.username || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Username */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{
              fontSize: 18,
              fontWeight: 800,
              color: C.text,
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '-0.02em',
            }}>
              {profileUser.username}
            </span>
            {profileUser.is_verified && (
              <CheckCircle2 size={18} style={{ color: '#3897f0', fill: '#3897f0' }} />
            )}
          </div>

          {/* Authenticity Notice */}
          <p style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.5,
            color: C.textSec,
            maxWidth: 340,
            fontFamily: "'Manrope', sans-serif",
          }}>
            To help keep our community authentic, we’re showing information about profiles on Focusgram.{' '}
            <span style={{ color: '#3897f0', cursor: 'pointer', fontWeight: 600 }}>
              See why this information is important.
            </span>
          </p>
        </div>

        {/* Details List */}
        <div style={{ padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Row 1: Date Joined */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '14px 16px',
            borderRadius: 14,
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)',
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: C.accentSoft,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.accent,
              flexShrink: 0,
            }}>
              <Calendar size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                Date joined
              </div>
              <div style={{ fontSize: 13, color: C.textSec, marginTop: 2 }}>
                {formattedDateJoined}
              </div>
            </div>
          </div>

          {/* Row 2: Account based in */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '14px 16px',
            borderRadius: 14,
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)',
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: C.accentSoft,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.accent,
              flexShrink: 0,
            }}>
              <MapPin size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                Account based in
              </div>
              <div style={{ fontSize: 13, color: C.textSec, marginTop: 2 }}>
                {accountLocation}
              </div>
            </div>
          </div>

          {/* Row 3: Former usernames */}
          <button
            onClick={() => setShowFormerUsernamesModal(!showFormerUsernamesModal)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '14px 16px',
              borderRadius: 14,
              background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: C.accentSoft,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.accent,
              flexShrink: 0,
            }}>
              <User size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                Former usernames
              </div>
              <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>
                {formerUsernamesCount === 0 ? 'No changes recorded' : `${formerUsernamesCount} previous handle`}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.textSec }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{formerUsernamesCount}</span>
              <ChevronRight size={18} />
            </div>
          </button>

          {/* Row 4: Account Type & Badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '14px 16px',
            borderRadius: 14,
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)',
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: C.accentSoft,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.accent,
              flexShrink: 0,
            }}>
              <ShieldCheck size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                Account category
              </div>
              <div style={{
                fontSize: 13,
                color: profileUser.account_type === 'professional' ? C.accent : C.textSec,
                fontWeight: profileUser.account_type === 'professional' ? 700 : 500,
                textTransform: 'capitalize',
                marginTop: 2,
              }}>
                {profileUser.account_type || 'Personal'} Member
              </div>
            </div>
          </div>
        </div>

        {/* Close Button Footer */}
        <div style={{
          borderTop: `1px solid ${C.sep}`,
          padding: '16px 20px',
          textAlign: 'center',
        }}>
          <button
            onClick={handleClose}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: 'none',
              background: 'transparent',
              color: C.text,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.sep; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
