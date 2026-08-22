'use client';

import React, { useState } from 'react';
import { X, Lock, Globe, Sparkles, Check, Loader2 } from 'lucide-react';

const CONTAINER_TYPES = [
  { id: 'playlist', label: 'Video Playlist', icon: '🎬', desc: 'Sequential dev shorts & tutorials with queue playback' },
  { id: 'envelope', label: 'Course Envelope', icon: '✉️', desc: 'Enclose structured courses, progress rings & lecture notes' },
  { id: 'collection', label: 'Social Collection', icon: '💡', desc: 'Curate community posts, discussions & tech moodboards' },
  { id: 'study_pack', label: 'Academic Study Pack', icon: '📘', desc: 'Bundle semester notes, PYQs, and formula cheatsheets' },
  { id: 'snippet_notebook', label: 'Snippet Notebook', icon: '⚡', desc: 'Organize code blocks, algorithm templates & utility scripts' },
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
  const [containerType, setContainerType] = useState(initialType);
  const [description, setDescription] = useState('');
  const [colorToken, setColorToken] = useState(COLOR_TOKENS[0]);
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
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
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md, 16px)',
          width: '100%',
          maxWidth: '520px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-modal, 0 20px 60px rgba(0, 0, 0, 0.7))',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display, inherit)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
            Create New Knowledge Container
          </h3>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--sub)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 6,
            }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Container Type Selector */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Choose Container Paradigm
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
              {CONTAINER_TYPES.map((type) => {
                const isSelected = containerType === type.id;
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
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{type.icon}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                        {type.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--sub)', lineHeight: 1.3 }}>
                        {type.desc}
                      </div>
                    </div>
                    {isSelected && <Check size={16} color="var(--primary, #3B7CFF)" strokeWidth={3} />}
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
              <div style={{ display: 'flex', gap: 6 }}>
                {COLOR_TOKENS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColorToken(c)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: c,
                      border: colorToken === c ? '2px solid #fff' : 'none',
                      cursor: 'pointer',
                      padding: 0,
                      boxShadow: colorToken === c ? `0 0 8px ${c}` : 'none',
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
                    padding: '5px 10px',
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
                  }}
                >
                  <Lock size={12} />
                  <span>Private</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  style={{
                    padding: '5px 10px',
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
                  }}
                >
                  <Globe size={12} />
                  <span>Public</span>
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
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
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="btn-primary"
              style={{
                padding: '8px 20px',
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                opacity: !name.trim() || isSubmitting ? 0.6 : 1,
              }}
            >
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              <span>Create Container</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
