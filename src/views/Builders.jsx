import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { 
  Code2, Sparkles, Terminal, Globe, Cpu, Layers, 
  ExternalLink, Github, Linkedin, Twitter, Instagram, 
  Mail, Award, ShieldCheck, Rocket, Heart, ArrowRight
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import NoIndex from '../components/seo/NoIndex';
import initialBuildersData from '../data/builders.json';
import api from '../api/axios';

const BUILDERS_DATA = Array.isArray(initialBuildersData) ? initialBuildersData : [];

const CATEGORIES = [
  { id: 'all', label: 'All Builders' },
  { id: 'founders', label: 'Founders & Core' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'design', label: 'Design & Product' },
  { id: 'alumni', label: 'Past Team & Alumni' },
];

export default function Builders() {
  const [buildersList, setBuildersList] = useState(BUILDERS_DATA);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.get('/stats/builders')
      .then((res) => {
        if (isMounted && Array.isArray(res.data?.builders) && res.data.builders.length > 0) {
          setBuildersList(res.data.builders);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const filteredBuilders = buildersList.filter((builder) => {
    const category = builder.teamCategory || builder.team_category || 'engineering';
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'alumni' ? (builder.status || '').toLowerCase().includes('past') :
      category === activeTab;

    const matchesSearch = 
      (builder.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (builder.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (builder.bio || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(builder.skills) && builder.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesTab && matchesSearch;
  });

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <>
      <Helmet><title>Meet the Builders & Team — FocusGram</title></Helmet>
      <NoIndex />
      <PageWrapper style={{ maxWidth: 1200, paddingLeft: 20, paddingRight: 20 }}>

        {/* ── Cross Navigation Banner ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, padding: '12px 20px', borderRadius: 14,
          background: 'rgba(0, 180, 216, 0.06)', border: '1px solid rgba(0, 180, 216, 0.2)',
          marginBottom: 36, marginTop: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={16} style={{ color: 'var(--green, #00b4d8)' }} aria-hidden="true" />
            <span style={{ fontSize: 13, color: 'var(--text)' }}>
              Looking for top students & resource uploaders? Visit the <strong>Community Contributors Page</strong>.
            </span>
          </div>
          <Link to="/contributors" style={{
            fontSize: 12.5, fontWeight: 600, color: 'var(--green, #00b4d8)',
            display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none'
          }}>
            <span>View Contributor Hall of Fame</span>
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>

        {/* ── Hero Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 99,
            background: 'var(--card, #111)', border: '1px solid var(--border)',
            marginBottom: 18,
          }}>
            <Terminal size={14} style={{ color: 'var(--green, #00b4d8)' }} aria-hidden="true" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--green, #00b4d8)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              // THE CORE CREW • PAST & PRESENT
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2,
            color: 'var(--text)', letterSpacing: '-0.02em'
          }}>
            The Builders Behind FocusGram (powered by Code Plus Academy)
          </h1>

          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: 'clamp(14.5px, 2vw, 16.5px)',
            color: 'var(--sub)', maxWidth: 740, margin: '0 auto 32px', lineHeight: 1.65,
          }}>
            Meet the software engineers, designers, founders, and core maintainers who design, write code,
            architect distributed systems, and scale FocusGram (powered by Code Plus Academy) for thousands of engineering students.
          </p>

          {/* Quick Metrics */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16, maxWidth: 880, margin: '0 auto', textAlign: 'left'
          }}>
            <div className="stat-card" style={{ padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--sub)', fontWeight: 600, textTransform: 'uppercase' }}>Engineering</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>100% Custom</div>
              <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 2 }}>Next.js • Node • Postgres</div>
            </div>

            <div className="stat-card" style={{ padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--sub)', fontWeight: 600, textTransform: 'uppercase' }}>Modules Built</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>35+ Services</div>
              <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 2 }}>Notes • Social • Studio</div>
            </div>

            <div className="stat-card" style={{ padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--sub)', fontWeight: 600, textTransform: 'uppercase' }}>Philosophy</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>Zero Noise</div>
              <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 2 }}>Code-First Architecture</div>
            </div>

            <div className="stat-card" style={{ padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--sub)', fontWeight: 600, textTransform: 'uppercase' }}>Community</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>Open Access</div>
              <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 2 }}>Built For Students</div>
            </div>
          </div>
        </div>

        {/* ── Filter Tabs & Search ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 16, marginBottom: 36, paddingBottom: 16,
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                style={{
                  padding: '8px 18px', borderRadius: 99,
                  fontSize: 13, fontWeight: 600, border: '1px solid',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  background: activeTab === cat.id ? 'var(--green, #00b4d8)' : 'var(--surface)',
                  color: activeTab === cat.id ? '#ffffff' : 'var(--sub)',
                  borderColor: activeTab === cat.id ? 'var(--green, #00b4d8)' : 'var(--border)'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', minWidth: 240 }}>
            <input
              type="text"
              placeholder="Search builders, skills, roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '8px 14px', borderRadius: 10,
                background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13, outline: 'none'
              }}
            />
          </div>
        </div>

        {/* ── Builders Cards Grid ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
          gap: 24, marginBottom: 64
        }}>
          {filteredBuilders.map((builder) => (
            <div
              key={builder.id}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 180, 216, 0.4)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 14px 30px rgba(0, 180, 216, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
              }}
            >
              <div>
                {/* Header Profile Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                  <Link to={`/builders/${builder.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                    {builder.avatar ? (
                      <img
                        src={builder.avatar}
                        alt={builder.name}
                        style={{
                          width: 58, height: 58, borderRadius: 16,
                          objectFit: 'cover', border: '2px solid rgba(0, 180, 216, 0.3)',
                          transition: 'transform 0.2s ease',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 58, height: 58, borderRadius: 16,
                        background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.2), rgba(16, 185, 129, 0.2))',
                        border: '2px solid rgba(0, 180, 216, 0.3)', color: 'var(--green, #00b4d8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
                      }}>
                        {getInitials(builder.name)}
                      </div>
                    )}
                  </Link>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Link to={`/builders/${builder.id}`} style={{ textDecoration: 'none' }}>
                        <h3 style={{
                          margin: 0, fontSize: 17, fontWeight: 700,
                          color: 'var(--text)', lineHeight: 1.3,
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--green, #00b4d8)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text)'}
                        >
                          {builder.name}
                        </h3>
                      </Link>
                      <ShieldCheck size={16} style={{ color: 'var(--green, #00b4d8)', flexShrink: 0 }} />
                    </div>

                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--green, #00b4d8)', marginTop: 2 }}>
                      {builder.role}
                    </div>

                    <div style={{ marginTop: 6 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.04em', padding: '2px 8px', borderRadius: 6,
                        background: builder.status.includes('Core') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                        color: builder.status.includes('Core') ? '#34d399' : 'var(--sub)'
                      }}>
                        {builder.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p style={{
                  fontSize: 13, color: 'var(--sub)', lineHeight: 1.6,
                  margin: '0 0 16px', minHeight: 42
                }}>
                  {builder.bio}
                </p>

                {/* Contributions List */}
                {builder.contributions && builder.contributions.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                      Key Architectural Impact:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--sub)', lineHeight: 1.5 }}>
                      {builder.contributions.map((c, i) => (
                        <li key={i} style={{ marginBottom: 3 }}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tech Stack Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                  {builder.skills.map((skill, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 11, fontWeight: 500, padding: '3px 8px',
                        borderRadius: 6, background: 'var(--s2, #18181b)',
                        border: '1px solid var(--border)', color: 'var(--text)'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Social Profiles Bar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {builder.socials.github && (
                    <a href={builder.socials.github} target="_blank" rel="noreferrer" title="GitHub Profile" aria-label={`${builder.name}'s GitHub Profile`} style={{ color: 'var(--sub)', transition: 'color 0.2s' }}>
                      <Github size={16} aria-hidden="true" />
                    </a>
                  )}
                  {builder.socials.linkedin && (
                    <a href={builder.socials.linkedin} target="_blank" rel="noreferrer" title="LinkedIn Profile" aria-label={`${builder.name}'s LinkedIn Profile`} style={{ color: 'var(--sub)', transition: 'color 0.2s' }}>
                      <Linkedin size={16} aria-hidden="true" />
                    </a>
                  )}
                  {builder.socials.twitter && (
                    <a href={builder.socials.twitter} target="_blank" rel="noreferrer" title="X (Twitter)" aria-label={`${builder.name}'s X Profile`} style={{ color: 'var(--sub)', transition: 'color 0.2s' }}>
                      <Twitter size={16} aria-hidden="true" />
                    </a>
                  )}
                  {builder.socials.instagram && (
                    <a href={builder.socials.instagram} target="_blank" rel="noreferrer" title="Instagram" aria-label={`${builder.name}'s Instagram Profile`} style={{ color: 'var(--sub)', transition: 'color 0.2s' }}>
                      <Instagram size={16} aria-hidden="true" />
                    </a>
                  )}
                  {builder.socials.email && (
                    <a href={`mailto:${builder.socials.email}`} title="Email" aria-label={`Email ${builder.name}`} style={{ color: 'var(--sub)', transition: 'color 0.2s' }}>
                      <Mail size={16} aria-hidden="true" />
                    </a>
                  )}
                </div>

                {builder.socials.cpaUsername && (
                  <Link
                    to={`/u/${builder.socials.cpaUsername}`}
                    style={{
                      fontSize: 11.5, fontWeight: 600, color: 'var(--green, #00b4d8)',
                      display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none'
                    }}
                  >
                    <span>@{builder.socials.cpaUsername}</span>
                    <ExternalLink size={12} aria-hidden="true" />
                  </Link>
                )}
              </div>

              {/* View Full Profile CTA */}
              <Link
                to={`/builders/${builder.id}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 12px', borderRadius: 10, background: 'var(--s2)',
                  border: '1px solid var(--border)', color: 'var(--text)',
                  fontSize: 12.5, fontWeight: 600, textDecoration: 'none',
                  marginTop: 12, transition: 'all 0.2s ease'
                }}
              >
                <span>View Engineering Story & Subsystems</span>
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>

        {/* ── Join the Engineering Team CTA ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%), var(--surface)',
          border: '1px solid var(--border-bright)', borderRadius: 20,
          padding: '40px 32px', textAlign: 'center', marginBottom: 64
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: 'var(--green-dim)',
            color: 'var(--green, #00b4d8)', display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', marginBottom: 16
          }}>
            <Rocket size={24} aria-hidden="true" />
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800,
            color: 'var(--text)', margin: '0 0 10px'
          }}>
            Want to Build with Us?
          </h2>

          <p style={{
            fontSize: 14.5, color: 'var(--sub)', maxWidth: 580,
            margin: '0 auto 24px', lineHeight: 1.6
          }}>
            FocusGram (powered by Code Plus Academy) is actively seeking talented student engineers, UI/UX designers,
            and open-source contributors to help build next-generation academic tools.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <a
              href="https://github.com/Code-Plus-Academy"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 22px', borderRadius: 10, background: 'var(--green, #00b4d8)',
                color: '#ffffff', fontSize: 13.5, fontWeight: 700, textDecoration: 'none'
              }}
            >
              <Github size={16} aria-hidden="true" />
              <span>Contribute on GitHub</span>
            </a>

            <Link
              to="/about"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 22px', borderRadius: 10, background: 'var(--s2)',
                border: '1px solid var(--border)', color: 'var(--text)',
                fontSize: 13.5, fontWeight: 600, textDecoration: 'none'
              }}
            >
              <span>Learn About Our Mission</span>
            </Link>
          </div>
        </div>

      </PageWrapper>
    </>
  );
}
