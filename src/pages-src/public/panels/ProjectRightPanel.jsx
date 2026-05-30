'use client';
/**
 * ProjectRightPanel — Social proof + Built By author card
 * Reference: Images 10–12 from desktop-layout-guide
 */
const panelCard = {
  background: 'var(--surface)',
  borderRadius: 14,
  border: '1px solid var(--border)',
  padding: '20px',
  marginBottom: 16,
};

export default function ProjectRightPanel({ article }) {
  const meta = article.meta || {};
  const stats = [
    { icon: '❤️', label: 'Community Likes', value: meta.likes || '—' },
    { icon: '👁', label: 'Views this month', value: meta.views || '—' },
    { icon: '⑂', label: 'Active Forks', value: meta.forks || '—' },
  ];
  const creator = meta.creator || {};
  const categories = meta.categories || meta.tags || [];

  return (
    <div>
      {/* Social Proof Stats */}
      <div style={panelCard}>
        {stats.map((s, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0',
            borderBottom: i < stats.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <span style={{ fontSize: 13, color: 'var(--sub)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>{s.icon}</span>{s.label}
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Built By */}
      <div style={panelCard}>
        <div style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Built By
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          {creator.avatar_url ? (
            <img src={creator.avatar_url} alt={creator.name} loading="lazy"
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-purple, #6e00ff), #9b5de5)',
              flexShrink: 0,
            }} />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
              {creator.name || article.creator_username || 'Unknown'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--dim)' }}>{creator.role || 'Developer'}</div>
          </div>
        </div>
        <button style={{
          width: '100%', background: 'transparent',
          border: '1.5px solid var(--border)', borderRadius: 9,
          padding: '10px', color: 'var(--text)', fontWeight: 600,
          fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)',
          transition: 'all 0.18s ease',
        }}>
          Follow Developer
        </button>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div style={panelCard}>
          <div style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Category
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {categories.map((c, i) => (
              <span key={i} style={{
                display: 'inline-block', background: 'rgba(208,188,255,0.1)',
                color: 'var(--green)', fontSize: 11, fontWeight: 600,
                padding: '4px 10px', borderRadius: 6,
                border: '1px solid rgba(208,188,255,0.15)',
              }}>{c}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
