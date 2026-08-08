'use client';

import React, { useEffect } from 'react';
import Modal from './Modal';
import ClapIcon from '../icons/ClapIcon';
import { useAuth } from '../../context/AuthContext';

export default function LoginPromptModal({ isOpen, onClose, actionType = 'download', onLoginSuccess }) {
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
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--green, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 28 }}>download</span>
        </div>
      ),
      title: 'Sign in to Download',
      message: 'Create a free CPA account or sign in to download this study resource, PYQ, or lecture notes.',
      btnText: 'Sign In to Download',
    },
    save: {
      icon: (
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.12)', color: 'var(--warn, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 28 }}>bookmark</span>
        </div>
      ),
      title: 'Sign in to Save',
      message: 'Create a free CPA account or sign in to bookmark study resources and access them anytime.',
      btnText: 'Sign In to Save',
    },
    clap: {
      icon: (
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <ClapIcon size={28} color="#ef4444" filled />
        </div>
      ),
      title: 'Sign in to Clap',
      message: 'Create a free CPA account or sign in to show appreciation and clap for this resource contributor.',
      btnText: 'Sign In to Clap',
    },
    general: {
      icon: (
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0, 180, 216, 0.12)', color: '#00B4D8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 28 }}>lock</span>
        </div>
      ),
      title: 'Sign in Required',
      message: 'Please sign in to your CPA account to perform this action.',
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
    <Modal open={isOpen} onClose={onClose} width={420}>
      <div style={{ textAlign: 'center', padding: '10px 4px 6px' }}>
        {current.icon}

        <h3
          style={{
            fontFamily: "'Space Grotesk', 'Clash Display', sans-serif",
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--text, #ffffff)',
            margin: '0 0 10px',
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
            margin: '0 0 24px',
          }}
        >
          {current.message}
        </p>

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
