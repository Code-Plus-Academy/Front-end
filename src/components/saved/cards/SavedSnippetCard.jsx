'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Code2, Copy, Check, Trash2, FolderPlus, Terminal } from 'lucide-react';

export default function SavedSnippetCard({
  item,
  onUnsave,
  onAddToContainer,
  selected = false,
  onToggleSelect,
  selectable = false,
  containers = [],
}) {
  const [copied, setCopied] = useState(false);
  const codeContent = item.code || item.snippet_code || item.content || '// No code content';
  const language = item.language || item.lang || 'javascript';
  const lineCount = codeContent.split('\n').length;
  const assignedContainers = containers.filter(c => c.item_ids?.includes(item.id));

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article
      style={{
        background: 'var(--surface)',
        border: selected ? '1px solid var(--yellow, #F59E0B)' : '1px solid var(--border)',
        borderRadius: 'var(--r-md, 14px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: selected ? '0 0 0 2px rgba(245, 158, 11, 0.2), 0 6px 20px rgba(0,0,0,0.25)' : 'var(--shadow-card, 0 4px 16px rgba(0,0,0,0.12))',
        position: 'relative',
        boxSizing: 'border-box',
        height: '100%',
      }}
      className="group hover:border-yellow-500/40"
    >
      {/* Code Header Bar */}
      <div style={{
        background: '#0d1117',
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {selectable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect && onToggleSelect(item.id);
              }}
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                background: selected ? 'var(--yellow, #F59E0B)' : 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                color: '#000',
                padding: 0,
              }}
              aria-label={selected ? 'Deselect snippet' : 'Select snippet'}
            >
              {selected && <Check size={12} strokeWidth={3} />}
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Terminal size={14} color="var(--yellow, #F59E0B)" />
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--yellow, #F59E0B)',
              textTransform: 'uppercase',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {language}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--sub)', fontFamily: "'JetBrains Mono', monospace" }}>
            {lineCount} lines
          </span>

          <button
            type="button"
            onClick={handleCopy}
            title="Copy code to clipboard"
            style={{
              background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${copied ? '#10b981' : 'rgba(255,255,255,0.12)'}`,
              color: copied ? '#10b981' : 'var(--text)',
              borderRadius: 4,
              padding: '3px 8px',
              fontSize: 10.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s ease',
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Body Preview */}
      <div style={{
        background: '#090d16',
        padding: '12px 14px',
        maxHeight: 140,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <pre style={{
          margin: 0,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: 11.5,
          lineHeight: 1.45,
          color: '#e6edf3',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          <code>{codeContent.slice(0, 320)}{codeContent.length > 320 ? '...' : ''}</code>
        </pre>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 32,
          background: 'linear-gradient(to top, #090d16 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Title & Metadata */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: 8 }}>
        <div>
          <h3 style={{
            fontFamily: 'var(--font-display, inherit)',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text)',
            lineHeight: 1.35,
            margin: '0 0 4px',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {item.title || 'Code Snippet'}
          </h3>

          {item.description && (
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--sub)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {item.description}
            </p>
          )}

          {/* Assigned Containers */}
          {assignedContainers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {assignedContainers.map(c => (
                <span
                  key={c.id}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: `${c.color_token || 'var(--yellow)'}18`,
                    color: c.color_token || 'var(--yellow)',
                    border: `1px solid ${c.color_token || 'var(--yellow)'}35`,
                  }}
                >
                  ⚡ {c.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border)',
          paddingTop: 8,
          fontSize: 11.5,
          color: 'var(--sub)',
        }}>
          <span style={{ fontSize: 11, color: 'var(--sub)' }}>
            {item.creator_name || 'CPA Snippet'}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToContainer && onAddToContainer(item);
              }}
              title="Add to Snippet Notebook"
              style={{
                background: 'var(--s2, rgba(255,255,255,0.05))',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '4px 8px',
                color: 'var(--text)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
              className="hover:border-yellow-400 hover:text-yellow-400"
            >
              <FolderPlus size={13} />
              <span>Notebook</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUnsave && onUnsave(item.id, 'snippet');
              }}
              title="Remove from saved"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--sub)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.15s',
              }}
              className="hover:text-red-400"
              aria-label="Remove bookmark"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
