'use client';
/**
 * ResourceRightPanel — Curator + Primary Use Case + Pro Features
 * Reference: Images 14–16 from desktop-layout-guide
 */
const panelCard = {
  background: 'var(--surface)',
  borderRadius: 14,
  border: '1px solid var(--border)',
  padding: '20px',
  marginBottom: 16,
};

export default function ResourceRightPanel({ article }) {
  const meta = article.meta || {};
  const curator = meta.curator || {};
  const useCases = meta.use_cases || [];

  return (
    <div>
      {/* Curator Card */}
      <div style={panelCard}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          {curator.avatar_url ? (
            <img src={curator.avatar_url} alt={curator.name} loading="lazy"
              style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-purple, #6e00ff), #9b5de5)',
              flexShrink: 0,
            }} />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
              {curator.name || article.creator_username || 'Curator'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--dim)' }}>
              {curator.role || 'Resource Curator'}
            </div>
          </div>
        </div>

        {/* Curator stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
          {[
            { label: 'Followers', value: curator.followers || '—' },
            { label: 'Resources', value: curator.resources || '—' },
            { label: 'Rating', value: curator.rating || '—' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>
                {s.value}
              </div>
              <div style={{ fontSize: 9, color: 'var(--dim)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <button style={{
          width: '100%', background: 'var(--accent-purple, #6e00ff)',
          border: 'none', borderRadius: 10, padding: '11px',
          color: '#fff', fontWeight: 700, fontSize: 13,
          cursor: 'pointer', fontFamily: 'var(--font-body)',
          transition: 'all 0.18s ease',
        }}>
          Follow Curator
        </button>
      </div>

      {/* Primary Use Case */}
      {useCases.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(110,0,255,0.14), rgba(155,93,229,0.07))',
          border: '1.5px solid rgba(110,0,255,0.25)',
          borderRadius: 14, padding: '20px', marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Primary Use Case
          </div>
          {useCases.map((uc, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
              <span style={{ color: 'var(--green)', fontSize: 12 }}>✓</span>
              <span style={{ fontSize: 13, color: 'var(--text)' }}>{uc}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pro Features */}
      <div style={{
        background: 'var(--surface)', borderRadius: 14,
        border: '1px solid var(--border)', padding: '20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 18, marginBottom: 8 }}>⚡</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>
          Pro Features
        </div>
        <div style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 14, lineHeight: 1.5 }}>
          Unlock advanced filtering, bulk downloads, and priority support.
        </div>
        <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700, cursor: 'pointer' }}>
          Learn More →
        </span>
      </div>
    </div>
  );
}
