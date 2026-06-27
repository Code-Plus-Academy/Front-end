/**
 * RepoRightPanel — GitHub stats + tech stack + author
 * Reference: Images 7–9 from desktop-layout-guide
 */
import { useState } from 'react';

const panelCard = {
  background: 'var(--surface)',
  borderRadius: 14,
  border: '1px solid var(--border)',
  padding: '20px',
  marginBottom: 16,
};

const tagPill = {
  display: 'inline-block',
  background: 'rgba(208,188,255,0.1)',
  color: 'var(--green)',
  fontSize: 11,
  fontWeight: 600,
  padding: '4px 10px',
  borderRadius: 6,
  border: '1px solid rgba(208,188,255,0.15)',
  marginRight: 6,
  marginBottom: 6,
};

export default function RepoRightPanel({ article }) {
  const [copied, setCopied] = useState(false);
  const meta = article.meta || {};
  const stars = meta.stars || '—';
  const forks = meta.forks || '—';
  const techStack = meta.tech_stack || [];
  const repoUrl = meta.repo_url || '#';
  const installCmd = meta.install_command || `npm install ${article.slug || 'package'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Stats Row */}
      <div style={panelCard}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{
            background: 'var(--s2)', borderRadius: 10, padding: '14px',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
              {stars}
            </div>
            <div style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>
              ★ Stars
            </div>
          </div>
          <div style={{
            background: 'var(--s2)', borderRadius: 10, padding: '14px',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
              {forks}
            </div>
            <div style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>
              ⑂ Forks
            </div>
          </div>
        </div>

        {/* View on GitHub */}
        <a href={repoUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%', background: 'var(--accent-purple, #6e00ff)',
            border: 'none', borderRadius: 10, padding: '12px',
            color: '#fff', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', marginBottom: 10,
            fontFamily: 'var(--font-body)', transition: 'all 0.18s ease',
          }}>
            View on GitHub ↗
          </button>
        </a>

        {/* Install Command */}
        <div style={{
          background: 'var(--s2)', borderRadius: 8, padding: '10px 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: '1px solid var(--border)',
        }}>
          <code style={{ fontSize: 11, color: 'var(--sub)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {installCmd}
          </code>
          <button
            onClick={handleCopy}
            aria-label="Copy install command"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 14, color: copied ? 'var(--green)' : 'var(--dim)',
              flexShrink: 0, marginLeft: 8,
              transition: 'opacity 0.15s',
            }}
          >
            {copied ? '✓' : '📋'}
          </button>
        </div>
      </div>

      {/* Tech Stack */}
      {techStack.length > 0 && (
        <div style={panelCard}>
          <div style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Tech Stack
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {techStack.map((t, i) => <span key={i} style={tagPill}>{t}</span>)}
          </div>
          {meta.last_updated && (
            <div style={{ marginTop: 14, fontSize: 12, color: 'var(--dim)' }}>
              Last Updated: <span style={{ color: 'var(--green)', fontWeight: 600 }}>{meta.last_updated}</span>
              {meta.version && <> · v{meta.version}</>}
            </div>
          )}
        </div>
      )}

      {/* Creator */}
      {meta.creator && (
        <div style={panelCard}>
          <div style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Creator
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-purple, #6e00ff), #9b5de5)',
              flexShrink: 0,
            }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{meta.creator.name || article.creator_username}</div>
              <div style={{ fontSize: 12, color: 'var(--dim)' }}>{meta.creator.role || 'Developer'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
