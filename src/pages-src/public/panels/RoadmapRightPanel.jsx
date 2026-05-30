'use client';
/**
 * RoadmapRightPanel — Current Status + Path Creator + Suggestions + Pro
 * Reference: Images 4–6 from desktop-layout-guide
 */
const panelCard = {
  background: 'var(--surface)',
  borderRadius: 14,
  border: '1px solid var(--border)',
  padding: '20px',
  marginBottom: 16,
};

export default function RoadmapRightPanel({ article }) {
  const meta = article.meta || {};
  const creator = meta.creator || {};
  const suggestions = meta.related_paths || [];

  return (
    <div>
      {/* Current Status */}
      <div style={panelCard}>
        <div style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          Current Status
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, marginBottom: 14, color: 'var(--text)' }}>
          {meta.active_module || 'Getting Started'}
        </div>

        {/* Progress bar */}
        {meta.progress != null && (
          <div style={{ marginBottom: 14 }}>
            <div style={{
              height: 6, borderRadius: 3,
              background: 'var(--s3)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'linear-gradient(90deg, var(--accent-purple, #6e00ff), #9b5de5)',
                width: `${meta.progress}%`,
                animation: 'progressGrow 0.8s ease-out forwards',
              }} />
            </div>
            <style>{`@keyframes progressGrow { from { width: 0; } }`}</style>
            <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 4, textAlign: 'right' }}>
              {meta.progress}% complete
            </div>
          </div>
        )}

        <button style={{
          width: '100%', background: 'var(--accent-purple, #6e00ff)',
          border: 'none', borderRadius: 10, padding: '12px',
          color: '#fff', fontWeight: 700, fontSize: 13,
          cursor: 'pointer', marginBottom: 8,
          fontFamily: 'var(--font-body)', transition: 'all 0.18s ease',
        }}>
          Continue Learning
        </button>
        <button style={{
          width: '100%', background: 'transparent',
          border: '1.5px solid var(--border)', borderRadius: 10,
          padding: '10px', color: 'var(--text)', fontWeight: 600,
          fontSize: 12, cursor: 'pointer',
          fontFamily: 'var(--font-body)', transition: 'all 0.18s ease',
        }}>
          View Course Material
        </button>
      </div>

      {/* Path Creator */}
      <div style={panelCard}>
        <div style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Path Creator
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          {creator.avatar_url ? (
            <img src={creator.avatar_url} alt={creator.name} loading="lazy"
              style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-purple, #6e00ff), #9b5de5)',
              flexShrink: 0,
            }} />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
              {creator.name || article.creator_username || 'Mentor'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--dim)' }}>{creator.role || 'Lead Instructor'}</div>
          </div>
        </div>
        <button style={{
          width: '100%', background: 'transparent',
          border: '1.5px solid var(--border)', borderRadius: 9,
          padding: '10px', color: 'var(--text)', fontWeight: 600,
          fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)',
        }}>
          Follow Mentor
        </button>
      </div>

      {/* You Might Also Like */}
      {suggestions.length > 0 && (
        <div style={panelCard}>
          <div style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            You Might Also Like
          </div>
          {suggestions.slice(0, 2).map((path, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, alignItems: 'center',
              padding: '10px 0',
              borderBottom: i < 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontSize: 18 }}>{path.icon || '📘'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{path.name}</div>
                <div style={{ fontSize: 11, color: 'var(--dim)' }}>
                  {path.duration || '—'} · {path.level || '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pro Upgrade */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(110,0,255,0.12), rgba(155,93,229,0.06))',
        border: '1.5px solid rgba(110,0,255,0.25)',
        borderRadius: 14, padding: '20px', textAlign: 'center',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>
          Unlock All Paths
        </div>
        <div style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 14 }}>
          Get unlimited access to all learning paths and premium content.
        </div>
        <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700, cursor: 'pointer' }}>
          Upgrade to Pro →
        </span>
      </div>
    </div>
  );
}
