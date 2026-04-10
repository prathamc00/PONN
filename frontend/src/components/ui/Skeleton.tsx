import React from 'react';

interface SkeletonProps {
  className?: string;
  type?: 'text' | 'card' | 'avatar' | 'title';
}

export default function Skeleton({ className = '', type = 'text' }: SkeletonProps) {
  const baseClasses = "relative overflow-hidden bg-white/5 border border-white/5 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";
  
  const typeClasses = {
    text: "h-4 rounded-md w-full",
    title: "h-8 rounded-lg w-3/4",
    avatar: "w-16 h-16 rounded-full",
    card: "h-48 rounded-[2rem]",
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${className}`} />
  );
}
