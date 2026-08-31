import React from 'react';

export interface NotesArenaBrandProps {
  className?: string;
  size?: number; // base scale in px
  iconSize?: number;
  wordmarkHeight?: number;
  showIcon?: boolean;
  showWordmark?: boolean;
  showSubtitle?: boolean;
  subtitleText?: string;
  variant?: 'auto' | 'dark' | 'light';
  style?: React.CSSProperties;
}

export const NotesArenaIcon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({
  size = 38,
  className = '',
  style = {},
}) => {
  return (
    <img
      src="/notes-arena-icon.svg"
      alt="Notes Arena Icon"
      width={size}
      height={size}
      className={`flex-shrink-0 object-contain ${className}`}
      style={{ width: size, height: size, ...style }}
      loading="eager"
    />
  );
};

export const NotesArenaWordmark: React.FC<{ height?: number; className?: string; style?: React.CSSProperties }> = ({
  height = 32,
  className = '',
  style = {},
}) => {
  return (
    <img
      src="/notes-arena-logo.svg"
      alt="Notes Arena"
      height={height}
      className={`object-contain flex-shrink-0 ${className}`}
      style={{ height, width: 'auto', minWidth: 0, display: 'block', ...style }}
      loading="eager"
    />
  );
};

export const NotesArenaBrand: React.FC<NotesArenaBrandProps> = ({
  className = '',
  size = 42,
  iconSize,
  wordmarkHeight: customWordmarkHeight,
  showIcon = true,
  showWordmark = true,
  showSubtitle = true,
  subtitleText = 'by Code Plus Academy',
  variant = 'auto',
  style = {},
}) => {
  const actualIconSize = iconSize || Math.round(size * 1.05);
  const wordmarkHeight = customWordmarkHeight || Math.round(size * 0.82);
  const subtitleFontSize = Math.max(9.5, Math.round(size * 0.26));

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${className}`}
      style={{ textDecoration: 'none', ...style }}
      aria-label="Notes Arena by Code Plus Academy"
    >
      {showIcon && (
        <NotesArenaIcon size={actualIconSize} />
      )}

      {(showWordmark || showSubtitle) && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
          {showWordmark && (
            <NotesArenaWordmark height={wordmarkHeight} />
          )}
          {showSubtitle && (
            <div
              className="notes-arena-brand-subtitle"
              style={{
                fontSize: subtitleFontSize,
                fontWeight: 600,
                letterSpacing: '0.04em',
                lineHeight: 1.15,
                marginTop: 1,
                color: 'var(--sub, #94a3b8)',
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3.5,
              }}
            >
              <span style={{ opacity: 0.75, fontWeight: 500, textTransform: 'lowercase' }}>by</span>
              <span style={{ fontWeight: 700, color: 'var(--text-secondary, var(--text, #cbd5e1))', letterSpacing: '0.02em' }}>
                Code Plus Academy
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotesArenaBrand;
