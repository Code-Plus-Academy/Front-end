import React from 'react';

const darkLogoUrl = '/cpa-icon-dark.png';
const lightLogoUrl = '/cpa-icon-light.png';

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
  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      {/* Dark mode image */}
      <img
        src={darkLogoUrl}
        alt="Code Plus Academy Logo"
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className={
          variant === 'dark'
            ? 'block w-full h-full object-contain'
            : variant === 'light'
            ? 'hidden'
            : 'landing-logo-dark w-full h-full object-contain'
        }
      />
      {/* Light mode image */}
      <img
        src={lightLogoUrl}
        alt="Code Plus Academy Logo"
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className={
          variant === 'light'
            ? 'block w-full h-full object-contain'
            : variant === 'dark'
            ? 'hidden'
            : 'landing-logo-light w-full h-full object-contain'
        }
      />
    </div>
  );
};

