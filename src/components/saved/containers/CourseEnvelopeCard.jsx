'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, BookOpen, Layers, CheckCircle2, FileText, ArrowRight, Sparkles, FolderPlus } from 'lucide-react';

export default function CourseEnvelopeCard({
  container,
  items = [],
  onOpenEnvelope,
  onAddMaterials,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerItems = items.filter(i => container.item_ids?.includes(i.id)) || [];
  
  const courses = containerItems.filter(i => i.item_kind === 'course' || i.type === 'course');
  const attachedNotes = containerItems.filter(i => i.item_kind === 'note' || i.type === 'notes' || i.type === 'question_paper');

  const totalProgress = courses.length > 0 
    ? Math.round(courses.reduce((acc, c) => acc + (c.progress_percentage || c.progress || 0), 0) / courses.length) 
    : (container.metadata?.progress || 45);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',
        border: '1px solid rgba(59, 124, 255, 0.25)',
        borderRadius: 'var(--r-md, 16px)',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.25s ease',
        boxSizing: 'border-box',
        width: '100%',
        marginBottom: 16,
      }}
      className="group hover:border-blue-500/50"
    >
      {/* ── Top Envelope Flap / Header ── */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(59, 124, 255, 0.15)',
            color: 'var(--primary, #3B7CFF)',
            border: '1px solid rgba(59, 124, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}>
            ✉️
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 4,
                background: 'rgba(59, 124, 255, 0.2)',
                color: 'var(--primary, #3B7CFF)',
                textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                Learning Envelope
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--sub)', fontWeight: 600 }}>
                {courses.length} {courses.length === 1 ? 'Course' : 'Courses'} · {attachedNotes.length} Attached Materials
              </span>
            </div>

            <h3 style={{
              margin: '4px 0 0',
              fontFamily: 'var(--font-display, inherit)',
              fontSize: 'clamp(15px, 2vw, 17px)',
              fontWeight: 700,
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {container.name}
            </h3>
          </div>
        </div>

        {/* Progress & Expand Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 11, color: 'var(--sub)', fontWeight: 600 }}>Track Progress</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--green, #34C77B)', fontFamily: "'JetBrains Mono', monospace" }}>
              {totalProgress}%
            </span>
          </div>

          <button
            type="button"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text)',
              cursor: 'pointer',
              padding: 0,
            }}
            aria-label={isExpanded ? 'Collapse envelope' : 'Expand envelope'}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* ── Expanded Envelope Contents ── */}
      {isExpanded && (
        <div style={{ padding: '18px 20px', background: 'rgba(0, 0, 0, 0.2)' }}>
          {container.description && (
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--sub)', lineHeight: 1.5 }}>
              {container.description}
            </p>
          )}

          {/* Enclosed Courses Grid */}
          {courses.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--primary, #3B7CFF)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={13} />
                <span>Enclosed Curriculum Courses ({courses.length})</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.slug || course.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'border-color 0.2s',
                    }}
                    className="hover:border-blue-400"
                  >
                    <div style={{ width: 42, height: 42, borderRadius: 8, overflow: 'hidden', background: '#0a0e17', flexShrink: 0 }}>
                      <img
                        src={course.thumbnail_url || course.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=200'}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {course.title}
                      </h4>
                      <span style={{ fontSize: 11, color: 'var(--sub)' }}>
                        {course.progress || 0}% completed
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Enclosed Study Notes & Materials */}
          {attachedNotes.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--green, #00b4d8)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={13} />
                <span>Attached Study Dossier ({attachedNotes.length})</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                {attachedNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={`/notes/resource/${note.slug || note.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                    className="hover:border-cyan-400"
                  >
                    <span style={{ fontSize: 18 }}>📘</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {note.title}
                      </h4>
                      <span style={{ fontSize: 10.5, color: 'var(--sub)' }}>
                        {note.subject_name || 'Attached Material'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Envelope Action Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => onOpenEnvelope && onOpenEnvelope(container)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                background: 'var(--primary, #3B7CFF)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 12,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span>Open Full Envelope Hub</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              onClick={() => onAddMaterials && onAddMaterials(container)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                background: 'var(--s2)',
                color: 'var(--text)',
                fontWeight: 600,
                fontSize: 12,
                border: '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              <FolderPlus size={14} />
              <span>Enclose More Materials</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
