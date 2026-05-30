'use client';
/**
 * ToolkitRightPanel — Compare Tools + Saved Items + Top Curators
 * Reference: Images 1–3, 20 from desktop-layout-guide
 */
const panelCard = {
  background: 'var(--surface)',
  borderRadius: 14,
  border: '1px solid var(--border)',
  padding: '20px',
  marginBottom: 16,
};

export default function ToolkitRightPanel({ article }) {
  const meta = article.meta || {};
  const compareTools = meta.compare_tools || [];
  const savedItems = meta.saved_items || [];
  const curator = meta.curator || {};

  return (
    <div>
      {/* Compare Tools */}
      <div style={panelCard}>
        <div style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Compare Tools
        </div>
        {compareTools.length > 0 ? (
          <>
            {compareTools.slice(0, 3).map((tool, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', background: 'var(--s2)', borderRadius: 8,
                marginBottom: 6,
              }}>
                <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{tool}</span>
                <span style={{ fontSize: 14, color: 'var(--dim)', cursor: 'pointer' }}>×</span>
              </div>
            ))}
            <button style={{
              width: '100%', background: 'var(--accent-purple, #6e00ff)',
              border: 'none', borderRadius: 9, padding: '10px',
              color: '#fff', fontWeight: 700, fontSize: 12,
              cursor: 'pointer', marginTop: 8,
              fontFamily: 'var(--font-body)',
            }}>
              Compare Now
            </button>
          </>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--dim)', textAlign: 'center', padding: '16px 0' }}>
            Select tools from the list to compare
          </div>
        )}
      </div>

      {/* Saved Items */}
      <div style={panelCard}>
        <div style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          Recently Saved
        </div>
        {savedItems.length > 0 ? savedItems.slice(0, 3).map((item, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, alignItems: 'center',
            padding: '8px 0',
            borderBottom: i < Math.min(savedItems.length, 3) - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <span style={{ fontSize: 16 }}>{item.icon || '📦'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{item.name}</div>
              <div style={{ fontSize: 11, color: 'var(--dim)' }}>{item.time || 'Just now'}</div>
            </div>
          </div>
        )) : (
          <div style={{ fontSize: 12, color: 'var(--dim)', padding: '8px 0' }}>
            No saved items yet
          </div>
        )}
        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, cursor: 'pointer' }}>
            View All Collections →
          </span>
        </div>
      </div>

      {/* Top Curator */}
      {curator.name && (
        <div style={panelCard}>
          <div style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Curated By
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-purple, #6e00ff), #9b5de5)',
              flexShrink: 0,
            }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{curator.name}</div>
              <div style={{ fontSize: 12, color: 'var(--dim)' }}>{curator.role || 'Community Curator'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
