import React from 'react';

export interface FocusGramBrandProps {
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

export const FocusGramIcon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({
  size = 38,
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
  height = 24,
  className = '',
  style = {},
}) => {
  return (
    <img
      src="/focusgram-logo.svg"
      alt="FocusGram"
      height={height}
      className={`object-contain flex-shrink-0 ${className}`}
      style={{ height, width: 'auto', minWidth: 0, display: 'block', ...style }}
      loading="eager"
    />
  );
};

export const FocusGramBrand: React.FC<FocusGramBrandProps> = ({
  className = '',
  size = 38,
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
  const wordmarkHeight = customWordmarkHeight || Math.round(size * 0.64);
  const subtitleFontSize = Math.max(9.5, Math.round(size * 0.27));

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${className}`}
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
            <div
              className="focusgram-brand-subtitle"
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

export default FocusGramBrand;
