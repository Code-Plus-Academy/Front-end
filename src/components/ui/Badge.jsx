'use client';
const variants = {
  default: { bg: 'var(--s3)', color: 'var(--sub)', border: 'var(--border)' },
  green: { bg: 'var(--green-dim)', color: 'var(--green)', border: '#00ff8840' },
  blue: { bg: 'var(--blue-dim)', color: 'var(--blue)', border: '#4488ff40' },
  red: { bg: 'var(--red-dim)', color: 'var(--red)', border: '#ff446640' },
  yellow: { bg: '#ffd70015', color: 'var(--yellow)', border: '#ffd70040' },
};

const difficultyMap = {
  beginner: 'green',
  intermediate: 'blue',
  advanced: 'red',
};

const typeMap = {
  tutorial: 'blue',
  project: 'green',
  article: 'yellow',
};

export default function Badge({ label, variant = 'default', small = false }) {
  const v = variants[variant] || variants.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: small ? 10 : 11,
      fontWeight: 500,
      padding: small ? '2px 6px' : '3px 8px',
      borderRadius: 'var(--r-full)',
      background: v.bg, color: v.color, border: `1px solid ${v.border}`,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

export function DifficultyBadge({ difficulty }) {
  return <Badge label={difficulty} variant={difficultyMap[difficulty?.toLowerCase()] || 'default'} />;
}

export function TypeBadge({ type }) {
  return <Badge label={type} variant={typeMap[type?.toLowerCase()] || 'default'} />;
}
