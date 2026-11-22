import React from 'react';
import { AIRLINE_BADGE_STYLES, getAirlineLogoUrl } from './flightData';

interface AirlineLogoProps {
  name: string;
  code?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AirlineLogoProps['size']>, string> = {
  xs: 'w-7 h-5 px-1 rounded',
  sm: 'w-9 h-6 px-1 rounded-md',
  md: 'w-12 h-8 px-1.5 rounded-lg',
  lg: 'w-14 h-9 px-1.5 rounded-lg',
};

const AirlineLogo: React.FC<AirlineLogoProps> = ({
  name,
  code = '',
  size = 'md',
  className = '',
}) => {
  const logoUrl = getAirlineLogoUrl(name, code);

  if (logoUrl) {
    return (
      <span
        className={`${SIZE_CLASSES[size]} inline-flex items-center justify-center shrink-0 bg-white border border-slate-200/90 dark:border-slate-700 overflow-hidden shadow-2xs ${className}`}
        title={name}
      >
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="w-full h-full object-contain block select-none"
          loading="lazy"
        />
      </span>
    );
  }

  const style = AIRLINE_BADGE_STYLES[code] || { bg: '#008F45', accent: '#FFFFFF', short: code || name.slice(0, 2).toUpperCase() };
  return (
    <div
      aria-hidden="true"
      className={`${SIZE_CLASSES[size]} inline-flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 shadow-2xs ${className}`}
      title={name}
    >
      <svg viewBox="0 0 32 32" className="w-5 h-5">
        <circle cx="16" cy="16" r="14" fill={style.bg} />
        <path d="M8 18 L24 12 L19 20 L14 18 Z" fill={style.accent} opacity="0.92" />
        <text x="16" y="25" textAnchor="middle" fontSize="6" fontWeight="700" fill="#FFFFFF">
          {(code || name.slice(0, 2)).toUpperCase()}
        </text>
      </svg>
    </div>
  );
};

export default AirlineLogo;
