'use client';

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, ShieldCheck, Terminal, Code2, Globe, Cpu, 
  ExternalLink, Github, Linkedin, Twitter, Instagram, 
  Mail, Award, Sparkles, Layers, CheckCircle2, User, 
  ArrowRight, Share2, Copy, Check
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import initialBuildersData from '../data/builders.json';
import api from '../api/axios';

const FALLBACK_BUILDERS = Array.isArray(initialBuildersData) ? initialBuildersData : [];

export default function BuilderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [builders, setBuilders] = useState(FALLBACK_BUILDERS);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.get('/stats/builders')
      .then((res) => {
        if (isMounted && Array.isArray(res.data?.builders) && res.data.builders.length > 0) {
          setBuilders(res.data.builders);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const builder = builders.find(
    (b) => String(b.id).toLowerCase() === String(id).toLowerCase()
  );

  const currentIndex = builders.findIndex(
    (b) => String(b.id).toLowerCase() === String(id).toLowerCase()
  );

  const prevBuilder = currentIndex > 0 ? builders[currentIndex - 1] : null;
  const nextBuilder = currentIndex < builders.length - 1 ? builders[currentIndex + 1] : null;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  if (!builder) {
    return (
      <PageWrapper style={{ maxWidth: 800, padding: '60px 20px', textAlign: 'center' }}>
        <Helmet><title>Builder Not Found | Code Plus Academy</title></Helmet>
        <div style={{
          background: 'var(--surface)', border: '1px dashed var(--border)',
          borderRadius: 20, padding: '48px 24px'
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <User size={28} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px' }}>
            Builder Profile Not Found
          </h2>
          <p style={{ fontSize: 14, color: 'var(--sub)', maxWidth: 440, margin: '0 auto 24px' }}>
            We couldn't find a team member matching the identifier <code>{id}</code>.
          </p>
          <Link
            to="/builders"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 10, background: 'var(--green, #00b4d8)',
              color: '#000', fontSize: 13.5, fontWeight: 700, textDecoration: 'none'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to All Builders</span>
          </Link>
        </div>
      </PageWrapper>
    );
  }

  const categoryName = 
    builder.teamCategory === 'founders' ? 'Founders & Core' :
    builder.teamCategory === 'engineering' ? 'Engineering & Systems' :
    builder.teamCategory === 'design' ? 'Design & Product' : 'Past Team & Alumni';

  return (
    <>
      <Helmet>
        <title>{`${builder.name} — ${builder.role} | Code Plus Academy`}</title>
        <meta name="description" content={builder.bio || `Meet ${builder.name}, ${builder.role} at Code Plus Academy.`} />
        <meta property="og:title" content={`${builder.name} — ${builder.role}`} />
        <meta property="og:description" content={builder.bio} />
        {builder.avatar && <meta property="og:image" content={builder.avatar} />}
      </Helmet>

      <PageWrapper style={{ maxWidth: 1080, paddingLeft: 20, paddingRight: 20, paddingBottom: 80 }}>

        {/* ── Breadcrumb & Top Bar ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12, marginBottom: 28, paddingTop: 10
        }}>
          <Link
            to="/builders"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600, color: 'var(--sub)', textDecoration: 'none',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--green, #00b4d8)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sub)'}
          >
            <ArrowLeft size={16} />
            <span>All Builders & Team</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleShare}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8, background: 'var(--surface)',
                border: '1px solid var(--border)', color: 'var(--text)',
                fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
              }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Share2 size={14} />}
              <span>{copied ? 'Link Copied' : 'Share Profile'}</span>
            </button>

            {builder.socials?.cpaUsername && (
              <Link
                to={`/u/${builder.socials.cpaUsername}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, background: 'var(--green, #00b4d8)',
                  color: '#000', fontSize: 12.5, fontWeight: 700, textDecoration: 'none'
                }}
              >
                <span>@{builder.socials.cpaUsername}</span>
                <ExternalLink size={13} />
              </Link>
            )}
          </div>
        </div>

        {/* ── Builder Hero Showcase Banner ── */}
        <div style={{
          background: 'radial-gradient(circle at top right, rgba(0, 180, 216, 0.12), transparent 60%), radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.08), transparent 60%), var(--surface)',
          border: '1px solid var(--border-bright)',
          borderRadius: 24,
          padding: '40px 36px',
          marginBottom: 36,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.18)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
            
            {/* Big Avatar */}
            {builder.avatar ? (
              <img
                src={builder.avatar}
                alt={builder.name}
                style={{
                  width: 104, height: 104, borderRadius: 28,
                  objectFit: 'cover', border: '3px solid rgba(0, 180, 216, 0.4)',
                  boxShadow: '0 8px 24px rgba(0, 180, 216, 0.25)',
                  flexShrink: 0
                }}
              />
            ) : (
              <div style={{
                width: 104, height: 104, borderRadius: 28,
                background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.25), rgba(168, 85, 247, 0.25))',
                border: '3px solid rgba(0, 180, 216, 0.4)', color: 'var(--green, #00b4d8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36,
                boxShadow: '0 8px 24px rgba(0, 180, 216, 0.2)',
                flexShrink: 0
              }}>
                {getInitials(builder.name)}
              </div>
            )}

            {/* Main Info */}
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <h1 style={{
                  fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 34px)',
                  fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1.2
                }}>
                  {builder.name}
                </h1>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 99, background: 'rgba(0, 180, 216, 0.12)',
                  border: '1px solid rgba(0, 180, 216, 0.3)', color: 'var(--green, #00b4d8)',
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em'
                }}>
                  <ShieldCheck size={14} />
                  <span>Verified Builder</span>
                </div>
              </div>

              <div style={{
                fontSize: 16, fontWeight: 600, color: 'var(--green, #00b4d8)',
                marginBottom: 12
              }}>
                {builder.role}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                  background: (builder.status || '').includes('Core') ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                  color: (builder.status || '').includes('Core') ? '#34d399' : 'var(--sub)',
                  textTransform: 'uppercase'
                }}>
                  {builder.status || 'Core Team'}
                </span>

                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                  background: 'var(--s2)', border: '1px solid var(--border)',
                  color: 'var(--sub)', textTransform: 'uppercase'
                }}>
                  {categoryName}
                </span>
              </div>
            </div>

            {/* Social Toolbar */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 10,
              borderLeft: '1px solid var(--border)', paddingLeft: 24
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sub)', textTransform: 'uppercase' }}>
                Verified Socials
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {builder.socials?.github && (
                  <a href={builder.socials.github} target="_blank" rel="noreferrer" title="GitHub" style={{
                    width: 36, height: 36, borderRadius: 10, background: 'var(--s2)',
                    border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'var(--text)', transition: 'transform 0.2s'
                  }}>
                    <Github size={17} />
                  </a>
                )}
                {builder.socials?.linkedin && (
                  <a href={builder.socials.linkedin} target="_blank" rel="noreferrer" title="LinkedIn" style={{
                    width: 36, height: 36, borderRadius: 10, background: 'var(--s2)',
                    border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'var(--text)', transition: 'transform 0.2s'
                  }}>
                    <Linkedin size={17} />
                  </a>
                )}
                {builder.socials?.twitter && (
                  <a href={builder.socials.twitter} target="_blank" rel="noreferrer" title="Twitter/X" style={{
                    width: 36, height: 36, borderRadius: 10, background: 'var(--s2)',
                    border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'var(--text)', transition: 'transform 0.2s'
                  }}>
                    <Twitter size={17} />
                  </a>
                )}
                {builder.socials?.instagram && (
                  <a href={builder.socials.instagram} target="_blank" rel="noreferrer" title="Instagram" style={{
                    width: 36, height: 36, borderRadius: 10, background: 'var(--s2)',
                    border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'var(--text)', transition: 'transform 0.2s'
                  }}>
                    <Instagram size={17} />
                  </a>
                )}
                {builder.socials?.email && (
                  <a href={`mailto:${builder.socials.email}`} title="Email" style={{
                    width: 36, height: 36, borderRadius: 10, background: 'var(--s2)',
                    border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'var(--text)', transition: 'transform 0.2s'
                  }}>
                    <Mail size={17} />
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ── Two-Column Layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 48 }}>
          
          {/* Left Column: Bio & Mission */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Terminal size={18} style={{ color: 'var(--green, #00b4d8)' }} />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  About & Engineering Focus
                </h2>
              </div>

              <p style={{ fontSize: 14.5, color: 'var(--sub)', lineHeight: 1.7, margin: '0 0 20px' }}>
                {builder.bio}
              </p>
            </div>

            {/* Core Tech Stack */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', marginBottom: 10 }}>
                Core Technologies & Tools:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {builder.skills && builder.skills.map((skill, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 12, fontWeight: 600, padding: '4px 12px',
                      borderRadius: 8, background: 'var(--s2)',
                      border: '1px solid var(--border)', color: 'var(--text)'
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Architectural Contributions */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 20, padding: 28
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Cpu size={18} style={{ color: 'var(--green, #00b4d8)' }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                Architectural Impact & Subsystems
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {builder.contributions && builder.contributions.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 14px', borderRadius: 12, background: 'var(--s2)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <CheckCircle2 size={18} style={{ color: 'var(--green, #00b4d8)', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5 }}>
                    {c}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── Previous / Next Navigation Bar ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 16, borderTop: '1px solid var(--border)',
          paddingTop: 24
        }}>
          {prevBuilder ? (
            <Link
              to={`/builders/${prevBuilder.id}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '10px 18px', borderRadius: 12, background: 'var(--surface)',
                border: '1px solid var(--border)', color: 'var(--text)',
                textDecoration: 'none', fontSize: 13, fontWeight: 600
              }}
            >
              <ArrowLeft size={16} />
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--sub)', textTransform: 'uppercase' }}>Previous Builder</div>
                <div style={{ fontWeight: 700 }}>{prevBuilder.name}</div>
              </div>
            </Link>
          ) : <div />}

          {nextBuilder && (
            <Link
              to={`/builders/${nextBuilder.id}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '10px 18px', borderRadius: 12, background: 'var(--surface)',
                border: '1px solid var(--border)', color: 'var(--text)',
                textDecoration: 'none', fontSize: 13, fontWeight: 600, textAlign: 'right'
              }}
            >
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--sub)', textTransform: 'uppercase' }}>Next Builder</div>
                <div style={{ fontWeight: 700 }}>{nextBuilder.name}</div>
              </div>
              <ArrowRight size={16} />
            </Link>
          )}
        </div>

      </PageWrapper>
    </>
  );
}
