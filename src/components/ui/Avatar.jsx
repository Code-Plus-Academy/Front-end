'use client';
export default function Avatar({ src, name, size = 36, hasStory = false, style = {} }) {
  const fallback = `https://api.dicebear.com/7.x/bottts/svg?seed=${name || 'user'}`;
  const img = src || fallback;

  if (hasStory) {
    return (
      <div style={{
        width: size + 6, height: size + 6,
        borderRadius: '50%',
        background: 'conic-gradient(var(--green) 0deg 300deg, var(--border) 300deg 360deg)',
        padding: 2,
        flexShrink: 0, ...style,
      }}>
        <img src={img} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bg)', display: 'block' }} />
      </div>
    );
  }

  return (
    <img src={img} alt={name} className="avatar" style={{ width: size, height: size, ...style }} />
  );
}
