import React from 'react';

const svgLogoUrl = '/cpa-icon.svg';

interface CpaLogoProps {
  className?: string;
  size?: number;
  showBackground?: boolean;
  variant?: 'auto' | 'dark' | 'light';
}

export const CpaLogo: React.FC<CpaLogoProps> = ({
  className = '',
  size = 40,
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <img
        src={svgLogoUrl}
        alt="FocusGram by Code Plus Academy"
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain"
        loading="eager"
      />
    </div>
  );
};

export default CpaLogo;

