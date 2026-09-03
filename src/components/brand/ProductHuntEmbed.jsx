'use client';

import React, { useState } from 'react';
import { ExternalLink, ArrowRight } from 'lucide-react';

/**
 * Reusable Product Hunt Embed Component for FocusGram
 * Supports 3 responsive, theme-agnostic variants:
 * - 'card' (default): Full embed card matching official Product Hunt widget
 * - 'badge': Compact pill button for navbars, headers, and floating announcements
 * - 'compact': Horizontal card for sidebars and footers
 */
export default function ProductHuntEmbed({
  variant = 'card',
  className = '',
  style = {},
  showDescription = true,
}) {
  const [imgSrc, setImgSrc] = useState(
    'https://ph-files.imgix.net/3307042a-b0c4-44be-91f8-cf01aadbdd05.webp?auto=compress,format&codec=mozjpeg&cs=strip&fit=crop&h=80&w=80'
  );

  const productUrl = 'https://www.producthunt.com/products/focusgram-2?embed=true&utm_source=embed&utm_medium=post_embed';

  // Badge Variant (Pill badge)
  if (variant === 'badge') {
    return (
      <a
        href={productUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF6154] hover:bg-[#E55347] text-white font-semibold text-xs shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${className}`}
        style={style}
        aria-label="Check FocusGram out on Product Hunt"
      >
        <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
        <span>Featured on <strong>Product Hunt</strong></span>
        <ArrowRight className="w-3.5 h-3.5" />
      </a>
    );
  }

  // Compact Variant (Sidebar / horizontal bar)
  if (variant === 'compact') {
    return (
      <div
        className={`w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-3.5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#FF6154]/50 dark:hover:border-[#FF6154]/50 ${className}`}
        style={style}
      >
        <div className="flex items-center gap-3">
          <img
            src={imgSrc}
            alt="FocusGram"
            width={44}
            height={44}
            onError={() => setImgSrc('/focusgram-logo.svg')}
            className="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-slate-200/60 dark:border-slate-800"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">FocusGram</h4>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#FF6154]/10 text-[#FF6154] uppercase tracking-wider">PH</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              A social feed built for focused content discovery
            </p>
          </div>
          <a
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-2 rounded-lg bg-[#FF6154] hover:bg-[#E55347] text-white transition-colors duration-150 flex-shrink-0"
            title="Check it out on Product Hunt"
            aria-label="Check FocusGram out on Product Hunt"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  // Card Variant (Full widget conforming to Rule 14 fluid layout & Rule 15 theme tokens)
  return (
    <div
      className={`w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all duration-200 ring-1 ring-slate-900/5 dark:ring-white/5 ${className}`}
      style={style}
    >
      <div className="flex items-center gap-3.5 mb-3.5">
        <img
          src={imgSrc}
          alt="FocusGram"
          width={64}
          height={64}
          onError={() => setImgSrc('/focusgram-logo.svg')}
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow-sm border border-slate-200/80 dark:border-slate-800"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
            FocusGram
          </h3>
          {showDescription && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
              A social feed built for focused content discovery
            </p>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          Trending on Product Hunt
        </span>
        <a
          href={productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF6154] hover:bg-[#E55347] text-white text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Check it out on Product Hunt</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
