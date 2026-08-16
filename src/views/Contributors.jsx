'use client';

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { 
  Award, GitPullRequest, Star, Sparkles, 
  Users, ArrowRight, ShieldCheck,
  FileCheck, UploadCloud, Loader2, UserCheck, MessageSquare,
  Flame, HeartHandshake, Code2
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import NoIndex from '../components/seo/NoIndex';
import api from '../api/axios';

const STEPS = [
  {
    step: '01',
    title: 'Upload Study Resources & PYQs',
    desc: 'Share lecture notes, question papers, cheat sheets, or lab manuals to help students in your university succeed.',
    icon: UploadCloud,
  },
  {
    step: '02',
    title: 'Help Peers & Answer Doubts',
    desc: 'Participate in discussions, review shared solutions, write helpful comments, and support classmates.',
    icon: HeartHandshake,
  },
  {
    step: '03',
    title: 'Get Spotlighted in Hall of Fame',
    desc: 'Top active students and campus leaders are featured in the Contributor Hall of Fame with verified community badges.',
    icon: Award,
  },
];

export default function Contributors() {
  const [contributorsList, setContributorsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.get('/stats/contributors')
      .then((res) => {
        if (isMounted) {
          setContributorsList(res.data?.contributors || []);
        }
      })
      .catch((err) => {
        console.warn('Contributors fetch warning:', err.message);
        if (isMounted) setContributorsList([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const totalColleges = new Set(contributorsList.map(c => c.institution || c.college_name).filter(Boolean)).size;
  const totalUploads = contributorsList.reduce((sum, c) => sum + (c.prsMerged || c.posts_count || 1), 0);

  return (
    <>
      <Helmet><title>Contributors & Community Champions — Code Plus Academy</title></Helmet>
      <NoIndex />
      <PageWrapper style={{ maxWidth: 1140, paddingLeft: 20, paddingRight: 20 }}>

        {/* ── Cross Navigation Banner to Builders Page ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, padding: '12px 20px', borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(0, 180, 216, 0.08) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          marginBottom: 36, marginTop: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Code2 size={16} style={{ color: '#c084fc' }} />
            <span style={{ fontSize: 13, color: 'var(--text)' }}>
              Looking for the engineers & designers who built the Code Plus Academy platform?
            </span>
          </div>
          <Link to="/builders" style={{
            fontSize: 12.5, fontWeight: 600, color: 'var(--green, #00b4d8)',
            display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none'
          }}>
            <span>Meet the Builders & Team</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* ── Hero Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 99,
            background: 'var(--card, #0a0e14)', border: '1px solid var(--border, rgba(255,255,255,0.08))',
            marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          }}>
            <Flame size={14} style={{ color: 'var(--cyan, #00dbe9)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--cyan, #00dbe9)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              // COMMUNITY CHAMPIONS • CONTRIBUTOR HALL OF FAME
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display, sans-serif)', fontSize: 'clamp(26px, 5vw, 42px)',
            fontWeight: 800, margin: '0 0 14px', lineHeight: 1.2,
            color: 'var(--text, #fff)',
          }}>
            Community Contributors & Platform Champions
          </h1>

          <p style={{
            fontFamily: 'var(--font-sans, sans-serif)', fontSize: 'clamp(14px, 2vw, 16px)',
            color: 'var(--sub, #94a3b8)', maxWidth: 740, margin: '0 auto', lineHeight: 1.6,
          }}>
            Honoring the active platform members, student creators, and campus ambassadors
            who power Code Plus Academy by uploading verified notes, sharing PYQs, helping peers, and growing the developer community.
          </p>
        </div>

        {/* ── Dynamic Stats Bar ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16, marginBottom: 48,
        }}>
          {[
            { label: 'Spotlighted Contributors', value: loading ? '...' : `${contributorsList.length}`, icon: Users, color: '#00dbe9' },
            { label: 'Colleges Represented', value: loading ? '...' : `${Math.max(totalColleges, contributorsList.length > 0 ? 1 : 0)}`, icon: Award, color: '#7a00ff' },
            { label: 'Community Contributions', value: loading ? '...' : `${totalUploads}+`, icon: GitPullRequest, color: '#34d399' },
            { label: 'Verification', value: 'Peer-Reviewed', icon: ShieldCheck, color: '#f59e0b' },
          ].map((s, i) => {
            const IconComp = s.icon;
            return (
              <div key={i} style={{
                background: 'var(--card, #0a0e14)', border: '1px solid var(--border, rgba(255,255,255,0.08))',
                borderRadius: 18, padding: '18px 16px', textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: `${s.color}15`,
                  border: `1px solid ${s.color}35`, margin: '0 auto 10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <IconComp size={18} color={s.color} />
                </div>
                <div style={{ fontFamily: 'var(--font-display, sans-serif)', fontSize: 24, fontWeight: 800, color: 'var(--text, #fff)' }}>
                  {s.value}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub, #94a3b8)', textTransform: 'uppercase', marginTop: 4 }}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Top Contributors Showcase Grid ── */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00dbe9', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              // ACTIVE COMMUNITY SPOTLIGHT
            </span>
            <h2 style={{ fontFamily: 'var(--font-display, sans-serif)', fontSize: 26, fontWeight: 800, color: 'var(--text, #fff)', marginTop: 6 }}>
              Featured Student Contributors
            </h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--sub, #94a3b8)' }}>
              <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: '#00dbe9' }} />
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading spotlighted contributors from database...</p>
            </div>
          ) : contributorsList.length === 0 ? (
            <div style={{
              background: 'var(--card, #0a0e14)',
              border: '1px dashed var(--border, rgba(255,255,255,0.15))',
              borderRadius: 20,
              padding: '48px 24px',
              textAlign: 'center',
              maxWidth: 600,
              margin: '0 auto',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(0, 219, 233, 0.1)', border: '1px solid rgba(0, 219, 233, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', color: '#00dbe9',
              }}>
                <UserCheck size={26} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text, #fff)', margin: '0 0 8px' }}>
                No Featured Contributors Selected Yet
              </h3>
              <p style={{ fontSize: 13, color: 'var(--sub, #94a3b8)', lineHeight: 1.6, margin: '0 0 20px' }}>
                Start uploading verified notes or answering questions to earn contributor recognition on Code Plus Academy!
              </p>
              <Link
                to="/notes/upload"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'linear-gradient(135deg, #00dbe9, #2563eb)',
                  color: '#fff', padding: '8px 20px', borderRadius: 20,
                  fontSize: 13, fontWeight: 700, textDecoration: 'none',
                }}
              >
                <span>Upload First Resource</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}>
              {contributorsList.map((c, i) => (
                <div
                  key={c.id || i}
                  style={{
                    background: 'var(--card, #0a0e14)',
                    border: '1px solid var(--border, rgba(255,255,255,0.08))',
                    borderRadius: 20,
                    padding: 22,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <div>
                    {/* Top Row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {c.avatar_url ? (
                          <img
                            src={c.avatar_url}
                            alt={c.name}
                            style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0, 219, 233, 0.4)' }}
                          />
                        ) : (
                          <div style={{
                            width: 48, height: 48, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #00dbe920, #7a00ff20)',
                            border: '2px solid rgba(0, 219, 233, 0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-display, sans-serif)', fontWeight: 800, fontSize: 18,
                            color: '#00dbe9',
                          }}>
                            {c.name ? c.name[0].toUpperCase() : 'U'}
                          </div>
                        )}
                        <div>
                          <div style={{ fontFamily: 'var(--font-display, sans-serif)', fontSize: 15, fontWeight: 700, color: 'var(--text, #fff)' }}>
                            {c.name}
                          </div>
                          {c.username && (
                            <Link to={`/u/${c.username}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--sub, #94a3b8)', textDecoration: 'none' }}>
                              @{c.username}
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Badge */}
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                        padding: '3px 10px', borderRadius: 99,
                        background: 'rgba(0, 219, 233, 0.1)', color: '#00dbe9',
                        border: '1px solid rgba(0, 219, 233, 0.3)', textTransform: 'uppercase',
                      }}>
                        {c.badge || 'Contributor'}
                      </span>
                    </div>

                    {/* Role / Bio */}
                    <p style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: 13, color: 'var(--sub, #94a3b8)', lineHeight: 1.5, margin: '0 0 14px' }}>
                      {c.role_title || c.role || 'Active Study Material Contributor'}
                    </p>
                  </div>

                  {/* College / Meta info */}
                  <div style={{ borderTop: '1px solid var(--border, rgba(255,255,255,0.06))', paddingTop: 12, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11.5, color: 'var(--sub, #94a3b8)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>🎓</span>
                      <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.college_name || c.institution || 'Verified Student'}
                      </span>
                    </span>

                    {c.username && (
                      <Link
                        to={`/u/${c.username}`}
                        style={{ fontSize: 12, fontWeight: 600, color: '#00dbe9', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        Profile &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── How to Become a Contributor Section ── */}
        <div style={{
          background: 'var(--card, #0a0e14)',
          border: '1px solid var(--border, rgba(255,255,255,0.08))',
          borderRadius: 24,
          padding: '40px 32px',
          marginBottom: 64,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              // COMMUNITY ROADMAP
            </span>
            <h2 style={{ fontFamily: 'var(--font-display, sans-serif)', fontSize: 26, fontWeight: 800, color: 'var(--text, #fff)', marginTop: 6 }}>
              How to Become a Contributor
            </h2>
            <p style={{ fontSize: 14, color: 'var(--sub, #94a3b8)', maxWidth: 600, margin: '8px auto 0' }}>
              Help your university peers and build your engineering profile by contributing verified academic materials.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border, rgba(255,255,255,0.06))',
                  borderRadius: 18,
                  padding: 24,
                  position: 'relative',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 900,
                    color: 'rgba(0, 219, 233, 0.15)', position: 'absolute', top: 16, right: 18,
                  }}>
                    {s.step}
                  </div>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, background: 'rgba(0, 219, 233, 0.1)',
                    border: '1px solid rgba(0, 219, 233, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16, color: '#00dbe9',
                  }}>
                    <Icon size={20} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text, #fff)', margin: '0 0 8px' }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--sub, #94a3b8)', lineHeight: 1.6, margin: 0 }}>
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Link
              to="/notes/upload"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #00dbe9, #7a00ff)',
                color: '#fff', padding: '12px 32px', borderRadius: 24,
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(0, 219, 233, 0.25)',
              }}
            >
              <UploadCloud size={18} />
              <span>Upload Notes to Contribute</span>
            </Link>
          </div>
        </div>

      </PageWrapper>
    </>
  );
}
