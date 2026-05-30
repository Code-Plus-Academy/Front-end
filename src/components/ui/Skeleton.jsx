'use client';
export function Skeleton({ width = '100%', height = 20, radius = 8, style = {} }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: radius, flexShrink: 0, ...style }} />
  );
}

export function PostCardSkeleton() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
        <Skeleton width={36} height={36} radius={50} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton height={13} width="40%" />
          <Skeleton height={11} width="25%" />
        </div>
      </div>
      <Skeleton height={18} width="85%" style={{ marginBottom: 8 }} />
      <Skeleton height={14} width="65%" style={{ marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <Skeleton width={60} height={22} radius={20} />
        <Skeleton width={60} height={22} radius={20} />
        <Skeleton width={60} height={22} radius={20} />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div>
      <Skeleton height={160} radius={0} />
      <div style={{ padding: 20 }}>
        <Skeleton width={80} height={80} radius={50} style={{ marginTop: -40 }} />
        <Skeleton height={22} width="40%" style={{ marginTop: 12 }} />
        <Skeleton height={14} width="60%" style={{ marginTop: 8 }} />
      </div>
    </div>
  );
}
