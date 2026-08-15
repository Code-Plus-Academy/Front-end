'use client';

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { 
  Award, GitPullRequest, CheckCircle2, Star, Sparkles, 
  Users, BookOpen, ExternalLink, ArrowRight, ShieldCheck,
  FileCheck, UploadCloud, MessageSquare, Loader2, UserCheck
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import NoIndex from '../components/seo/NoIndex';
import api from '../api/axios';

const STEPS = [
  {
    step: '01',
    title: 'Upload Notes or Study Material',
    desc: 'Submit lecture notes, PYQs, lab manuals, or cheat sheets in PDF, PNG, or direct URL format.',
    icon: UploadCloud,
  },
  {
    step: '02',
    title: 'Peer Review & Verification',
    desc: 'Campus leads and subject experts review your submission for accuracy, legibility, and copyright safety.',
    icon: FileCheck,
  },
  {
    step: '03',
    title: 'Earn Recognition & Perks',
    desc: 'Your submission gets verified and you can be spotlighted by admins in the Contributor Hall of Fame.',
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

  const totalColleges = new Set(contributorsList.map(c => c.institution).filter(Boolean)).size;
  const totalPRs = contributorsList.reduce((sum, c) => sum + (c.prsMerged || 1), 0);

  return (
    <>
      <Helmet><title>Contributors — Code Plus Academy</title></Helmet>
      <NoIndex />
      <PageWrapper style={{ maxWidth: 1140, paddingLeft: 20, paddingRight: 20 }}>

        {/* ── Hero Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 44, paddingTop: 10 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 99,
            background: 'var(--card, #0a0e14)', border: '1px solid var(--border, rgba(255,255,255,0.08))',
            marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          }}>
            <Sparkles size={14} style={{ color: 'var(--cyan, #00dbe9)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--cyan, #00dbe9)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              // OPEN COMMUNITY • CONTRIBUTOR HALL OF FAME
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display, sans-serif)', fontSize: 'clamp(26px, 5vw, 42px)',
            fontWeight: 800, margin: '0 0 14px', lineHeight: 1.2,
            color: 'var(--text, #fff)',
          }}>
            The Students & Engineers Powering Notes Arena
          </h1>

          <p style={{
            fontFamily: 'var(--font-sans, sans-serif)', fontSize: 'clamp(14px, 2vw, 16px)',
            color: 'var(--sub, #94a3b8)', maxWidth: 740, margin: '0 auto', lineHeight: 1.6,
          }}>
            Recognizing the platform members, campus leads, and class representatives
            spotlighted by the administration for uploading and curating high-yield engineering documentation.
          </p>
        </div>

        {/* ── Dynamic Stats Bar ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16, marginBottom: 48,
        }}>
          {[
            { label: 'Spotlighted Contributors', value: loading ? '...' : `${contributorsList.length}`, icon: Users, color: '#00dbe9' },
            { label: 'Campuses & Colleges', value: loading ? '...' : `${Math.max(totalColleges, contributorsList.length > 0 ? 1 : 0)}`, icon: Award, color: '#7a00ff' },
            { label: 'Verified Contributions', value: loading ? '...' : `${totalPRs}+`, icon: GitPullRequest, color: '#34d399' },
            { label: 'Review Status', value: 'Verified', icon: ShieldCheck, color: '#f59e0b' },
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
              // FEATURED CONTRIBUTORS
            </span>
            <h2 style={{ fontFamily: 'var(--font-display, sans-serif)', fontSize: 26, fontWeight: 800, color: 'var(--text, #fff)', marginTop: 6 }}>
              Admin Selected Contributors
            </h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--sub, #94a3b8)' }}>
              <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: '#00dbe9' }} />
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading selected contributors from database...</p>
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
                Administrators can feature verified campus leads and active note creators directly from the Creator & Admin Dashboard.
              </p>
              <Link
                to="/notes"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'linear-gradient(135deg, #00dbe9, #2563eb)',
                  color: '#fff', padding: '8px 20px', borderRadius: 20,
                  fontSize: 12, fontWeight: 700, textDecoration: 'none',
                }}
              >
                <span>Browse Notes Arena</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {contributorsList.map((c, i) => (
                <div key={c.id || i} style={{
                  background: 'var(--card, #0a0e14)', border: '1px solid var(--border, rgba(255,255,255,0.08))',
                  borderRadius: 20, padding: 22, display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between', transition: 'all 0.25s ease',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }} className="hover:border-cyan-500/50 hover:-translate-y-1">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <img src={c.avatar} alt={c.name} style={{
                        width: 48, height: 48, borderRadius: '50%', objectFit: 'cover',
                        border: `2px solid ${c.color || '#00dbe9'}`,
                        background: '#070a0e', flexShrink: 0,
                      }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3 style={{ fontFamily: 'var(--font-display, sans-serif)', fontSize: 16, fontWeight: 700, color: 'var(--text, #fff)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.name}
                        </h3>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub, #94a3b8)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          @{c.username}
                        </span>
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700,
                        padding: '3px 8px', borderRadius: 99, background: `${c.color || '#00dbe9'}18`,
                        color: c.color || '#00dbe9', border: `1px solid ${c.color || '#00dbe9'}35`,
                        flexShrink: 0,
                      }}>
                        {c.badge || 'Verified'}
                      </span>
                    </div>

                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--text, #fff)', margin: '0 0 4px' }}>
                      {c.role}
                    </p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub, #94a3b8)', margin: 0 }}>
                      🏛️ {c.institution}
                    </p>
                  </div>

                  <div style={{
                    marginTop: 18, paddingTop: 12, borderTop: '1px solid var(--border, rgba(255,255,255,0.06))',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', gap: 10, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--sub, #94a3b8)' }}>
                      <span><strong>{c.prsMerged}</strong> uploads</span>
                      <span><strong>{c.downloads}</strong> downloads</span>
                    </div>
                    <Link to={`/u/${c.username}`} style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                      color: c.color || '#00dbe9', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                      <span>Profile</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 3-Step Contribution Process ── */}
        <div style={{
          background: 'var(--card, #0a0e14)', border: '1px solid var(--border, rgba(255,255,255,0.08))',
          borderRadius: 24, padding: '36px 28px', marginBottom: 56,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--green, #34d399)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              // HOW IT WORKS
            </span>
            <h2 style={{ fontFamily: 'var(--font-display, sans-serif)', fontSize: 24, fontWeight: 800, color: 'var(--text, #fff)', marginTop: 4 }}>
              3 Steps to Becoming a Contributor
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {STEPS.map((s, i) => {
              const IconComp = s.icon;
              return (
                <div key={i} style={{ textAlign: 'center', padding: '0 8px' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, background: 'rgba(0, 219, 233, 0.1)',
                    border: '1px solid rgba(0, 219, 233, 0.3)', margin: '0 auto 12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00dbe9',
                  }}>
                    <IconComp size={22} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub, #94a3b8)', fontWeight: 700 }}>
                    STEP {s.step}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display, sans-serif)', fontSize: 15, fontWeight: 700, color: 'var(--text, #fff)', margin: '4px 0 6px' }}>
                    {s.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--sub, #94a3b8)', lineHeight: 1.5, margin: 0 }}>
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Call to Action ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,219,233,0.1), rgba(122,0,255,0.1))',
          border: '1px solid rgba(0, 219, 233, 0.25)',
          borderRadius: 24, padding: '36px 24px', textAlign: 'center',
          marginBottom: 40,
        }}>
          <h2 style={{ fontFamily: 'var(--font-display, sans-serif)', fontSize: 24, fontWeight: 800, color: 'var(--text, #fff)', margin: '0 0 8px' }}>
            Ready to Represent Your Campus?
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--sub, #94a3b8)', maxWidth: 560, margin: '0 auto 20px', lineHeight: 1.5 }}>
            Upload quality notes, previous year question papers, or exam solutions and get featured on the contributor board.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/notes/new"
              style={{
                background: 'linear-gradient(135deg, #00dbe9, #2563eb)', color: '#fff',
                padding: '10px 24px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <UploadCloud size={16} />
              <span>Submit Study Material</span>
            </Link>
          </div>
        </div>

      </PageWrapper>
    </>
  );
}
