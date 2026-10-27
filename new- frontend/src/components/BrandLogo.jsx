import React, { useMemo, useState } from 'react';

export default function BrandLogo({ alt = 'CRISMATECH', className = 'h-8 w-auto object-contain' }) {
  const base = import.meta.env.BASE_URL || '/portal/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;

  const candidates = useMemo(
    () => [
      `${cleanBase}cta_logo_clean.png`,
      `${cleanBase}assets/crismatech_logo.png`,
      `${cleanBase}cta_logo.png`,
      `${cleanBase}crismatech_header.png`,
      '/assets/crismatech_logo.png',
    ],
    [cleanBase]
  );

  const [index, setIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-serif font-extrabold text-xl text-primary tracking-tight">CRISMATECH</span>
      </div>
    );
  }

  return (
    <img
      src={candidates[index]}
      alt={alt}
      className={className}
      onError={() => {
        if (index < candidates.length - 1) {
          setIndex(index + 1);
        } else {
          setHasError(true);
        }
      }}
    />
  );
}
