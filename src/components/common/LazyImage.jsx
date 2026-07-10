import { useState, useEffect } from 'react';

/**
 * A graceful lazy-loading image component that renders a skeleton until loaded.
 * 
 * Features:
 * - Native lazy loading
 * - Solid color skeleton placeholder before load
 * - Smooth fade-in crossfade on load
 * - Graceful fallback with icon/initials on error
 * - Responsive srcset generation for optimal downloading
 */
export default function LazyImage({ 
  src, 
  alt = '', 
  style = {}, 
  skeletonColor = 'rgba(128,128,128,0.15)',
  fallbackIcon = '🖼️', 
  fallbackBackground = 'rgba(128,128,128,0.08)',
  responsive = false,
  sizes = '(max-width: 600px) 300px, 600px',
  className
}) {
  const [status, setStatus] = useState('loading'); // 'loading', 'loaded', 'error'
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
    if (!src) {
      setStatus('error');
    } else {
      setStatus('loading');
    }
  }, [src]);

  // Construct srcSet if requested to pull lightweight sizes dynamically
  let srcSet = undefined;
  if (responsive && currentSrc && !currentSrc.startsWith('data:')) {
    const sep = currentSrc.includes('?') ? '&' : '?';
    srcSet = `
      ${currentSrc}${sep}w=150 150w,
      ${currentSrc}${sep}w=300 300w,
      ${currentSrc}${sep}w=600 600w,
      ${currentSrc}${sep}w=1200 1200w
    `;
  }

  const handleLoad = () => setStatus('loaded');
  const handleError = () => setStatus('error');

  const wrapperStyle = {
    position: 'relative',
    display: 'block',
    overflow: 'hidden',
    ...style
  };

  return (
    <div style={wrapperStyle} className={className}>
      {/* Skeleton Layer */}
      {status === 'loading' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: skeletonColor,
          zIndex: 1,
        }} />
      )}

      {/* Error / Fallback Layer */}
      {status === 'error' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: fallbackBackground,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: typeof style.width === 'number' ? Math.max(12, style.width * 0.25) : 24,
          zIndex: 1,
        }}>
          {fallbackIcon}
        </div>
      )}

      {/* Actual Image */}
      {(status === 'loading' || status === 'loaded') && (
        <img
          src={currentSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: style.objectFit || 'cover',
            opacity: status === 'loaded' ? 1 : 0,
            transition: 'opacity 0.25s ease',
            position: 'absolute',
            inset: 0,
            // Pass through specific transform/transitions if defined by parent
            transform: style.transform,
          }}
        />
      )}
    </div>
  );
}
