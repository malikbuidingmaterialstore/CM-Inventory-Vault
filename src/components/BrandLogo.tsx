import React, { useState } from 'react';
import logoImg from '../assets/images/cm_logo_transparent.png';
import iconImg from '../assets/images/cm_icon_transparent.png';

interface BrandLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
}) => {
  const [iconSrc, setIconSrc] = useState<string>(iconImg || '/logo-icon.png');
  const [logoSrc, setLogoSrc] = useState<string>(logoImg || '/logo.png');

  const sizeMap = {
    xs: { width: 'max-w-[130px]', height: 'max-h-12', iconSize: 'w-8 h-8' },
    sm: { width: 'max-w-[190px]', height: 'max-h-16', iconSize: 'w-10 h-10' },
    md: { width: 'max-w-[280px]', height: 'max-h-24', iconSize: 'w-14 h-14' },
    lg: { width: 'max-w-[360px]', height: 'max-h-36', iconSize: 'w-20 h-20' },
    xl: { width: 'max-w-[460px]', height: 'max-h-48', iconSize: 'w-28 h-28' },
  }[size];

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center select-none bg-transparent ${className}`}>
        <img
          src={iconSrc}
          onError={() => {
            if (iconSrc !== '/logo-icon.png') {
              setIconSrc('/logo-icon.png');
            }
          }}
          alt="CM INVENTORY VAULT"
          referrerPolicy="no-referrer"
          className={`${sizeMap.iconSize} object-contain bg-transparent drop-shadow-[0_2px_8px_rgba(212,175,55,0.4)]`}
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center select-none bg-transparent ${className}`}>
      {/* 
        Official CM INVENTORY VAULT Brand Logo with Pure Transparent Background
        Features the 3D Gold 'C' and 3D Black 'M' Emblem, House Roof, Clipboard, and 'INVENTORY VAULT'
      */}
      <div className={`relative ${sizeMap.width} w-full flex items-center justify-center bg-transparent`}>
        <img
          src={logoSrc}
          onError={() => {
            if (logoSrc !== '/logo.png') {
              setLogoSrc('/logo.png');
            }
          }}
          alt="CM INVENTORY VAULT"
          referrerPolicy="no-referrer"
          className="w-full h-auto object-contain bg-transparent filter drop-shadow-[0_4px_16px_rgba(212,175,55,0.3)]"
        />
      </div>
    </div>
  );
};
