'use client';

import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

let toast = { success: () => {}, error: () => {} };
try {
  const reactHotToast = require('react-hot-toast');
  toast = reactHotToast.default || reactHotToast;
} catch (e) {}

const ReportModal = ({
  isOpen,
  onClose,
  contentId,
  contentType,
  sourceSurface = 'web',
  ownerId,
  creatorId,
  creatorUsername
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  let authUser = null;
  try {
    const auth = useAuth();
    authUser = auth?.user;
  } catch {}

  const currentUserId = authUser?.id || authUser?.user_id;
  const currentUsername = authUser?.username;
  const targetOwnerId = ownerId || creatorId;

  const isSelfContent = Boolean(
    (currentUserId && targetOwnerId && String(currentUserId) === String(targetOwnerId)) ||
    (currentUsername && creatorUsername && String(currentUsername).toLowerCase() === String(creatorUsername).toLowerCase())
  );

  if (!isOpen) return null;

  const reasons = [
    { id: 'spam', label: 'Spam or misleading' },
    { id: 'inappropriate', label: 'Inappropriate content' },
    { id: 'copyright', label: 'Copyright or intellectual property violation' },
    { id: 'incorrect', label: 'Incorrect or false information' },
    { id: 'impersonation', label: 'Impersonation' },
    { id: 'other', label: 'Other' },
  ];

  const handleSubmit = async () => {
    if (!selectedReason || isSelfContent) return;
    setIsSubmitting(true);
    try {
      const reasonObj = reasons.find(r => r.id === selectedReason);
      const categoryLabel = reasonObj ? reasonObj.label : selectedReason;
      await api.post('/support', {
        type: 'content-report',
        category: categoryLabel,
        content_type: contentType,
        content_id: contentId,
        source_surface: sourceSurface,
        description: description || categoryLabel,
      });
      toast.success("Report submitted. We'll review it shortly.");
      onClose();
    } catch (error) {
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to submit report. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'var(--surface, #fff)',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '440px',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--font-body, -apple-system, sans-serif)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--text, #191919)' }}>Report Content</h2>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px', color: 'var(--text, #191919)' }}
          >
            <X size={20} />
          </button>
        </div>

        {isSelfContent ? (
          <div style={{ padding: '20px' }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '16px',
              color: '#ef4444',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <AlertCircle size={22} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                <strong>Self-reporting is not allowed.</strong> You cannot report your own content. To modify or delete your content, please use the <strong>Edit</strong> option on your post.
              </div>
            </div>
          </div>
        ) : (
          <>
            <p style={{ padding: '0 20px', margin: '8px 0 16px', fontSize: '12px', color: 'var(--sub, #666)' }}>
              Why are you reporting this {contentType}?
            </p>

            <div style={{ padding: '0 0 16px 0' }}>
              {reasons.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: selectedReason === reason.id ? 'var(--s2, #f5f5f5)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: 'var(--text, #191919)'
                  }}
                  onMouseEnter={(e) => { if (selectedReason !== reason.id) e.currentTarget.style.background = 'var(--s2, #f5f5f5)'; }}
                  onMouseLeave={(e) => { if (selectedReason !== reason.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div 
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: `2px solid ${selectedReason === reason.id ? 'var(--green, #10a37f)' : 'var(--border, #ccc)'}`,
                      background: selectedReason === reason.id ? 'var(--green, #10a37f)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {selectedReason === reason.id && (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />
                    )}
                  </div>
                  {reason.label}
                </button>
              ))}

              {selectedReason === 'other' && (
                <div style={{ padding: '8px 20px' }}>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please describe the issue..."
                    maxLength={500}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border, #e0e0e0)',
                      background: 'var(--surface, #fff)',
                      color: 'var(--text, #191919)',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border, #eee)' }}>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: '1px solid var(--border, #ccc)',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'var(--text, #191919)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedReason || isSubmitting}
                style={{
                  background: '#d93025',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontWeight: 600,
                  cursor: (!selectedReason || isSubmitting) ? 'default' : 'pointer',
                  opacity: (!selectedReason || isSubmitting) ? 0.5 : 1,
                  fontSize: '14px'
                }}
              >
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
