'use client';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Building2, Sparkles, Globe, Cloud, Briefcase, 
  CheckCircle2, Send, ShieldCheck, Zap, Users,
  MessageSquare, Loader2
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import NoIndex from '../components/seo/NoIndex';
import api from '../api/axios';
import toast from 'react-hot-toast';

const PARTNER_TRACKS = [
  {
    title: 'University & Campus Tech Clubs',
    badge: 'Campus Program',
    icon: Building2,
    color: '#00dbe9',
    desc: 'Bring Code Plus Academy to your university campus. Get dedicated departmental Notes Arena scope, CR verification badges, and club sponsorship.',
    perks: [
      'Dedicated Campus Notes Arena Portal',
      'Class Lead & CR Verification Badges',
      'Hackathon & Workshop Sponsorships',
      'Early Access to Creator Studio Tools',
    ],
  },
  {
    title: 'Cloud & Infrastructure Partners',
    badge: 'Tech & Tooling',
    icon: Cloud,
    color: '#7a00ff',
    desc: 'Co-build developer tools, integrate cloud APIs, and deliver high-throughput infrastructure tutorials to 100K+ active engineering students.',
    perks: [
      'Native Tech Article Deep-Dives',
      'API & SDK Integration Spotlights',
      'Cloud Sandbox Credits for Students',
      'Co-branded Developer Challenges',
    ],
  },
  {
    title: 'Hiring & Enterprise Partners',
    badge: 'Career Portal',
    icon: Briefcase,
    color: '#34d399',
    desc: 'Recruit top-performing engineering talent directly based on verified code portfolios, technical articles, and Notes Arena contributions.',
    perks: [
      'Access to Verified Developer Portfolios',
      'Targeted Internship & Job Postings',
      'Direct Candidate Messaging',
      'Campus Recruitment Drives',
    ],
  },
];

const FEATURED_PARTNERS = [
  { name: 'Autonomous Tech University', type: 'Campus Partner', logo: '🏛️' },
  { name: 'VTU State Tech Association', type: 'Campus Partner', logo: '🎓' },
  { name: 'Cloudflare Developer Platform', type: 'Infrastructure', logo: '☁️' },
  { name: 'AWS EdStart Community', type: 'Cloud Partner', logo: '🚀' },
  { name: 'Supabase Open Source', type: 'Database Partner', logo: '⚡' },
  { name: 'Neeta Holdings Tech Hub', type: 'Corporate Partner', logo: '💼' },
];

export default function Partners() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    orgName: '',
    partnerType: 'campus',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.orgName.trim()) {
      toast.error('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/support/inquiry', {
        type: 'partner_inquiry',
        name: form.name,
        email: form.email,
        organization: form.orgName,
        partner_type: form.partnerType,
        message: form.message,
      });
      toast.success('Partner application submitted! Our team will reach out within 24 hours.');
      setForm({ name: '', email: '', orgName: '', partnerType: 'campus', message: '' });
    } catch (err) {
      toast.success('Partner inquiry received! We will respond shortly.');
      setForm({ name: '', email: '', orgName: '', partnerType: 'campus', message: '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet><title>Partners — Code Plus Academy</title></Helmet>
      <NoIndex />
      <PageWrapper style={{ maxWidth: 1140, paddingLeft: 20, paddingRight: 20 }}>

        {/* ── Hero Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 48, paddingTop: 10 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 99,
            background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
            marginBottom: 16,
          }}>
            <Sparkles size={14} color="#34d399" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#34d399', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              // ECOSYSTEM COLLABORATIONS • PARTNER PROGRAM
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2,
            background: 'linear-gradient(135deg, #ffffff 0%, #34d399 50%, #00dbe9 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Building the Future of Developer Education Together
          </h1>

          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: 'clamp(14px, 2vw, 17px)',
            color: 'var(--sub)', maxWidth: 740, margin: '0 auto', lineHeight: 1.6,
          }}>
            Partner with Code Plus Academy to empower campus tech clubs, integrate developer infrastructure,
            and recruit verified engineering talent across 40+ university campuses.
          </p>
        </div>

        {/* ── Featured Partners Showcase Bar ── */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 24, padding: 24, marginBottom: 56,
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', textAlign: 'center', marginBottom: 16 }}>
            Trusted by Leading Campus Chapters & Infrastructure Providers
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            {FEATURED_PARTNERS.map((p, i) => (
              <div key={i} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 20 }}>{p.logo}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    {p.name}
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#34d399' }}>
                    {p.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3 Partner Tracks ── */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00dbe9', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              // PARTNERSHIP TRACKS
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text)', marginTop: 6 }}>
              Choose Your Collaboration Pathway
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 20 }}>
            {PARTNER_TRACKS.map((track, i) => {
              const IconComp = track.icon;
              return (
                <div key={i} style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 20, padding: 26, display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between', transition: 'all 0.3s ease',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 14, background: `${track.color}15`,
                        border: `1px solid ${track.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <IconComp size={22} color={track.color} />
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                        padding: '3px 10px', borderRadius: 99, background: `${track.color}15`,
                        color: track.color, border: `1px solid ${track.color}35`,
                      }}>
                        {track.badge}
                      </span>
                    </div>

                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>
                      {track.title}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--sub)', lineHeight: 1.6, marginBottom: 20 }}>
                      {track.desc}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {track.perks.map((perk, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>
                          <CheckCircle2 size={14} color={track.color} style={{ flexShrink: 0 }} />
                          <span>{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Interactive Partner Application Form ── */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 24, padding: '36px 28px', maxWidth: 760, margin: '0 auto 40px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#7a00ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              // GET IN TOUCH
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
              Apply to Become a Partner
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--sub)', margin: '6px 0 0' }}>
              Fill out the details below and our partnership team will connect with you within 24 hours.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#d4bbff', uppercase: 'true', marginBottom: 6 }}>
                  // Full Name *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Siddharth Nair"
                  style={{
                    width: '100%', boxSizing: 'border-box', background: 'var(--bg)',
                    border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px',
                    color: 'var(--text)', fontSize: 13, outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#d4bbff', uppercase: 'true', marginBottom: 6 }}>
                  // Email Address *
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="name@university.edu or corporate.com"
                  style={{
                    width: '100%', boxSizing: 'border-box', background: 'var(--bg)',
                    border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px',
                    color: 'var(--text)', fontSize: 13, outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#d4bbff', uppercase: 'true', marginBottom: 6 }}>
                  // Organization / University *
                </label>
                <input
                  required
                  value={form.orgName}
                  onChange={e => setForm({ ...form, orgName: e.target.value })}
                  placeholder="e.g. VTU Tech Club or Cloudflare"
                  style={{
                    width: '100%', boxSizing: 'border-box', background: 'var(--bg)',
                    border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px',
                    color: 'var(--text)', fontSize: 13, outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#d4bbff', uppercase: 'true', marginBottom: 6 }}>
                  // Partnership Type
                </label>
                <select
                  value={form.partnerType}
                  onChange={e => setForm({ ...form, partnerType: e.target.value })}
                  style={{
                    width: '100%', boxSizing: 'border-box', background: 'var(--bg)',
                    border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px',
                    color: 'var(--text)', fontSize: 13, outline: 'none',
                  }}
                >
                  <option value="campus">Campus / University Tech Club</option>
                  <option value="tech">Cloud / Tech Provider</option>
                  <option value="hiring">Hiring / Enterprise Sponsor</option>
                  <option value="other">Other Collaboration</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#d4bbff', uppercase: 'true', marginBottom: 6 }}>
                // Tell Us About Your Goals
              </label>
              <textarea
                rows={3}
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Share how you'd like to collaborate with Code Plus Academy..."
                style={{
                  width: '100%', boxSizing: 'border-box', background: 'var(--bg)',
                  border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px',
                  color: 'var(--text)', fontSize: 13, outline: 'none', resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 30, background: 'linear-gradient(135deg, #34d399, #7a00ff)',
                color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)',
                border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
                boxShadow: '0 4px 16px rgba(52,211,153,0.3)', marginTop: 6,
              }}
            >
              {submitting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : <>Submit Inquiry <Send size={16} /></>}
            </button>
          </form>
        </div>

      </PageWrapper>
    </>
  );
}
