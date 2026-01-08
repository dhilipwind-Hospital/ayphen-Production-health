import React from 'react';

const Logo: React.FC<{ height?: number }> = ({ height = 28 }) => {
  const h = height;
  const w = Math.round((h / 28) * 180);
  return (
    <div style={{ display: 'flex', alignItems: 'center' }} aria-label="Ayphen Hospitals">
      <svg width={w} height={h} viewBox="0 0 180 28" role="img" aria-hidden focusable="false">
        <defs>
          <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#13c2c2" />
            <stop offset="100%" stopColor="#52c41a" />
          </linearGradient>
        </defs>
        <rect x="0" y="6" width="28" height="16" rx="4" fill="url(#lg)" />
        <rect x="12" y="2" width="4" height="24" rx="2" fill="#fff" opacity="0.95" />
        <rect x="2" y="12" width="24" height="4" rx="2" fill="#fff" opacity="0.95" />
        <text x="38" y="20" fill="#0f172a" fontFamily="Inter, 'Open Sans', Roboto, sans-serif" fontSize="16" fontWeight="700">
          Ayphen Hospitals
        </text>
      </svg>
    </div>
  );
};

export default Logo;
