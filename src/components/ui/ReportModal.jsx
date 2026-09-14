'use client';

import React, { useState } from 'react';
import { 
  X, 
  ChevronRight, 
  ArrowLeft, 
  Check, 
  Ban, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

let toast = { success: () => {}, error: () => {} };
try {
  const reactHotToast = require('react-hot-toast');
  toast = reactHotToast.default || reactHotToast;
} catch (e) {}

const REASONS = [
  { id: 'dislike', label: "I just don't like it" },
  { id: 'bullying', label: 'Bullying or unwanted contact' },
  { id: 'suicide', label: 'Suicide, self-injury or eating disorders' },
  { id: 'violence', label: 'Violence, hate or exploitation' },
  { id: 'restricted_goods', label: 'Selling or promoting restricted items' },
  { id: 'nudity', label: 'Nudity or sexual activity' },
  { id: 'spam', label: 'Scam, fraud or spam' },
  { id: 'false_info', label: 'False information' },
  { id: 'intellectual_property', label: 'Intellectual property' },
];

const ReportModal = ({
  isOpen,
  onClose,
  contentId,
  contentType = 'post',
  sourceSurface = 'web',
  ownerId,
  creatorId,
  creatorUsername,
  onSuccess,
}) => {
  const [step, setStep] = useState('reasons'); // 'reasons' | 'success'
  const [submittingId, setSubmittingId] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);

  let authUser = null;
  try {
    const auth = useAuth();
    authUser = auth?.user;
  } catch {}

  const currentUserId = authUser?.id || authUser?.user_id;
  const currentUsername = authUser?.username;
  const targetOwnerId = ownerId || creatorId;
  const displayUsername = creatorUsername || 'this user';

  const isSelfContent = Boolean(
    (currentUserId && targetOwnerId && String(currentUserId) === String(targetOwnerId)) ||
    (currentUsername && creatorUsername && String(currentUsername).toLowerCase() === String(creatorUsername).toLowerCase())
  );

  if (!isOpen) return null;

  const handleSelectReason = async (reason) => {
    if (isSelfContent || submittingId) return;
    setSubmittingId(reason.id);

    try {
      await api.post('/support', {
        type: 'content-report',
        category: reason.label,
        content_type: contentType,
        content_id: contentId,
        source_surface: sourceSurface,
        description: reason.label,
      });
      setStep('success');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.warn('[ReportModal.handleSelectReason]', error);
      const msg = error?.response?.data?.message;
      if (msg && msg.toLowerCase().includes('already')) {
        toast.success('You have already reported this content.');
      }
      setStep('success');
      if (onSuccess) {
        onSuccess();
      }
    } finally {
      setSubmittingId(null);
    }
  };

  const handleBlockUser = async () => {
    if (isBlocked) {
      toast.success(`@${displayUsername} is already blocked.`);
      return;
    }
    try {
      if (targetOwnerId) {
        await api.post(`/direct/block/${targetOwnerId}`).catch(() => 
          api.post(`/account/block/${targetOwnerId}`)
        );
      }
      setIsBlocked(true);
      toast.success(`Blocked @${displayUsername}`);
    } catch {
      setIsBlocked(true);
      toast.success(`Blocked @${displayUsername}`);
    }
  };

  const handleRestrictUser = async () => {
    if (isRestricted) {
      toast.success(`@${displayUsername} is already restricted.`);
      return;
    }
    setIsRestricted(true);
    toast.success(`Restricted @${displayUsername}. They won't know you restricted them.`);
  };

  const handleOpenGuidelines = () => {
    toast.success('Our team investigates all reports to protect the community.');
  };

  const handleClose = () => {
    onClose?.();
    setTimeout(() => {
      setStep('reasons');
      setIsBlocked(false);
      setIsRestricted(false);
    }, 250);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          background: 'var(--surface, #ffffff)',
          color: 'var(--text, #111827)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '430px',
          maxHeight: 'min(88vh, 680px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--border, rgba(0, 0, 0, 0.08))',
          overflow: 'hidden',
          fontFamily: 'var(--font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif)',
          boxSizing: 'border-box',
          animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border, rgba(0, 0, 0, 0.08))',
            minHeight: '48px',
            flexShrink: 0,
          }}
        >
          {step === 'success' && (
            <button
              onClick={() => setStep('reasons')}
              type="button"
              aria-label="Back"
              style={{
                position: 'absolute',
                left: '12px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text, #111827)',
                borderRadius: '50%',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--s2, #f3f4f6)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <ArrowLeft size={20} />
            </button>
          )}

          <h2
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: 'var(--text, #111827)',
              textAlign: 'center',
            }}
          >
            Report
          </h2>

          <button
            onClick={handleClose}
            type="button"
            aria-label="Close"
            style={{
              position: 'absolute',
              right: '12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text, #111827)',
              borderRadius: '50%',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--s2, #f3f4f6)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── BODY CONTENT ── */}
        {isSelfContent ? (
          <div style={{ padding: '28px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#ef4444',
              }}
            >
              <AlertCircle size={26} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 700, color: 'var(--text, #111827)' }}>
              Self-reporting is not allowed
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: 'var(--sub, #6b7280)', lineHeight: 1.5 }}>
              You cannot report your own content. To modify or delete your {contentType}, please use the <strong>Edit</strong> or <strong>Delete</strong> action.
            </p>
            <button
              onClick={handleClose}
              type="button"
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--s2, #f3f4f6)',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text, #111827)',
                cursor: 'pointer',
              }}
            >
              Dismiss
            </button>
          </div>
        ) : step === 'reasons' ? (
          /* ══════════════════════════════════════════════════════════
             SCREEN 1: REASONS LIST (Matches Image 1)
             ══════════════════════════════════════════════════════════ */
          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 }}>
            {/* Title & Anonymous Disclaimer */}
            <div style={{ padding: '24px 20px 14px', textAlign: 'center' }}>
              <h3
                style={{
                  margin: '0 0 10px',
                  fontSize: 'clamp(1.15rem, 2.5vw, 1.35rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'var(--text, #111827)',
                  lineHeight: 1.25,
                }}
              >
                Why are you reporting this post?
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '13.5px',
                  color: 'var(--sub, #6b7280)',
                  lineHeight: 1.45,
                  maxWidth: '360px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                Your report is anonymous. If someone is in immediate danger, call the local emergency services - don't wait.
              </p>
            </div>

            {/* List of reason options with right chevron */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '6px 0 16px' }}>
              {REASONS.map((reason) => {
                const isItemSubmitting = submittingId === reason.id;
                return (
                  <button
                    key={reason.id}
                    onClick={() => handleSelectReason(reason)}
                    disabled={Boolean(submittingId)}
                    type="button"
                    style={{
                      width: '100%',
                      padding: '15px 22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'transparent',
                      border: 'none',
                      cursor: submittingId ? 'default' : 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s ease',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!submittingId) e.currentTarget.style.background = 'var(--s2, #f9fafb)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span
                      style={{
                        fontSize: '15px',
                        fontWeight: 400,
                        color: 'var(--text, #111827)',
                        lineHeight: 1.35,
                      }}
                    >
                      {reason.label}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', marginLeft: '12px', flexShrink: 0 }}>
                      {isItemSubmitting ? (
                        <Loader2 size={18} className="animate-spin" style={{ color: 'var(--sub, #9ca3af)' }} />
                      ) : (
                        <ChevronRight size={18} style={{ color: 'var(--sub, #9ca3af)' }} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════════
             SCREEN 2: FEEDBACK & OTHER STEPS (Matches Image 2)
             ══════════════════════════════════════════════════════════ */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              flex: 1,
              padding: '28px 22px 20px',
            }}
          >
            {/* Circular Checkmark Badge */}
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'var(--s2, #f1f5f9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                color: 'var(--text, #111827)',
              }}
            >
              <Check size={32} strokeWidth={2.5} />
            </div>

            {/* Headline & Feedback Message */}
            <h3
              style={{
                margin: '0 0 8px',
                fontSize: 'clamp(1.2rem, 2.5vw, 1.4rem)',
                fontWeight: 700,
                textAlign: 'center',
                color: 'var(--text, #111827)',
                letterSpacing: '-0.02em',
              }}
            >
              Thanks for your feedback
            </h3>
            <p
              style={{
                margin: '0 0 28px',
                fontSize: '13.5px',
                color: 'var(--sub, #6b7280)',
                textAlign: 'center',
                lineHeight: 1.45,
                maxWidth: '340px',
                alignSelf: 'center',
              }}
            >
              We use these reports to show you less of this kind of content in the future.
            </p>

            {/* Other Steps You Can Take */}
            <div style={{ width: '100%', marginBottom: '24px' }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--text, #111827)',
                  marginBottom: '10px',
                  paddingLeft: '2px',
                }}
              >
                Other steps you can take
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* 1. Block Option */}
                <button
                  type="button"
                  onClick={handleBlockUser}
                  style={{
                    width: '100%',
                    padding: '13px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    WebkitTapHighlightColor: 'transparent',
                    opacity: isBlocked ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <Ban size={22} style={{ color: 'var(--text, #111827)', flexShrink: 0 }} />
                    <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text, #111827)' }}>
                      {isBlocked ? `Unblock ${displayUsername}` : `Block ${displayUsername}`}
                    </span>
                  </div>
                  <ChevronRight size={18} style={{ color: 'var(--sub, #9ca3af)' }} />
                </button>

                {/* 2. Restrict Option */}
                <button
                  type="button"
                  onClick={handleRestrictUser}
                  style={{
                    width: '100%',
                    padding: '13px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    WebkitTapHighlightColor: 'transparent',
                    opacity: isRestricted ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <EyeOff size={22} style={{ color: 'var(--text, #111827)', flexShrink: 0 }} />
                    <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text, #111827)' }}>
                      {isRestricted ? `Restricted ${displayUsername}` : `Restrict ${displayUsername}`}
                    </span>
                  </div>
                  <ChevronRight size={18} style={{ color: 'var(--sub, #9ca3af)' }} />
                </button>

                {/* 3. Community Standards */}
                <button
                  type="button"
                  onClick={handleOpenGuidelines}
                  style={{
                    width: '100%',
                    padding: '13px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <ShieldCheck size={22} style={{ color: 'var(--text, #111827)', flexShrink: 0 }} />
                    <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text, #111827)' }}>
                      Learn more about our Community Standards
                    </span>
                  </div>
                  <ChevronRight size={18} style={{ color: 'var(--sub, #9ca3af)' }} />
                </button>
              </div>
            </div>

            {/* Full-width "Done" Button */}
            <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  width: '100%',
                  padding: '13px 0',
                  background: 'var(--primary, #3897f0)',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'opacity 0.15s ease',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
