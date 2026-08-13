'use client';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { 
  Award, GitPullRequest, CheckCircle2, Star, Sparkles, 
  Users, BookOpen, ExternalLink, ArrowRight, ShieldCheck,
  FileCheck, UploadCloud, MessageSquare
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import NoIndex from '../components/seo/NoIndex';
import api from '../api/axios';

const FEATURED_CONTRIBUTORS = [
  {
    name: 'Aarav Mehta',
    username: 'aarav_mehta',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    role: 'Class Representative & GATE CS Lead',
    institution: 'VTU / Autonomous Tech Institute',
    prsMerged: 142,
    downloads: '42.1K',
    rating: 4.9,
    badge: 'Top Reviewer',
    color: '#00dbe9',
  },
  {
    name: 'Ananya Gupta',
    username: 'ananya_code',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    role: 'Senior Campus Lead & AI/ML Contributor',
    institution: 'Anna University / Autonomous',
    prsMerged: 98,
    downloads: '38.9K',
    rating: 5.0,
    badge: 'Gold Contributor',
    color: '#7a00ff',
  },
  {
    name: 'Vikram Joshi',
    username: 'vikram_j',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200',
    role: 'Lab Assistant Contributor & Systems Lead',
    institution: 'Mumbai University / SPPU',
    prsMerged: 84,
    downloads: '29.4K',
    rating: 4.8,
    badge: 'Lab Specialist',
    color: '#34d399',
  },
  {
    name: 'Siddharth Nair',
    username: 'sid_nair',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    role: 'Distributed Systems & OS Contributor',
    institution: 'BITS Pilani / Autonomous',
    prsMerged: 67,
    downloads: '22.4K',
    rating: 4.9,
    badge: 'Subject Expert',
    color: '#f59e0b',
  },
  {
    name: 'Riya Sharma',
    username: 'riya_dev',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    role: 'Web Dev & Flutter Lead',
    institution: 'JNTU Hyderabad',
    prsMerged: 53,
    downloads: '18.7K',
    rating: 4.9,
    badge: 'Campus Ambassador',
    color: '#ec4899',
  },
  {
    name: 'Rohan Verma',
    username: 'rohan_v',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=200',
    role: 'Data Structures & Algorithms Contributor',
    institution: 'DTU Delhi',
    prsMerged: 49,
    downloads: '15.2K',
    rating: 4.8,
    badge: 'Verified PR Author',
    color: '#6366f1',
  },
];

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
    desc: 'Your submission gets tagged with the PR Verified badge, boosted on Notes Arena, and earns contributor perks.',
    icon: Award,
  },
];

export default function Contributors() {
  const [contributorsList, setContributorsList] = useState(FEATURED_CONTRIBUTORS);

  useEffect(() => {
    let isMounted = true;
    api.get('/stats/contributors')
      .then((res) => {
        if (isMounted && res.data?.contributors && res.data.contributors.length > 0) {
          setContributorsList(res.data.contributors);
        }
      })
      .catch((err) => {
        console.warn('Contributors fetch warning:', err.message);
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <>
      <Helmet><title>Contributors — Code Plus Academy</title></Helmet>
      <NoIndex />
      <PageWrapper style={{ maxWidth: 1140, paddingLeft: 20, paddingRight: 20 }}>

        {/* ── Hero Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 48, paddingTop: 10 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 99,
            background: 'var(--card)', border: '1px solid var(--border)',
            marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          }}>
            <Sparkles size={14} style={{ color: 'var(--cyan, #0284c7)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--cyan, #0284c7)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              // OPEN COMMUNITY • CONTRIBUTOR HALL OF FAME
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2,
            color: 'var(--text)',
          }}>
            The Students & Engineers Powering Notes Arena
          </h1>

          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: 'clamp(14px, 2vw, 17px)',
            color: 'var(--sub)', maxWidth: 740, margin: '0 auto', lineHeight: 1.6,
          }}>
            Recognizing the dedicated campus leads, class representatives, and open-source contributors
            who peer-review, curate, and upload high-quality study materials daily.
          </p>
        </div>

        {/* ── Stats Bar ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16, marginBottom: 56,
        }}>
          {[
            { label: 'Verified PRs Merged', value: '1,240+', icon: GitPullRequest, color: '#34d399' },
            { label: 'Campus Leads', value: '85+', icon: Users, color: '#7a00ff' },
            { label: 'Verification Rate', value: '99.4%', icon: ShieldCheck, color: '#00dbe9' },
            { label: 'Average Rating', value: '4.9 ★', icon: Star, color: '#f59e0b' },
          ].map((s, i) => {
            const IconComp = s.icon;
            return (
              <div key={i} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 20, padding: 20, textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: `${s.color}15`,
                  border: `1px solid ${s.color}35`, margin: '0 auto 10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <IconComp size={18} color={s.color} />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>
                  {s.value}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub)', textTransform: 'uppercase', marginTop: 4 }}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Top Contributors Showcase Grid ── */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#7a00ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              // FEATURED CONTRIBUTORS
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text)', marginTop: 6 }}>
              Top Campus Leads & Reviewers
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {contributorsList.map((c, i) => (
              <div key={i} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between', transition: 'all 0.3s ease',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <img src={c.avatar} alt={c.name} style={{
                      width: 52, height: 52, borderRadius: '50%', objectFit: 'cover',
                      border: `2px solid ${c.color}`,
                    }} />
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                        {c.name}
                      </h3>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--sub)' }}>
                        @{c.username}
                      </span>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                      padding: '3px 8px', borderRadius: 99, background: `${c.color}15`,
                      color: c.color, border: `1px solid ${c.color}35`, marginLeft: 'auto',
                    }}>
                      {c.badge}
                    </span>
                  </div>

                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 4px' }}>
                    {c.role}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub)', margin: 0 }}>
                    🏛️ {c.institution}
                  </p>
                </div>

                <div style={{
                  marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--sub)' }}>
                    <span><strong>{c.prsMerged}</strong> PRs</span>
                    <span><strong>{c.downloads}</strong> downloads</span>
                  </div>
                  <Link to={`/u/${c.username}`} style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                    color: c.color, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    Profile <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3-Step Contribution Guide ── */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 24, padding: '36px 28px', marginBottom: 56,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              // HOW TO CONTRIBUTE
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text)', marginTop: 6 }}>
              Become a Verified Notes Contributor in 3 Steps
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
            {STEPS.map((s, i) => {
              const IconComp = s.icon;
              return (
                <div key={i} style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 18, padding: 22, position: 'relative',
                }}>
                  <span style={{
                    position: 'absolute', top: 16, right: 18,
                    fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800,
                    color: 'var(--dim)', opacity: 0.5,
                  }}>
                    {s.step}
                  </span>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: 'rgba(52,211,153,0.12)',
                    border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 14,
                  }}>
                    <IconComp size={20} color="#34d399" />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
                    {s.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--sub)', lineHeight: 1.5, margin: 0 }}>
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 24, padding: 32, textAlign: 'center', display: 'flex',
          flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 40,
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            Have Notes or Study Materials to Share?
          </h3>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--sub)', maxWidth: 500, margin: 0 }}>
            Help fellow students pass exams and master computer science core concepts.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/notes" style={{
              padding: '10px 24px', borderRadius: 30, background: 'linear-gradient(135deg, #00dbe9, #7a00ff)',
              color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)', textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(0,219,233,0.3)',
            }}>
              Upload Notes to Arena
            </Link>
            <a href="https://discord.gg/J3bRCDTBc" target="_blank" rel="noopener noreferrer" style={{
              padding: '10px 24px', borderRadius: 30, background: 'transparent',
              border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--font-sans)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <MessageSquare size={14} /> Join Contributor Discord
            </a>
          </div>
        </div>

      </PageWrapper>
    </>
  );
}
