'use client';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { 
  Users, Sparkles, BookOpen, Video, FileText, Code2, 
  ShieldCheck, Globe, Zap, Cpu, ArrowRight, CheckCircle2,
  Terminal, Layers, Award
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import NoIndex from '../components/seo/NoIndex';

const METRICS = [
  { label: 'Active Developers', value: '100,000+', change: '+24% YoY', icon: Users, color: '#00dbe9' },
  { label: 'Campus Chapters', value: '40+', change: 'Across India', icon: Globe, color: '#7a00ff' },
  { label: 'Verified Resources', value: '15,000+', change: '8 Formats', icon: BookOpen, color: '#34d399' },
  { label: 'Code Snippets Shared', value: '5.2M+', change: 'Zero Noise', icon: Code2, color: '#f59e0b' },
];

const PILLARS = [
  {
    icon: BookOpen,
    color: '#00dbe9',
    badge: 'Notes Arena',
    title: 'Structured Academic Library',
    desc: 'Peer-reviewed lecture notes, PYQs, lab manuals, and cheat sheets categorized across 8 resource formats and university department hierarchies.',
    href: '/notes',
  },
  {
    icon: Video,
    color: '#7a00ff',
    badge: 'Creator Studio',
    title: 'Studio Command Center',
    desc: 'A YouTube Studio-style control center for creators to upload long-form videos, Shorts, track HLS transcoding jobs, and manage channel analytics.',
    href: '/creator',
    external: false,
  },
  {
    icon: FileText,
    color: '#34d399',
    badge: '11 Article Types',
    title: 'Native Technical Publishing',
    desc: 'Express-rich technical writing framework supporting code syntax highlighting, architecture diagrams, benchmark comparisons, and system designs.',
    href: '/explore',
  },
  {
    icon: Globe,
    color: '#f59e0b',
    badge: 'Social Feed',
    title: 'Global Developer Network',
    desc: 'High-signal activity feeds, direct messaging, code reviews, and career opportunities connecting students and engineering professionals.',
    href: '/feed',
  },
];

const VALUES = [
  { title: 'Code First', desc: 'No fluff, clickbait, or superficial posts. Every piece of content earns its place with real code, benchmarks, or verified study materials.' },
  { title: 'Community Owned', desc: 'Notes and resources are contributed and peer-verified by top campus leads and students, creating open access for everyone.' },
  { title: 'Blazing Fast & Accessible', desc: 'Engineered for performance with modern web stacks, minimal friction, dark theme support, and responsive layouts across all devices.' },
];

export default function AboutUs() {
  return (
    <>
      <Helmet><title>About Us — FocusGram</title></Helmet>
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
            <Sparkles size={14} style={{ color: 'var(--purple, #7a00ff)' }} aria-hidden="true" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--purple, #7a00ff)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              // WHO WE ARE • FOCUSGRAM (POWERED BY CODE PLUS ACADEMY)
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2,
            color: 'var(--text)',
          }}>
            Where Developers Ship, Share & Scale Together
          </h1>

          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: 'clamp(14px, 2vw, 17px)',
            color: 'var(--sub)', maxWidth: 740, margin: '0 auto', lineHeight: 1.6,
          }}>
            FocusGram (powered by Code Plus Academy) is the unified platform for engineering students and software developers.
            We combine high-signal social feeds, structured academic study notes, native technical publishing,
            and dedicated creator tools into one seamless ecosystem.
          </p>
        </div>

        {/* ── Key Metrics Grid ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16, marginBottom: 56,
        }}>
          {METRICS.map((m, i) => {
            const IconComp = m.icon;
            return (
              <div key={i} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 20, padding: 22, display: 'flex', flexDirection: 'column', gap: 10,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)', transition: 'transform 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12, background: `${m.color}15`,
                    border: `1px solid ${m.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IconComp size={20} color={m.color} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: m.color, fontWeight: 700 }}>
                    {m.change}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>
                  {m.value}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {m.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Platform 4 Pillars ── */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-brand-teal, #0284c7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              // CORE PLATFORM PILLARS
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text)', marginTop: 6 }}>
              Four Tools. One Seamless Ecosystem.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {PILLARS.map((p, i) => {
              const IconComp = p.icon;
              return (
                <div key={i} style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between', transition: 'all 0.3s ease',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 14, background: `${p.color}15`,
                        border: `1px solid ${p.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <IconComp size={22} color={p.color} aria-hidden="true" />
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                        padding: '3px 10px', borderRadius: 99, background: `${p.color}18`,
                        color: p.color, border: `1px solid ${p.color}30`,
                      }}>
                        {p.badge}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
                      {p.title}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--sub)', lineHeight: 1.6, margin: 0 }}>
                      {p.desc}
                    </p>
                  </div>

                  <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                    {p.external ? (
                      <a href={p.href} target="_blank" rel="noopener noreferrer" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                        color: p.color, textDecoration: 'none',
                      }}>
                        Explore Tool <ArrowRight size={14} aria-hidden="true" />
                      </a>
                    ) : (
                      <Link to={p.href} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                        color: p.color, textDecoration: 'none',
                      }}>
                        Explore Feature <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Mission Statement & Values ── */}
        <div style={{
          background: 'radial-gradient(circle at top right, rgba(122,0,255,0.15) 0%, rgba(7,10,14,0.95) 70%)',
          border: '1px solid rgba(122,0,255,0.25)', borderRadius: 24, padding: '36px 28px',
          marginBottom: 56,
        }}>
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d4bbff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              // OUR MISSION
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: '#fff', margin: '8px 0 16px' }}>
              Built by Engineers, For Engineers
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#d4cce3', lineHeight: 1.7, marginBottom: 28 }}>
              We started FocusGram (powered by Code Plus Academy) because existing developer platforms were fragmented — social feeds lacked technical depth, course platforms were paywalled, and university study materials were scattered across WhatsApp groups and Google Drives. We built FocusGram to unite these workflows into a high-performance platform.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, textAlign: 'left' }}>
              {VALUES.map((v, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <CheckCircle2 size={16} color="#34d399" aria-hidden="true" />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#fff' }}>{v.title}</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#9a92a7', margin: 0, lineHeight: 1.5 }}>
                    {v.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom CTA Banner ── */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 24, padding: 32, textAlign: 'center', display: 'flex',
          flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 40,
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            Ready to Join the FocusGram Developer Network?
          </h3>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--sub)', maxWidth: 500, margin: 0 }}>
            Explore academic notes, write technical articles, publish videos, or connect with 100K+ developers worldwide.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/register" style={{
              padding: '10px 24px', borderRadius: 30, background: 'linear-gradient(135deg, #7a00ff, #00dbe9)',
              color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)', textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(122,0,255,0.3)',
            }}>
              Get Started Free
            </Link>
            <Link to="/explore" style={{
              padding: '10px 24px', borderRadius: 30, background: 'transparent',
              border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--font-sans)', textDecoration: 'none',
            }}>
              Explore Platform
            </Link>
          </div>
        </div>

      </PageWrapper>
    </>
  );
}
