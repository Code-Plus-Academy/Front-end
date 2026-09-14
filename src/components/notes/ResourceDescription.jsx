'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ResourceDescription({ description, showLegalNotice = true }) {
  const [expanded, setExpanded] = useState(false);

  if (!description && !showLegalNotice) return null;

  return (
    <div className="notes-desc-box">
      <style>{`
        .notes-desc-box {
          background: var(--surface, #0a0e14);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          border-radius: var(--r-md, 14px);
          padding: 18px 20px;
          margin-bottom: 24px;
        }
        .notes-desc-title {
          font-family: var(--font-display, sans-serif);
          font-size: 15px;
          font-weight: 700;
          margin: 0 0 10px;
          color: var(--text, #fff);
          letter-spacing: -0.01em;
        }
        .notes-desc-content {
          color: var(--sub, #94a3b8);
          font-size: 13.5px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
          position: relative;
        }
        .notes-desc-collapsed {
          max-height: 108px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          mask-image: linear-gradient(180deg, #000 60%, transparent 100%);
          -webkit-mask-image: linear-gradient(180deg, #000 60%, transparent 100%);
        }
        .notes-desc-toggle-btn {
          background: none;
          border: none;
          color: var(--cyan, #00dbe9);
          font-size: 12.5px;
          font-weight: 700;
          font-family: var(--font-mono, monospace);
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 8px 0 0;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }
        .notes-desc-toggle-btn:hover {
          opacity: 0.8;
          text-decoration: underline;
        }
        .notes-legal-inline {
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid var(--border, rgba(255, 255, 255, 0.06));
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 12px;
          color: var(--dim, #94a3b8);
          line-height: 1.5;
        }
        .notes-legal-inline strong {
          color: #ef4444;
          font-weight: 700;
        }
      `}</style>

      {description && (
        <>
          <h3 className="notes-desc-title">Description</h3>
          <div className={`notes-desc-content ${!expanded ? 'notes-desc-collapsed' : ''}`}>
            <p style={{ margin: 0 }}>{description}</p>
          </div>

          {description.length > 180 && (
            <button
              type="button"
              onClick={() => setExpanded(prev => !prev)}
              className="notes-desc-toggle-btn"
              aria-expanded={expanded}
            >
              <span>{expanded ? 'Show less' : 'Show more'}</span>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </>
      )}

      {showLegalNotice && (
        <div className="notes-legal-inline">
          <span className="material-symbols-rounded" style={{ color: '#ef4444', fontSize: 18, marginTop: 1, flexShrink: 0 }}>
            warning
          </span>
          <div>
            <strong>Legal Disclaimer & Source Notice: </strong>
            <span>
              This source material does not belong to the publisher. If any legal action needs to be taken, please direct it against the original content source.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
