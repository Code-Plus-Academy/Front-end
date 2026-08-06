/**
 * ArticlePage.jsx — Public read-only article renderer
 *
 * Uses CSS variables (tokens.css) — same as every other CPA page.
 * light-mode switching is handled by body.light-mode class in ThemeContext.
 * NO JS token imports needed — var(--x) updates automatically.
 *
 * CSS variable reference (tokens.css):
 *   --bg          page background
 *   --surface     card background
 *   --s2          inner/nested surface
 *   --s3          deep nested surface
 *   --text        primary text
 *   --sub         secondary/muted text
 *   --dim         tertiary/disabled text
 *   --border      border colour
 *   --border-bright  stronger border
 *   --accent-purple  brand purple CTA
 *   --green       success / brand teal
 *   --font-display  Syne
 *   --font-body     Outfit
 *   --font-mono     JetBrains Mono
 */

import { Helmet } from 'react-helmet-async';
import MobileBottomNav from '../../components/layout/MobileBottomNav';
import { Tag, FileText, BarChart2, HardDrive, Clock, Star, Users, DollarSign, Layers, Zap, Globe } from 'lucide-react';

const ICON_MAP = {
  cost: Tag,
  price: DollarSign,
  fee: DollarSign,
  format: FileText,
  type: Layers,
  level: BarChart2,
  difficulty: Zap,
  access: HardDrive,
  drive: HardDrive,
  platform: Globe,
  duration: Clock,
  time: Clock,
  rating: Star,
  students: Users,
  enrolled: Users,
};

function renderStatIcon(stat) {
  if (stat.icon) {
    if (typeof stat.icon === 'function' || (typeof stat.icon === 'object' && stat.icon.$$typeof)) {
      const CustomIcon = stat.icon;
      return <CustomIcon size={16} style={{ color: 'var(--accent-purple)', marginBottom: 4 }} />;
    }
    if (typeof stat.icon === 'string') {
      const lower = stat.icon.toLowerCase();
      const MatchedIcon = ICON_MAP[lower];
      if (MatchedIcon) return <MatchedIcon size={16} style={{ color: 'var(--accent-purple)', marginBottom: 4 }} />;
      if (stat.icon.startsWith('http') || stat.icon.startsWith('/')) {
        return <img src={stat.icon} alt="" style={{ width: 16, height: 16, objectFit: 'contain', marginBottom: 4 }} />;
      }
      return <span style={{ fontSize: 14, marginBottom: 4 }}>{stat.icon}</span>;
    }
  }
  const labelLower = (stat.label || '').toLowerCase();
  for (const [key, IconComp] of Object.entries(ICON_MAP)) {
    if (labelLower.includes(key)) {
      return <IconComp size={16} style={{ color: 'var(--accent-purple)', opacity: 0.9, marginBottom: 4 }} />;
    }
  }
  return null;
}

// ── Shared style helpers ──────────────────────────────────────────────────────

const card = {
  background:   'var(--surface)',
  borderRadius: 12,
  padding:      '18px 20px',
  border:       '1px solid var(--border)',
  marginBottom: 4,
};

const tag = {
  display:       'inline-block',
  background:    'rgba(110,0,255,0.1)',
  color:         'var(--accent-purple)',
  fontSize:      10,
  fontWeight:    700,
  letterSpacing: '0.07em',
  padding:       '3px 8px',
  borderRadius:  4,
  border:        '1px solid rgba(110,0,255,0.25)',
  textTransform: 'uppercase',
};

const tagGreen = {
  ...tag,
  background: 'rgba(0,180,216,0.1)',
  color:      'var(--green)',
  border:     '1px solid rgba(0,180,216,0.25)',
};

// ── Block Components ──────────────────────────────────────────────────────────

function HeroBlock({ data }) {
  // Same working share logic as NoteActionButtons.jsx (Notes Arena) —
  // opens the native OS share sheet on mobile, falls back to clipboard copy.
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title || document.title || 'Code Plus Academy',
          text: data.subtitle || '',
          url,
        });
      } catch (e) {
        // User cancelled share dialog — no-op
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch (e) {
        // Clipboard write failed — no-op (no toast dependency in this file)
      }
    }
  };
  const isShareButton = (data.ctaSecondary || '').trim().toLowerCase() === 'share';

  return (
    <div style={{
      ...card, padding: 0, overflow: 'hidden',
      // If a background image was uploaded in Studio, show it as a banner
    }}>
      {/* Background image banner — saved as backgroundImageUrl in Studio */}
      {data.backgroundImageUrl && (
        <div style={{
          width: '100%', aspectRatio: '16/6', overflow: 'hidden',
          borderRadius: '12px 12px 0 0',
        }}>
          <img
            src={data.backgroundImageUrl}
            alt={data.title || 'Hero banner'}
            loading="eager"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {/* Content area */}
      <div style={{ padding: '28px 24px' }}>
        {/* Category + Tags row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {data.category && (
            <span style={{ ...tag, background: 'var(--accent-purple)', color: '#fff', border: 'none' }}>
              {data.category}
            </span>
          )}
          {(data.tags || []).map((t, i) => (
            <span key={i} style={i === 0 && !data.category ? tag : { ...tag, background: 'var(--s2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              {t}
            </span>
          ))}
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,38px)',
          fontWeight: 800, lineHeight: 1.1, marginBottom: 12, color: 'var(--text)',
        }}>
          {data.title}
        </h1>

        <p style={{ color: 'var(--sub)', fontSize: 15, lineHeight: 1.7, marginBottom: 20, maxWidth: 600 }}>
          {data.subtitle}
        </p>

        {/* CTA Buttons — linked via ctaPrimaryUrl / ctaLink / url saved in Studio or DB */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {data.ctaPrimary && (
            (data.ctaPrimaryUrl || data.ctaLink || data.ctaUrl || data.url || data.link)
              ? (
                <a href={data.ctaPrimaryUrl || data.ctaLink || data.ctaUrl || data.url || data.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <button style={{
                    background: 'var(--accent-purple)', color: '#fff', border: 'none',
                    borderRadius: 9, padding: '10px 22px', fontWeight: 700,
                    fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}>{data.ctaPrimary}</button>
                </a>
              ) : (
                <button style={{
                  background: 'var(--accent-purple)', color: '#fff', border: 'none',
                  borderRadius: 9, padding: '10px 22px', fontWeight: 700,
                  fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}>{data.ctaPrimary}</button>
              )
          )}
          {data.ctaSecondary && (
            isShareButton
              ? (
                <button onClick={handleShare} type="button" style={{
                  background: 'transparent', color: 'var(--text)',
                  border: '1.5px solid var(--border)', borderRadius: 9,
                  padding: '10px 22px', fontWeight: 600, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}>{data.ctaSecondary}</button>
              ) : (data.ctaSecondaryUrl || data.secondaryUrl || data.previewUrl)
              ? (
                <a href={data.ctaSecondaryUrl || data.secondaryUrl || data.previewUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <button style={{
                    background: 'transparent', color: 'var(--text)',
                    border: '1.5px solid var(--border)', borderRadius: 9,
                    padding: '10px 22px', fontWeight: 600, fontSize: 13,
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}>{data.ctaSecondary}</button>
                </a>
              ) : (
                <button style={{
                  background: 'transparent', color: 'var(--text)',
                  border: '1.5px solid var(--border)', borderRadius: 9,
                  padding: '10px 22px', fontWeight: 600, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}>{data.ctaSecondary}</button>
              )
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitleBlock({ data }) {
  return (
    <div style={{ padding: '8px 4px', marginBottom: 4 }}>
      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,3vw,28px)',
        fontWeight: 800, color: 'var(--text)', marginBottom: 4,
      }}>{data.heading}</h2>
      {data.subtitle && (
        <p style={{ color: 'var(--sub)', fontSize: 14 }}>{data.subtitle}</p>
      )}
    </div>
  );
}

function RichTextBlock({ data }) {
  return (
    <div style={{ ...card, lineHeight: 1.8, fontSize: 15, color: 'var(--sub)' }}>
      {data.content}
    </div>
  );
}

function CalloutBlock({ data }) {
  return (
    <div style={{
      ...card,
      borderLeft: '3px solid var(--accent-purple)',
      background: 'rgba(110,0,255,0.06)',
      display: 'flex', gap: 14,
    }}>
      <span style={{ fontSize: 20 }}>{data.icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent-purple)', marginBottom: 4 }}>
          {data.title}
        </div>
        <div style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.65 }}>{data.body}</div>
      </div>
    </div>
  );
}

function DividerBlock() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />;
}

function ImageBlock({ data }) {
  if (data.url) {
    return (
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <img
          src={data.url}
          alt={data.caption || 'Article image'}
          loading="lazy"
          style={{ width: '100%', display: 'block', aspectRatio: data.aspectRatio || '16/7', objectFit: 'cover' }}
        />
        {data.caption && (
          <div style={{ padding: '8px 16px', fontSize: 11, color: 'var(--sub)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {data.caption}
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
      <div style={{
        aspectRatio: data.aspectRatio || '16/7',
        background: 'var(--s2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--dim)', fontSize: 28,
      }}>🖼</div>
      {data.caption && (
        <div style={{ padding: '8px 16px', fontSize: 11, color: 'var(--sub)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {data.caption}
        </div>
      )}
    </div>
  );
}

function CodeBlock({ data }) {
  return (
    <div style={{ borderRadius: 12, background: '#0d0d14', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontSize: 11, color: '#7777aa', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
          {data.filename}
        </span>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map(c => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
          ))}
        </div>
      </div>
      <pre style={{
        padding: '14px 16px', fontSize: 12, color: '#a8a8d8',
        fontFamily: 'var(--font-mono)', overflowX: 'auto', lineHeight: 1.75,
        whiteSpace: 'pre-wrap', margin: 0,
      }}>{data.code}</pre>
    </div>
  );
}

function VideoEmbedBlock({ data }) {
  const getEmbedUrl = (url) => {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const loom = url.match(/loom\.com\/share\/([^?&\s]+)/);
    if (loom) return `https://www.loom.com/embed/${loom[1]}`;
    return url;
  };
  const embedUrl = getEmbedUrl(data.url);
  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={data.title || 'Video'}
          style={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div style={{
          aspectRatio: '16/9', background: 'var(--s2)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 10,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'var(--border)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 22, color: 'var(--text)',
          }}>▶</div>
          <div style={{ fontSize: 12, color: 'var(--sub)', fontWeight: 600 }}>
            {data.title || 'Video'}
          </div>
        </div>
      )}
    </div>
  );
}

function PDFViewerBlock({ data }) {
  return (
    <div style={{ ...card }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <span style={tag}>DOCUMENT</span>
        <span style={tagGreen}>VERIFIED</span>
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 12, color: 'var(--text)' }}>
        {data.title}
      </h3>
      <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
        {[['SIZE', data.size], ['PAGES', data.pages], ['SUBJECT', data.subject]].map(([l, v]) => v ? (
          <div key={l}>
            <div style={{ fontSize: 9, color: 'var(--dim)', fontWeight: 700, letterSpacing: '0.07em', marginBottom: 2 }}>{l}</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{v}</div>
          </div>
        ) : null)}
      </div>
      <div style={{
        height: 80, background: 'var(--s2)', borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--dim)', fontSize: 12, marginBottom: 12,
        border: '1px solid var(--border)',
      }}>
        Document Preview
      </div>
      {data.url ? (
        <a href={data.url} target="_blank" rel="noreferrer" download>
          <button style={{
            width: '100%', background: 'var(--accent-purple)', border: 'none',
            borderRadius: 9, padding: '12px', color: '#fff',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}>
            ⬇ Download PDF {data.size ? `(${data.size})` : ''}
          </button>
        </a>
      ) : (
        <button style={{
          width: '100%', background: 'var(--dim)', border: 'none',
          borderRadius: 9, padding: '12px', color: '#fff',
          fontWeight: 700, fontSize: 13, cursor: 'not-allowed',
          fontFamily: 'var(--font-body)',
        }}>
          ⬇ Download PDF {data.size ? `(${data.size})` : ''}
        </button>
      )}
    </div>
  );
}

function CurriculumBlock({ data }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(data.modules || []).map((mod, i) => (
        <div key={i} style={{ ...card, display: 'flex', gap: 14 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: i === 0 ? 'var(--accent-purple)' : 'var(--s2)',
            border: `2px solid ${i === 0 ? 'var(--accent-purple)' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: 2, fontSize: 11,
          }}>
            {i === 0 ? '⚡' : <span style={{ color: 'var(--dim)' }}>🔒</span>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: 'var(--accent-purple)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 3 }}>
              {mod.week}
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: 'var(--text)' }}>{mod.title}</div>
            <div style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.6, marginBottom: mod.tags?.length ? 8 : 0 }}>
              {mod.desc}
            </div>
            {(mod.tags || []).length > 0 && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {mod.tags.map((t, j) => <span key={j} style={tag}>{t}</span>)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PrerequisitesBlock({ data }) {
  return (
    <div style={{ ...card }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, marginBottom: 12, color: 'var(--text)' }}>
        Prerequisites
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(data.items || []).map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--s2)', borderRadius: 9, padding: '10px 13px',
            border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: 'var(--accent-purple)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 10, color: '#fff' }}>✓</span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>{item.text}</span>
            {item.badge && <span style={tagGreen}>{item.badge}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillsGridBlock({ data }) {
  return (
    <div style={{ ...card }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, marginBottom: 4, color: 'var(--text)' }}>
        {data.heading}
      </h3>
      {data.subtitle && (
        <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 14 }}>{data.subtitle}</p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        {(data.skills || []).map((sk, i) => (
          <div key={i} style={{
            background: 'var(--s2)', borderRadius: 10, padding: '14px 12px',
            border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'rgba(110,0,255,0.1)',
              border: '1px solid rgba(110,0,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, marginBottom: 8,
            }}>{sk.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3, color: 'var(--text)' }}>{sk.name}</div>
            <div style={{ fontSize: 11, color: 'var(--sub)' }}>{sk.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoadmapBlock({ data }) {
  return (
    <div style={{ ...card }}>
      {data.heading && (
        <div style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
          {data.heading}
        </div>
      )}
      {(data.steps || []).map((step, i) => (
        <div key={i} style={{
          display: 'flex', gap: 14, padding: '12px 0',
          borderBottom: i < data.steps.length - 1 ? '1px solid var(--border)' : 'none',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(110,0,255,0.1)',
            border: '1.5px solid var(--accent-purple)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontFamily: 'var(--font-mono)', fontWeight: 700,
            fontSize: 11, color: 'var(--accent-purple)',
          }}>{step.num}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3, color: 'var(--text)' }}>{step.title}</div>
              <span style={{ fontSize: 16, color: 'var(--dim)' }}>{step.icon}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--sub)' }}>{step.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ComparisonBlock({ data }) {
  return (
    <div style={{ ...card }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        {[data.left, data.right].map((side, i) => side ? (
          <div key={i} style={{
            background: 'var(--s2)', borderRadius: 10, padding: '14px',
            textAlign: 'center', border: '1px solid var(--border)',
          }}>
            <div style={{ fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{side.name}</div>
            <div style={{ fontSize: 9, color: 'var(--accent-purple)', fontWeight: 700, letterSpacing: '0.08em', marginTop: 3 }}>{side.type}</div>
          </div>
        ) : null)}
      </div>
      {['PRICING', 'FEATURES', 'USE CASE'].map((label, idx) => (
        <div key={label} style={{ borderTop: '1px solid var(--border)', padding: '10px 0' }}>
          <div style={{ fontSize: 9, color: 'var(--dim)', fontWeight: 700, letterSpacing: '0.07em', marginBottom: 8, textAlign: 'center' }}>
            {label}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, color: 'var(--sub)' }}>
            {idx === 0 && (
              <>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{data.left?.price}</div>
                  <div>{data.left?.priceSub}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{data.right?.price}</div>
                  <div>{data.right?.priceSub}</div>
                </div>
              </>
            )}
            {idx === 1 && (
              <>
                <div>{(data.left?.features || []).map((f, j) => (
                  <div key={j} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <span style={{ color: 'var(--accent-purple)' }}>✓</span>{f}
                  </div>
                ))}</div>
                <div>{(data.right?.features || []).map((f, j) => (
                  <div key={j} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <span style={{ color: 'var(--accent-purple)' }}>⚡</span>{f}
                  </div>
                ))}</div>
              </>
            )}
            {idx === 2 && (
              <>
                <div style={{ fontStyle: 'italic' }}>{data.left?.useCase}</div>
                <div style={{ fontStyle: 'italic' }}>{data.right?.useCase}</div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ResourceListBlock({ data }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(data.items || []).map((item, i) => (
        <div key={i} style={{ ...card, display: 'flex', gap: 14, alignItems: 'center' }}>
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} loading="lazy"
              style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 52, height: 52, borderRadius: 8, background: 'var(--s2)',
              flexShrink: 0, border: '1px solid var(--border)',
            }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3, color: 'var(--text)' }}>{item.name}</div>
            <div style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 6 }}>{item.desc}</div>
            <span style={tag}>{item.tag}</span>
          </div>
          {item.url && (
            <a href={item.url} target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: 'var(--accent-purple)', fontWeight: 700, whiteSpace: 'nowrap', textDecoration: 'none' }}>
              Visit ↗
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function StatsRowBlock({ data }) {
  const stats = data.stats || [];
  return (
    <div style={{ ...card, padding: '16px 14px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${stats.length > 3 ? '110px' : '130px'}, 1fr))`,
        gap: 10,
        alignItems: 'stretch',
      }}>
        {stats.map((s, i) => {
          const icon = renderStatIcon(s);
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '12px 8px',
                borderRadius: 10,
                background: 'var(--s2, rgba(255,255,255,0.03))',
                border: '1px solid var(--border)',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
            >
              {icon}
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(14px, 3.5vw, 18px)',
                fontWeight: 800,
                color: 'var(--text)',
                marginBottom: 3,
                wordBreak: 'break-word',
                lineHeight: 1.2,
              }}>
                {s.value}
              </div>
              <div style={{
                fontSize: 10,
                color: 'var(--sub)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                opacity: 0.85,
              }}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CourseLogisticsBlock({ data }) {
  return (
    <div style={{ ...card }}>
      <div style={{ fontSize: 10, color: 'var(--sub)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
        Course Logistics
      </div>
      {(data.rows || []).map((row, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', padding: '10px 0',
          borderBottom: i < data.rows.length - 1 ? '1px solid var(--border)' : 'none',
        }}>
          <span style={{ fontSize: 13, color: 'var(--sub)', fontWeight: 600 }}>{row.label}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: row.label?.toLowerCase().includes('fee') ? 'var(--green)' : 'var(--text)' }}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function InstructorBlock({ data }) {
  return (
    <div style={{ ...card }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
        {data.avatarUrl ? (
          <img src={data.avatarUrl} alt={data.name} loading="lazy"
            style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-purple), #9b5de5)',
            flexShrink: 0,
          }} />
        )}
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, marginBottom: 3, color: 'var(--text)' }}>
            {data.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--accent-purple)', fontWeight: 600 }}>{data.role}</div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.7, marginBottom: 14 }}>{data.bio}</p>
      <div style={{ display: 'flex', gap: 24 }}>
        {(data.stats || []).map((s, i) => (
          <div key={i}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthorCardBlock({ data }) {
  return (
    <div style={{ ...card, textAlign: 'center', padding: '22px' }}>
      <div style={{ fontSize: 9, color: 'var(--accent-purple)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>
        {data.badge}
      </div>
      {data.avatarUrl ? (
        <img src={data.avatarUrl} alt={data.name} loading="lazy"
          style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px' }} />
      ) : (
        <div style={{
          width: 54, height: 54, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-purple), #1a1a2e)',
          margin: '0 auto 12px',
        }} />
      )}
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, marginBottom: 4, color: 'var(--text)' }}>
        {data.name}
      </div>
      <div style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 14 }}>{data.role}</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {(data.actions || []).map((a, i) => (
          <button key={i} style={{
            fontSize: 11, fontWeight: 700, padding: '6px 14px',
            borderRadius: 7, border: '1.5px solid var(--border)',
            background: 'transparent', color: 'var(--text)', cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}>{a}</button>
        ))}
      </div>
    </div>
  );
}

function DiscussionBlock({ data }) {
  return (
    <div style={{ ...card }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>
          Discussion ({data.count || 0})
        </h3>
        <button style={{
          fontSize: 11, fontWeight: 700, padding: '5px 14px',
          borderRadius: 7, border: '1.5px solid var(--accent-purple)',
          background: 'transparent', color: 'var(--accent-purple)', cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}>Write a comment</button>
      </div>
      {(data.comments || []).map((c, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--s2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'var(--accent-purple)', flexShrink: 0,
          }}>
            {c.author?.split(' ').map(w => w[0]).join('')}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{c.author}</span>
              <span style={{ fontSize: 11, color: 'var(--dim)' }}>{c.time}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.65, marginBottom: 6 }}>{c.text}</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--dim)' }}>👍 {c.likes}</span>
              <span style={{ fontSize: 11, color: 'var(--accent-purple)', cursor: 'pointer', fontWeight: 600 }}>Reply</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CTABoxBlock({ data }) {
  return (
    <div style={{
      background: 'rgba(110,0,255,0.07)',
      border: '1.5px solid rgba(110,0,255,0.25)',
      borderRadius: 14, padding: '24px 20px', textAlign: 'center',
    }}>
      {data.badge && (
        <span style={{ ...tagGreen, marginBottom: 12, display: 'inline-block' }}>
          {data.badge}
        </span>
      )}
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, marginBottom: 8, color: 'var(--text)' }}>
        {data.label}
      </h3>
      <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.65, marginBottom: 18 }}>{data.body}</p>
      {data.btnUrl ? (
        <a href={data.btnUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
          <button style={{
            background: 'var(--accent-purple)', border: 'none', borderRadius: 10,
            padding: '13px 32px', color: '#fff', fontWeight: 800,
            fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-display)', width: '100%',
          }}>{data.btnText}</button>
        </a>
      ) : (
        <button style={{
          background: 'var(--accent-purple)', border: 'none', borderRadius: 10,
          padding: '13px 32px', color: '#fff', fontWeight: 800,
          fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-display)', width: '100%',
        }}>{data.btnText}</button>
      )}
    </div>
  );
}

function ShareBarBlock({ data }) {
  return (
    <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--sub)', fontWeight: 600 }}>{data.label}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        {['𝕏', 'in', '🔗'].map((ic, i) => (
          <button key={i} style={{
            width: 34, height: 34, borderRadius: 8,
            border: '1.5px solid var(--border)', background: 'transparent',
            color: 'var(--text)', cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{ic}</button>
        ))}
      </div>
    </div>
  );
}

function NewsletterBlock({ data }) {
  return (
    <div style={{ ...card, textAlign: 'center' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, marginBottom: 6, color: 'var(--text)' }}>
        {data.heading}
      </h3>
      <p style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 16 }}>{data.body}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder={data.placeholder}
          style={{
            flex: 1, background: 'var(--s2)', border: '1.5px solid var(--border)',
            borderRadius: 8, padding: '10px 13px', color: 'var(--text)',
            fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)',
          }}
        />
        <button style={{
          background: 'var(--accent-purple)', border: 'none', borderRadius: 8,
          padding: '10px 20px', color: '#fff', fontWeight: 700,
          fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
        }}>{data.btn}</button>
      </div>
    </div>
  );
}

function ToolCardBlock({ data }) {
  return (
    <div style={{ ...card }}>
      {/* Header row: logo (saved as logoUrl) + tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        {data.logoUrl && (
          <img
            src={data.logoUrl}
            alt={data.name || 'Tool logo'}
            style={{ width: 40, height: 40, borderRadius: 9, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
          />
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {(data.tags || []).map((t, i) => <span key={i} style={tag}>{t}</span>)}
        </div>
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, marginBottom: 6, color: 'var(--text)' }}>
        {data.name}
      </h3>
      <p style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 12, lineHeight: 1.65 }}>{data.desc}</p>
      <div style={{
        background: 'rgba(110,0,255,0.07)', border: '1px solid rgba(110,0,255,0.2)',
        borderRadius: 8, padding: '8px 12px', marginBottom: 12,
      }}>
        <div style={{ fontSize: 9, color: 'var(--accent-purple)', fontWeight: 700, letterSpacing: '0.06em' }}>✦ KEY HIGHLIGHT</div>
        <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3, color: 'var(--text)' }}>{data.highlight}</div>
      </div>
      {(data.features || []).map((f, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
          <span style={{
            width: 16, height: 16, borderRadius: '50%', background: 'var(--accent-purple)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, color: '#fff', flexShrink: 0,
          }}>✓</span>
          <span style={{ fontSize: 12, color: 'var(--sub)' }}>{f}</span>
        </div>
      ))}
      {data.url && (
        <a href={data.url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 14 }}>
          <button style={{
            width: '100%', background: 'var(--accent-purple)', border: 'none',
            borderRadius: 9, padding: '11px', color: '#fff',
            fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>Visit Official Website</button>
        </a>
      )}
    </div>
  );
}

function RepoCardBlock({ data }) {
  return (
    <div style={{ ...card }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, flex: 1, marginRight: 12, color: 'var(--text)' }}>
          {data.name}
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          {data.badge && <span style={tagGreen}>{data.badge}</span>}
          <span style={{ fontSize: 11, color: 'var(--dim)' }}>{data.version}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--sub)' }}>★ {data.stars}</span>
        <span style={{ fontSize: 11, color: 'var(--sub)' }}>⑂ {data.forks}</span>
      </div>
      {data.code && (
        <div style={{ background: '#0d0d14', borderRadius: 8, padding: '10px 13px', marginBottom: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
          <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#a8a8d8', whiteSpace: 'pre-wrap', margin: 0 }}>
            {data.code}
          </pre>
        </div>
      )}
      <p style={{ fontSize: 12, color: 'var(--sub)' }}>{data.desc}</p>
      {data.url && (
        <a href={data.url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 14 }}>
          <button style={{
            background: 'transparent', border: '1.5px solid var(--border)',
            borderRadius: 9, padding: '9px 20px', color: 'var(--text)',
            fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>View on GitHub ↗</button>
        </a>
      )}
    </div>
  );
}

// ── Block Router ──────────────────────────────────────────────────────────────

// ── Column Layout Blocks ──────────────────────────────────────────────────────
// FIX: These were entirely missing — switch fell through to null so cols never rendered.
// Studio saves: { type:'two_col', data:{ left:[blocks], right:[blocks] } }
//               { type:'three_col', data:{ col1:[blocks], col2:[blocks], col3:[blocks] } }

function TwoColBlock({ data }) {
  return (
    // Break out of the 760px prose shell so 2 columns have real room.
    // margin: 0 -16px pulls flush with the page edges on mobile; gap handles spacing.
    // gridTemplateColumns uses a clamp so each col is never narrower than 220px:
    //   – on ≥520px viewports → side-by-side (2 × 220px + gap fits)
    //   – below 520px         → stacks gracefully via minmax(0,1fr) @ each breakpoint
    // We avoid auto-fit entirely so column count is always exactly 2 on desktop.
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: 16,
      // Negative margin "breaks out" of the narrow prose wrapper on wider screens
      // without needing a separate wrapper component.
      margin: '0 calc(max(0px, (760px - 100vw + 48px) / -2))',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        {(data.left || []).map((block) => <ReadOnlyBlock key={block.id} block={block} />)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        {(data.right || []).map((block) => <ReadOnlyBlock key={block.id} block={block} />)}
      </div>
    </div>
  );
}

function ThreeColBlock({ data }) {
  return (
    // Same breakout trick as TwoColBlock. 3 columns need more room — they only
    // go side-by-side on viewports wide enough to fit 3 × min(180px).
    // repeat(3, minmax(0,1fr)) is explicit: always 3 cols. On narrow screens
    // the parent page padding clamps the container so columns still render,
    // just narrower — which is correct for a 3-col content block.
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: 16,
      margin: '0 calc(max(0px, (760px - 100vw + 48px) / -2))',
    }}>
      {[data.col1, data.col2, data.col3].map((col, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {(col || []).map((block) => <ReadOnlyBlock key={block.id} block={block} />)}
        </div>
      ))}
    </div>
  );
}

function ReadOnlyBlock({ block }) {
  const { type, data } = block;
  switch (type) {
    case 'hero':              return <HeroBlock data={data} />;
    case 'section_title':    return <SectionTitleBlock data={data} />;
    case 'rich_text':        return <RichTextBlock data={data} />;
    case 'callout':          return <CalloutBlock data={data} />;
    case 'divider':          return <DividerBlock />;
    case 'image_block':      return <ImageBlock data={data} />;
    case 'code_block':       return <CodeBlock data={data} />;
    case 'video_embed':      return <VideoEmbedBlock data={data} />;
    case 'pdf_viewer':       return <PDFViewerBlock data={data} />;
    case 'curriculum':       return <CurriculumBlock data={data} />;
    case 'prerequisites':    return <PrerequisitesBlock data={data} />;
    case 'skills_grid':      return <SkillsGridBlock data={data} />;
    case 'roadmap':          return <RoadmapBlock data={data} />;
    case 'comparison':       return <ComparisonBlock data={data} />;
    case 'resource_list':    return <ResourceListBlock data={data} />;
    case 'stats_row':        return <StatsRowBlock data={data} />;
    case 'course_logistics': return <CourseLogisticsBlock data={data} />;
    case 'instructor':       return <InstructorBlock data={data} />;
    case 'author_card':      return <AuthorCardBlock data={data} />;
    case 'discussion':       return <DiscussionBlock data={data} />;
    case 'cta_box':          return <CTABoxBlock data={data} />;
    case 'share_bar':        return <ShareBarBlock data={data} />;
    case 'newsletter':       return <NewsletterBlock data={data} />;
    case 'tool_card':        return <ToolCardBlock data={data} />;
    case 'repo_card':        return <RepoCardBlock data={data} />;
    case 'two_col':          return <TwoColBlock data={data} />;   // ✅ FIX
    case 'three_col':        return <ThreeColBlock data={data} />; // ✅ FIX
    default:                 return null;
  }
}

// ── Layout imports ────────────────────────────────────────────────────────────
import TwoColumnLayout   from './layouts/TwoColumnLayout';
import ThreeColumnLayout from './layouts/ThreeColumnLayout';
import CourseRightPanel    from './panels/CourseRightPanel';
import DocumentRightPanel  from './panels/DocumentRightPanel';
import ProjectRightPanel   from './panels/ProjectRightPanel';
import RepoRightPanel      from './panels/RepoRightPanel';
import ResourceRightPanel  from './panels/ResourceRightPanel';
import RoadmapRightPanel   from './panels/RoadmapRightPanel';
import ToolkitRightPanel   from './panels/ToolkitRightPanel';

// ── Layout config ─────────────────────────────────────────────────────────────
// Maps page_type → which shell + right panel to use.
// Pattern A = TwoColumnLayout (content + sticky right panel)
// Pattern B = ThreeColumnLayout (filters + content + right panel) — toolkit only
// Pattern C = single centered column, no panel

const LAYOUT_MAP = {
  'course':              { pattern: 'A', Panel: CourseRightPanel   },
  'learning-path':       { pattern: 'A', Panel: CourseRightPanel   },
  'document-article':    { pattern: 'A', Panel: DocumentRightPanel },
  'standard-article':    { pattern: 'A', Panel: DocumentRightPanel },
  'tech-deep-dive':      { pattern: 'A', Panel: DocumentRightPanel },
  'comparison':          { pattern: 'A', Panel: DocumentRightPanel },
  'code-playground':     { pattern: 'A', Panel: DocumentRightPanel },
  'project-showcase':    { pattern: 'A', Panel: ProjectRightPanel  },
  'repository-article':  { pattern: 'A', Panel: RepoRightPanel     },
  'resource-article':    { pattern: 'A', Panel: ResourceRightPanel },
  'roadmap':             { pattern: 'A', Panel: RoadmapRightPanel  },
  'toolkit':             { pattern: 'B', Panel: ToolkitRightPanel  },
};

// ── Content column ────────────────────────────────────────────────────────────
function ArticleContent({ content_blocks }) {
  return (
    <div style={{ overflow: 'visible' }}>
      {content_blocks.map((block) => (
        <div key={block.id} style={{ marginBottom: 16 }}>
          <ReadOnlyBlock block={block} />
        </div>
      ))}
      {content_blocks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--dim)', fontSize: 14 }}>
          This article has no content yet.
        </div>
      )}
    </div>
  );
}

// ── Page Shell ────────────────────────────────────────────────────────────────

export default function ArticlePage({ article }) {
  const { content_blocks = [], title, meta = {}, creator_username, page_type } = article || {};

  const statusLower = (article?.moderation_status || article?.status || '').toLowerCase();
  const isUnderReview = statusLower === 'under_review';
  const isRemoved = statusLower === 'removed';

  const moderationBanner = (() => {
    if (isUnderReview) {
      return (
        <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          ⚠️ Under Review: This article has been flagged for compliance review.
        </div>
      );
    }
    if (isRemoved) {
      return (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          ⛔ Content Removed: This article was removed for violating Code Plus Academy community guidelines.
        </div>
      );
    }
    return null;
  })();

  const layout = LAYOUT_MAP[page_type];

  const seoHead = (
    <Helmet>
      <title>{title || 'Article'} | CodePlus Academy</title>
      <meta name="description" content={meta.description || ''} />
      {meta.og_image && <meta property="og:image" content={meta.og_image} />}
      <meta property="og:title" content={`${title} | CodePlus Academy`} />
      <meta property="og:type" content="article" />
      {creator_username && <meta property="article:author" content={creator_username} />}
    </Helmet>
  );

  // ── Pattern C: no panel, single centered column ───────────────────────────
  if (!layout) {
    return (
      <>
        {seoHead}
        <div style={{
          maxWidth: 760, margin: '0 auto', overflow: 'visible',
          padding: 'clamp(16px, 4vw, 40px) clamp(12px, 4vw, 24px)',
        }}>
          {moderationBanner}
          <ArticleContent content_blocks={content_blocks} />
        </div>
        <MobileBottomNav />
      </>
    );
  }

  const { pattern, Panel } = layout;
  const rightPanel = <Panel article={article} />;

  // ── Pattern B: ThreeColumnLayout (toolkit — filter sidebar + content + panel)
  if (pattern === 'B') {
    return (
      <>
        {seoHead}
        <ThreeColumnLayout rightPanel={rightPanel}>
          {moderationBanner}
          <ArticleContent content_blocks={content_blocks} />
        </ThreeColumnLayout>
        <MobileBottomNav />
      </>
    );
  }

  // ── Pattern A: TwoColumnLayout (content + sticky right panel) ────────────
  return (
    <>
      {seoHead}
      <TwoColumnLayout rightPanel={rightPanel}>
        {moderationBanner}
        <ArticleContent content_blocks={content_blocks} />
      </TwoColumnLayout>
      <MobileBottomNav />
    </>
  );
}