'use client';

import React from 'react';

/**
 * 1. Video Playlist Icon (YouTube / Creator style)
 * Reference: Youtuber / Video Playlist by Magnific (Flaticon)
 */
export function PlaylistIcon({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      {/* Screen / Monitor frame with rounded corners */}
      <rect x="2" y="3" width="20" height="14" rx="3" />
      {/* Centered Video Play Triangle */}
      <polygon points="10 8 16 10 10 12" fill={color} stroke="none" />
      {/* Playlist queue lines underneath */}
      <line x1="6" y1="21" x2="18" y2="21" />
      <line x1="10" y1="17" x2="14" y2="17" />
    </svg>
  );
}

/**
 * 2. Collection Icon (Layered Album / Multi-Card Stack)
 * Reference: Collection by mikan933 (Flaticon)
 */
export function CollectionIcon({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      {/* Back Layer Card */}
      <path d="M4 7V4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v3" opacity="0.5" />
      {/* Middle Layer Card */}
      <path d="M2 10V8a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2" opacity="0.75" />
      {/* Front Main Collection Card */}
      <rect x="2" y="10" width="20" height="11" rx="2" />
      {/* Collection Grid / Bookmark badge inside */}
      <circle cx="8" cy="15.5" r="1.5" fill={color} stroke="none" />
      <circle cx="16" cy="15.5" r="1.5" fill={color} stroke="none" />
      <line x1="11" y1="15.5" x2="13" y2="15.5" />
    </svg>
  );
}

/**
 * 3. Study Pack Icon (Data & Note Collection Bundle)
 * Reference: Data Collection / Study Pack by Karyative (Flaticon)
 */
export function StudyPackIcon({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      {/* Study Pack Folder Container */}
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      {/* Embedded Study Data / Exam Chart Sheets inside folder */}
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="13" y2="16" />
      {/* Sparkle / Check indicator */}
      <circle cx="16" cy="16" r="1" fill={color} stroke="none" />
    </svg>
  );
}

/**
 * 4. Learning Envelope Icon
 * Reference: Envelope by Slidicon (Flaticon)
 */
export function EnvelopeIcon({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      {/* Slidicon-style Envelope Body */}
      <rect x="2" y="4" width="20" height="16" rx="3" />
      {/* Top Fold V-Flap */}
      <path d="m22 7-8.97 6.73a1.75 1.75 0 0 1-2.06 0L2 7" />
      {/* Bottom Subtle Corner Creases */}
      <line x1="2" y1="20" x2="9" y2="13" opacity="0.6" />
      <line x1="22" y1="20" x2="15" y2="13" opacity="0.6" />
    </svg>
  );
}

/**
 * 5. Code Vault Icon
 */
export function VaultIcon({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <circle cx="12" cy="12" r="2" fill={color} stroke="none" />
    </svg>
  );
}
