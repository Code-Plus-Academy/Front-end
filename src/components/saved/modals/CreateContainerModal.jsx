'use client';

import React, { useState } from 'react';
import { X, Lock, Globe, Sparkles, Check, Loader2 } from 'lucide-react';
import { PlaylistIcon, CollectionIcon, StudyPackIcon, EnvelopeIcon, VaultIcon } from '../icons/ContainerIcons';

const CONTAINER_TYPES = [
  { id: 'playlist', label: 'Video Playlist', icon: PlaylistIcon, desc: 'Sequential dev shorts & tutorials with queue playback' },
  { id: 'envelope', label: 'Learning Envelope', icon: EnvelopeIcon, desc: 'Enclose structured courses, progress rings & lecture notes' },
  { id: 'packs', label: 'Study Pack', icon: StudyPackIcon, desc: 'Bundle semester notes, PYQs, and formula cheatsheets' },
  { id: 'collection', label: 'Social Collection', icon: CollectionIcon, desc: 'Curate community posts, discussions & tech resources' },
  { id: 'vaults', label: 'Code Vault', icon: VaultIcon, desc: 'Organize code snippets, algorithm templates & secrets' },
];

const COLOR_TOKENS = [
  '#3B7CFF', // Blue
  '#00B4D8', // Cyan
  '#34C77B', // Emerald
  '#9333EA', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#EF4444', // Red
];

export default function CreateContainerModal({
  isOpen,
  onClose,
  onCreate,
  initialType = 'playlist',
}) {
  const [name, setName] = useState('');
  const [containerType, setContainerType] = useState(initialType === 'study_pack' ? 'packs' : (initialType === 'snippet_notebook' ? 'vaults' : initialType));
  const [description, setDescription] = useState('');
  const [colorToken, setColorToken] = useState(COLOR_TOKENS[0]);
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        container_type: containerType,
        description: description.trim(),
        color_token: colorToken,
        is_public: isPublic,
      });
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error('Failed to create container:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(8px, 2vw, 16px)',
        boxSizing: 'border-box',
      }}
      className="create-modal-overlay"
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md, 16px)',
          width: '100%',
          maxWidth: '520px',
          maxHeight: 'min(640px, 90vh)',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          position: 'relative',
        }}
        className="create-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Bar Handle */}
        <div className="mobile-pull-handle" style={{ display: 'none', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '8px auto 2px' }} />
        </div>

        {/* Header */}
        <div style={{
          padding: '16px 20px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display, inherit)', fontSize: 'clamp(15px, 2vw, 17px)', fontWeight: 700, color: 'var(--text)' }}>
            Create New Container
          </h3>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--sub)',
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              minWidth: 32,
              minHeight: 32,
            }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: 'clamp(14px, 3vw, 20px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            boxSizing: 'border-box',
          }}
        >
          {/* Container Type Selector */}
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Container Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
              {CONTAINER_TYPES.map((type) => {
                const isSelected = containerType === type.id;
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setContainerType(type.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: isSelected ? 'rgba(59, 124, 255, 0.1)' : 'var(--s2)',
                      border: isSelected ? '1px solid var(--primary, #3B7CFF)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      minHeight: 48,
                      boxSizing: 'border-box',
                    }}
                    className="active:scale-[0.99]"
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: isSelected ? 'var(--primary, #3B7CFF)' : 'var(--surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSelected ? '#fff' : 'var(--sub)',
                      flexShrink: 0,
                    }}>
                      <Icon size={16} color={isSelected ? '#fff' : 'currentColor'} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                        {type.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--sub)', lineHeight: 1.3 }}>
                        {type.desc}
                      </div>
                    </div>
                    {isSelected && <Check size={16} color="var(--primary, #3B7CFF)" strokeWidth={3} style={{ flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name input */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
              Container Title <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., SPPU Sem 4 DBMS Exam Pack, System Design 101..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                background: 'var(--s2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: 13.5,
                outline: 'none',
                boxSizing: 'border-box',
                minHeight: 42,
              }}
            />
          </div>

          {/* Description input */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
              Description (Optional)
            </label>
            <textarea
              placeholder="Add goals, syllabus details, or study notes..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                background: 'var(--s2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: 13,
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Color & Privacy Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                Accent Color
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {COLOR_TOKENS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColorToken(c)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: c,
                      border: colorToken === c ? '2px solid #fff' : 'none',
                      cursor: 'pointer',
                      padding: 0,
                      boxShadow: colorToken === c ? `0 0 8px ${c}` : 'none',
                      minWidth: 24,
                    }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                Privacy Status
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: !isPublic ? 'var(--s3)' : 'var(--s2)',
                    border: '1px solid var(--border)',
                    color: !isPublic ? '#fff' : 'var(--sub)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    minHeight: 34,
                  }}
                >
                  <Lock size={12} />
                  <span>Private</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: isPublic ? 'var(--s3)' : 'var(--s2)',
                    border: '1px solid var(--border)',
                    color: isPublic ? '#fff' : 'var(--sub)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    minHeight: 34,
                  }}
                >
                  <Globe size={12} />
                  <span>Public</span>
                </button>
              </div>
            </div>
          </div>

          {/* Submit / Action Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            paddingTop: 12,
            marginTop: 4,
            borderTop: '1px solid var(--border)',
            paddingBottom: 'max(4px, env(safe-area-inset-bottom))',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'none',
                border: 'none',
                color: 'var(--sub)',
                fontSize: 13,
                cursor: 'pointer',
                minHeight: 38,
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="btn-primary"
              style={{
                padding: '8px 22px',
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                opacity: !name.trim() || isSubmitting ? 0.6 : 1,
                minHeight: 38,
                borderRadius: 8,
              }}
            >
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              <span>Create Container</span>
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .create-modal-overlay {
            align-items: flex-end !important;
            padding: 0 !important;
          }
          .create-modal-card {
            max-width: 100% !important;
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
            border-top-left-radius: 20px !important;
            border-top-right-radius: 20px !important;
            max-height: 85vh !important;
            animation: slideUpCreate 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          .mobile-pull-handle {
            display: block !important;
          }
        }
        @keyframes slideUpCreate {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
