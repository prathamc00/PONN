import React, { useMemo, useState } from 'react';

interface BrandLogoProps {
  alt?: string;
  className?: string;
}

export default function BrandLogo({ alt = 'Crismatech', className = '' }: BrandLogoProps) {
  const base = import.meta.env.BASE_URL;
  const candidates = useMemo(
    () => [
      `${base}cta_logo_clean.png`,
      `${base}cta_logo.png`,
      `${base}crismatech_header.png`,
    ],
    [base]
  );
  const [index, setIndex] = useState(0);

  return (
    <img
      src={candidates[index]}
      alt={alt}
      className={className}
      onError={() => setIndex((prev) => (prev < candidates.length - 1 ? prev + 1 : prev))}
    />
  );
}
