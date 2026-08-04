'use client';

import React from 'react';
const darkLogoUrl = '/cpa-logo-dark.png';
const lightLogoUrl = '/cpa-logo-light.png';

interface CpaLogoProps {
  className?: string;
  size?: number;
  showBackground?: boolean;
  variant?: 'auto' | 'dark' | 'light';
}

export const CpaLogo: React.FC<CpaLogoProps> = ({
  className = '',
  size = 40,
  variant = 'auto',
}) => {
  const darkSrc = typeof darkLogoUrl === 'string' ? darkLogoUrl : (darkLogoUrl as any)?.src || darkLogoUrl;
  const lightSrc = typeof lightLogoUrl === 'string' ? lightLogoUrl : (lightLogoUrl as any)?.src || lightLogoUrl;

  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      {/* Dark mode image */}
      <img
        src={darkSrc}
        alt="Code Plus Academy Logo"
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className={
          variant === 'dark'
            ? 'block w-full h-full object-contain'
            : variant === 'light'
            ? 'hidden'
            : 'hidden dark:block w-full h-full object-contain'
        }
      />
      {/* Light mode image */}
      <img
        src={lightSrc}
        alt="Code Plus Academy Logo"
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className={
          variant === 'light'
            ? 'block w-full h-full object-contain'
            : variant === 'dark'
            ? 'hidden'
            : 'block dark:hidden w-full h-full object-contain'
        }
      />
    </div>
  );
};

