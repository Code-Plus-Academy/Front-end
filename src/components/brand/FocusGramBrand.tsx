import React from 'react';

export interface FocusGramBrandProps {
  className?: string;
  size?: number; // base height in px
  iconSize?: number;
  showIcon?: boolean;
  showWordmark?: boolean;
  showSubtitle?: boolean;
  subtitleText?: string;
  variant?: 'auto' | 'dark' | 'light';
  style?: React.CSSProperties;
}

export const FocusGramIcon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({
  size = 32,
  className = '',
  style = {},
}) => {
  return (
    <img
      src="/cpa-icon.svg"
      alt="FocusGram Icon"
      width={size}
      height={size}
      className={`flex-shrink-0 object-contain ${className}`}
      style={{ width: size, height: size, ...style }}
      loading="eager"
    />
  );
};

export const FocusGramWordmark: React.FC<{ height?: number; className?: string; style?: React.CSSProperties }> = ({
  height = 28,
  className = '',
  style = {},
}) => {
  return (
    <img
      src="/focusgram-logo.svg"
      alt="FocusGram"
      height={height}
      className={`object-contain ${className}`}
      style={{ height, width: 'auto', minWidth: 0, ...style }}
      loading="eager"
    />
  );
};

export const FocusGramBrand: React.FC<FocusGramBrandProps> = ({
  className = '',
  size = 32,
  iconSize,
  showIcon = true,
  showWordmark = true,
  showSubtitle = true,
  subtitleText = 'by Code Plus Academy',
  variant = 'auto',
  style = {},
}) => {
  const actualIconSize = iconSize || Math.round(size * 1.05);
  const wordmarkHeight = Math.round(size * 0.82);

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      style={{ textDecoration: 'none', ...style }}
      aria-label="FocusGram by Code Plus Academy"
    >
      {showIcon && (
        <FocusGramIcon size={actualIconSize} />
      )}

      {(showWordmark || showSubtitle) && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
          {showWordmark && (
            <FocusGramWordmark height={wordmarkHeight} />
          )}
          {showSubtitle && (
            <span
              className="focusgram-brand-subtitle"
              style={{
                fontSize: Math.max(9, Math.round(size * 0.28)),
                fontWeight: 600,
                letterSpacing: '0.04em',
                lineHeight: 1.1,
                marginTop: 2,
                color: 'var(--text-muted, #94a3b8)',
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <span style={{ opacity: 0.85 }}>by</span>
              <span style={{ fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Code Plus Academy</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FocusGramBrand;
