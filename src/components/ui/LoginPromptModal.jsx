'use client';

import React, { useEffect } from 'react';
import Modal from './Modal';
import ClapIcon from '../icons/ClapIcon';
import { useAuth } from '../../context/AuthContext';

export default function LoginPromptModal({
  isOpen,
  onClose,
  actionType = 'download',
  contentType = 'general',
  onLoginSuccess
}) {
  const { user } = useAuth();

  // If user becomes authenticated while modal is open, trigger auto-resume
  useEffect(() => {
    if (isOpen && user) {
      onClose();
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }
  }, [user, isOpen, onClose, onLoginSuccess]);

  if (!isOpen) return null;

  const contentMap = {
    download: {
      icon: (
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--green, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 30 }}>download</span>
        </div>
      ),
      title: 'Sign in to Download',
      message: 'Create a free Code Plus Academy account or sign in to download study resources, PYQs, project code, and learning materials across the platform.',
      btnText: 'Sign In to Download',
    },
    save: {
      icon: (
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.12)', color: 'var(--warn, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 30 }}>bookmark</span>
        </div>
      ),
      title: 'Sign in to Save',
      message: 'Create a free Code Plus Academy account or sign in to save notes, video lectures, posts, and articles to your personal library.',
      btnText: 'Sign In to Save',
    },
    clap: {
      icon: (
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
          <ClapIcon size={30} color="#ef4444" filled />
        </div>
      ),
      title: 'Sign in to Support Creators',
      message: 'Create a free Code Plus Academy account or sign in to clap, like, and appreciate contributors across the CPA platform.',
      btnText: 'Sign In to Clap',
    },
    like: {
      icon: (
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 30 }}>favorite</span>
        </div>
      ),
      title: 'Sign in to Like',
      message: 'Create a free Code Plus Academy account or sign in to like videos, posts, and articles.',
      btnText: 'Sign In to Like',
    },
    comment: {
      icon: (
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0, 180, 216, 0.12)', color: '#00B4D8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(0, 180, 216, 0.25)' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 30 }}>chat_bubble</span>
        </div>
      ),
      title: 'Sign in to Join Discussion',
      message: 'Create a free Code Plus Academy account or sign in to comment, ask questions, and discuss with fellow learners.',
      btnText: 'Sign In to Comment',
    },
    general: {
      icon: (
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0, 180, 216, 0.12)', color: '#00B4D8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(0, 180, 216, 0.25)' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 30 }}>lock</span>
        </div>
      ),
      title: 'Sign in to Code Plus Academy',
      message: 'Access all features across CPA — Notes Arena, Video Courses, Articles, Developer Feed, and Community.',
      btnText: 'Sign In',
    },
  };

  const current = contentMap[actionType] || contentMap.general;

  const handleSignInRedirect = () => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      sessionStorage.setItem('cpa_post_login_redirect', currentPath);
      sessionStorage.setItem('cpa_pending_action', actionType);
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} width={430}>
      <div style={{ textAlign: 'center', padding: '8px 4px 6px' }}>
        {current.icon}

        <h3
          style={{
            fontFamily: "'Space Grotesk', 'Clash Display', sans-serif",
            fontSize: '21px',
            fontWeight: 800,
            color: 'var(--text, #ffffff)',
            margin: '0 0 10px',
            letterSpacing: '-0.02em',
          }}
        >
          {current.title}
        </h3>

        <p
          style={{
            fontFamily: "'Geist', sans-serif",
            fontSize: '14px',
            color: 'var(--sub, #a1a1aa)',
            lineHeight: 1.55,
            margin: '0 0 20px',
          }}
        >
          {current.message}
        </p>

        {/* Platform Feature Badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 24,
            padding: 12,
            borderRadius: 12,
            background: 'var(--s2, rgba(255,255,255,0.03))',
            border: '1px solid var(--border, rgba(255,255,255,0.08))',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text, #fff)', fontWeight: 600 }}>
            <span style={{ color: 'var(--green, #10b981)' }}>⚡</span>
            <span>Notes & PYQs</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text, #fff)', fontWeight: 600 }}>
            <span style={{ color: '#00B4D8' }}>🎥</span>
            <span>Video Courses</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text, #fff)', fontWeight: 600 }}>
            <span style={{ color: '#f59e0b' }}>🚀</span>
            <span>Projects & Articles</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text, #fff)', fontWeight: 600 }}>
            <span style={{ color: '#ec4899' }}>💬</span>
            <span>Developer Feed</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleSignInRedirect}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, var(--green, #10b981), #059669)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: "'Geist', sans-serif",
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
              transition: 'transform 0.15s ease, boxShadow 0.15s ease',
            }}
          >
            {current.btnText}
          </button>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              background: 'transparent',
              color: 'var(--sub, #a1a1aa)',
              border: '1px solid var(--border, rgba(255,255,255,0.12))',
              borderRadius: '12px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: "'Geist', sans-serif",
              cursor: 'pointer',
            }}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </Modal>
  );
}
