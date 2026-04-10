import React from 'react';
import { motion } from 'framer-motion';

export const LoadingSpinner = ({ size = 'md', color = 'indigo' }: { size?: 'sm' | 'md' | 'lg', color?: string }) => {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const colors: Record<string, string> = {
    indigo: 'border-indigo-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    slate: 'border-slate-400 border-t-transparent',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`${sizes[size]} ${colors[color] || colors.indigo} rounded-full`}
    />
  );
};

export const LoadingOverlay = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center transition-colors"
    >
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">Loading...</p>
      </div>
    </motion.div>
  );
};

export const Skeleton = ({ className, key }: { className?: string, key?: React.Key }) => {
  return (
    <div key={key} className={`bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg ${className}`} />
  );
};
