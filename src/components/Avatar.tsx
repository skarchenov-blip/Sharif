import React, { useState } from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
};

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md' }) => {
  const [failed, setFailed] = useState(false);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  if (!src || failed) {
    return (
      <div
        className={`${SIZE_MAP[size]} rounded-lg bg-[var(--accent-soft)] text-[var(--accent-text)] font-semibold flex items-center justify-center shrink-0 border border-[var(--border-hairline)] select-none`}
      >
        {initials || 'БМ'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${SIZE_MAP[size]} rounded-lg object-cover shrink-0 border border-[var(--border-hairline)] bg-[var(--bg-subtle)]`}
    />
  );
};
