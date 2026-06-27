/**
 * DocumentRightPanel — Save/Share + Document Details + Author
 * Reference: Image 13 from desktop-layout-guide
 */
const panelCard = {
  background: 'var(--surface)',
  borderRadius: 14,
  border: '1px solid var(--border)',
  padding: '20px',
  marginBottom: 16,
};

export default function DocumentRightPanel({ article }) {
  const meta = article.meta || {};
  const creator = meta.creator || {};

  return (
    <div>
      {/* Save + Share row */}
      <div style={{ ...panelCard, display: 'flex', gap: 10 }}>
        <button style={{
          flex: 1, background: 'var(--s2)', border: '1px solid var(--border)',
          borderRadius: 9, padding: '10px', color: 'var(--text)',
          fontWeight: 600, fontSize: 12, cursor: 'pointer',
          fontFamily: 'var(--font-body)', transition: 'all 0.18s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          🔖 Save
        </button>
        <button style={{
          flex: 1, background: 'var(--s2)', border: '1px solid var(--border)',
          borderRadius: 9, padding: '10px', color: 'var(--text)',
          fontWeight: 600, fontSize: 12, cursor: 'pointer',
          fontFamily: 'var(--font-body)', transition: 'all 0.18s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          🔗 Share
        </button>
      </div>

      {/* Document Details */}
      <div style={panelCard}>
        <div style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
          Document Details
        </div>
        {[
          { label: 'Pages', value: meta.pages || '—' },
          { label: 'File Size', value: meta.file_size || '—' },
          { label: 'Format', value: meta.format || 'PDF' },
        ].map((row, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
          }}>
            <span style={{ fontSize: 13, color: 'var(--sub)' }}>{row.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{row.value}</span>
          </div>
        ))}
        {(meta.hashtags || []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {meta.hashtags.map((h, i) => (
              <span key={i} style={{
                fontSize: 11, color: 'var(--green)', fontWeight: 600,
              }}>#{h}</span>
            ))}
          </div>
        )}
      </div>

      {/* Author Card */}
      <div style={{ ...panelCard, textAlign: 'center' }}>
        {creator.avatar_url ? (
          <img src={creator.avatar_url} alt={creator.name} loading="lazy"
            style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px', display: 'block' }} />
        ) : (
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-purple, #6e00ff), #9b5de5)',
            margin: '0 auto 12px',
          }} />
        )}
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, marginBottom: 4, color: 'var(--text)' }}>
          {creator.name || article.creator_username || 'Unknown'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 14, lineHeight: 1.5 }}>
          {creator.bio || 'Content creator on CodePlus Academy'}
        </div>
        <button style={{
          width: '100%', background: 'var(--accent-purple, #6e00ff)',
          border: 'none', borderRadius: 10, padding: '11px',
          color: '#fff', fontWeight: 700, fontSize: 13,
          cursor: 'pointer', fontFamily: 'var(--font-body)',
          transition: 'all 0.18s ease',
        }}>
          Follow
        </button>
      </div>
    </div>
  );
}
