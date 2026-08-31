import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { buildOAuthUrl } from '../../utils/navigation';

/**
 * Instagram-style auth prompt modal.
 * Renders a backdrop + centered card with login form.
 *
 * Props:
 *   open        – boolean
 *   onClose     – () => void
 *   onSuccess   – () => void  (called after successful login so caller can retry the action)
 *   isDark      – boolean (theme)
 *   message     – optional custom prompt string
 */
export default function AuthPromptModal({ open, onClose, onSuccess, isDark, message }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, refreshUser } = useAuth();
  const navigate = useNavigate();

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', formData);
      if (login) {
        login(res.data);
      }
      await refreshUser();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError(err.response?.data?.message || 'Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = buildOAuthUrl('google', window.location.pathname + window.location.search);
  };

  const handleGithub = () => {
    window.location.href = buildOAuthUrl('github', window.location.pathname + window.location.search);
  };

  const handleGoToRegister = () => {
    onClose();
    const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
    navigate(`/register?next=${currentPath}`);
  };

  // Colors
  const bg = isDark ? '#111827' : '#FFFFFF';
  const surface = isDark ? '#1A1F2E' : '#F8FAFC';
  const border = isDark ? '#374151' : '#E2E8F0';
  const text = isDark ? '#F1F5F9' : '#0F172A';
  const textSec = isDark ? '#94A3B8' : '#64748B';
  const purple = '#7A00FF';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        animation: 'authModalFadeIn 0.2s ease',
      }}
    >
      <style>{`
        @keyframes authModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes authModalSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .auth-modal-input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1.5px solid ${border};
          background: ${surface};
          color: ${text};
          font-family: 'Manrope', sans-serif;
          font-size: 14px;
          font-weight: 500;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .auth-modal-input:focus {
          border-color: ${purple};
          box-shadow: 0 0 0 3px rgba(122, 0, 255, 0.12);
        }
        .auth-modal-input::placeholder {
          color: ${textSec};
          opacity: 0.7;
        }
        .auth-modal-social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 11px;
          border-radius: 10px;
          border: 1.5px solid ${border};
          background: ${surface};
          color: ${text};
          font-family: 'Manrope', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .auth-modal-social-btn:hover {
          border-color: ${purple};
          background: ${isDark ? 'rgba(122,0,255,0.06)' : 'rgba(122,0,255,0.03)'};
          transform: translateY(-1px);
        }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 20,
          width: '100%',
          maxWidth: 400,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4)',
          animation: 'authModalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '28px 28px 0',
          textAlign: 'center',
          position: 'relative',
        }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'none', border: 'none', cursor: 'pointer',
              color: textSec, fontSize: 20, lineHeight: 1,
              width: 32, height: 32, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
              e.currentTarget.style.color = text;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = textSec;
            }}
          >✕</button>

          {/* Logo / Brand */}
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'linear-gradient(135deg, #7A00FF, #A855F7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 22, color: '#fff', fontWeight: 900,
            boxShadow: '0 8px 24px rgba(122, 0, 255, 0.3)',
          }}>⟨/⟩</div>

          <h2 style={{
            fontSize: 22, fontWeight: 800, color: text,
            margin: '0 0 6px', fontFamily: "'Manrope', sans-serif",
          }}>
            Log in to continue
          </h2>
          <p style={{
            fontSize: 14, color: textSec, margin: '0 0 20px',
            lineHeight: 1.5, fontWeight: 500,
          }}>
            {message || 'Sign in to follow creators, engage with posts, and join the community.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '0 28px 24px' }}>
          {/* Social buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <button type="button" onClick={handleGoogle} disabled={loading} className="auth-modal-social-btn">
              <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, flexShrink: 0 }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <button type="button" onClick={handleGithub} disabled={loading} className="auth-modal-social-btn">
              <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: 'currentColor', flexShrink: 0 }}>
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 18,
          }}>
            <div style={{ flex: 1, height: 1, background: border }} />
            <span style={{ fontSize: 11, color: textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>or</span>
            <div style={{ flex: 1, height: 1, background: border }} />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 12 }}>
            <input
              type="email"
              required
              className="auth-modal-input"
              value={formData.email}
              onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
              placeholder="Email address"
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="password"
              required
              className="auth-modal-input"
              value={formData.password}
              onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
              placeholder="Password"
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, marginBottom: 14,
              background: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444', fontSize: 13, fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #7A00FF, #6D28D9)',
              color: '#fff', fontSize: 15, fontWeight: 700,
              fontFamily: "'Manrope', sans-serif",
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 4px 16px rgba(122, 0, 255, 0.3)',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? 'Signing in...' : 'Log In'}
          </button>

          {/* Register link */}
          <p style={{
            textAlign: 'center', marginTop: 18, marginBottom: 0,
            fontSize: 13, color: textSec, fontWeight: 500,
          }}>
            Don't have an account?{' '}
            <span
              onClick={handleGoToRegister}
              style={{
                color: purple, fontWeight: 700, cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Sign up
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}
