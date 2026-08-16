'use client';

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { 
  Award, Trophy, Sparkles, 
  Users, ArrowRight, ShieldCheck,
  UploadCloud, Loader2, MessageSquare,
  Flame, HeartHandshake, Code2, ThumbsUp, UserPlus,
  ExternalLink, Zap, Star
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import NoIndex from '../components/seo/NoIndex';
import api from '../api/axios';

const POINT_RULES = [
  { action: 'Upload Notes / PYQ', points: '+35 pts', icon: UploadCloud, color: '#00dbe9' },
  { action: 'Solve Doubt / Comment', points: '+15 pts', icon: MessageSquare, color: '#34d399' },
  { action: 'Gain Follower', points: '+10 pts', icon: UserPlus, color: '#c084fc' },
  { action: 'Receive Upvote / Like', points: '+5 pts', icon: ThumbsUp, color: '#f59e0b' },
];

export default function Contributors() {
  const [contributorsList, setContributorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all');

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

  const totalPoints = contributorsList.reduce((sum, c) => sum + (c.points || 0), 0);
  const totalColleges = new Set(contributorsList.map(c => c.institution).filter(Boolean)).size;

  const topThree = contributorsList.slice(0, 3);
  const restContributors = contributorsList.slice(3);

  return (
    <>
      <Helmet><title>Community Leaderboard & Contributor Points — Code Plus Academy</title></Helmet>
      <NoIndex />
      <PageWrapper style={{ maxWidth: 1180, paddingLeft: 20, paddingRight: 20 }}>

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
              // AUTOMATED COMMUNITY LEADERBOARD • LIVE POINTS
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display, sans-serif)', fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 800, margin: '0 0 14px', lineHeight: 1.2,
            color: 'var(--text, #fff)',
          }}>
            Top Community Contributors & Achievers
          </h1>

          <p style={{
            fontFamily: 'var(--font-sans, sans-serif)', fontSize: 'clamp(14px, 2vw, 16.5px)',
            color: 'var(--sub, #94a3b8)', maxWidth: 720, margin: '0 auto 32px', lineHeight: 1.65,
          }}>
            An automated, merit-based leaderboard ranking active student developers based on study materials uploaded,
            doubts solved, and peer engagement.
          </p>

          {/* ── Point Incentive Cards ── */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 14, maxWidth: 920, margin: '0 auto', textAlign: 'left'
          }}>
            {POINT_RULES.map((rule, idx) => {
              const Icon = rule.icon;
              return (
                <div
                  key={idx}
                  style={{
                    background: 'var(--surface, #121214)', border: '1px solid var(--border)',
                    borderRadius: 14, padding: '14px 16px', display: 'flex',
                    alignItems: 'center', gap: 12, transition: 'transform 0.2s ease',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: `${rule.color}18`,
                    border: `1px solid ${rule.color}35`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: rule.color, flexShrink: 0
                  }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                      {rule.action}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: rule.color, marginTop: 2 }}>
                      {rule.points}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Top 3 Podium Showcase ── */}
        {!loading && topThree.length > 0 && (
          <div style={{ marginBottom: 54 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                // TOP SCHOLARS OF THE PLATFORM
              </span>
              <h2 style={{ fontFamily: 'var(--font-display, sans-serif)', fontSize: 24, fontWeight: 800, color: 'var(--text, #fff)', marginTop: 4 }}>
                The Podium • Top 3 Contributors
              </h2>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20, alignItems: 'stretch'
            }}>
              {topThree.map((c, idx) => {
                const isFirst = idx === 0;
                const isSecond = idx === 1;
                const isThird = idx === 2;

                const medalEmoji = isFirst ? '🥇' : isSecond ? '🥈' : '🥉';
                const borderColor = isFirst ? '#f59e0b' : isSecond ? '#38bdf8' : '#fb923c';
                const glowColor = isFirst ? 'rgba(245, 158, 11, 0.15)' : isSecond ? 'rgba(56, 189, 248, 0.15)' : 'rgba(251, 146, 60, 0.15)';

                return (
                  <div
                    key={c.id || idx}
                    style={{
                      background: 'var(--surface, #121214)',
                      border: `2px solid ${borderColor}`,
                      borderRadius: 20,
                      padding: '28px 22px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      boxShadow: `0 12px 30px ${glowColor}`,
                      transform: isFirst ? 'scale(1.02)' : 'none',
                    }}
                  >
                    {/* Rank Badge */}
                    <div style={{
                      position: 'absolute', top: 16, right: 16,
                      fontSize: 24
                    }}>
                      {medalEmoji}
                    </div>

                    <div>
                      {/* Avatar & Monogram */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                        {c.avatar ? (
                          <img
                            src={c.avatar}
                            alt={c.name}
                            style={{
                              width: 58, height: 58, borderRadius: '50%',
                              objectFit: 'cover', border: `3px solid ${borderColor}`
                            }}
                          />
                        ) : (
                          <div style={{
                            width: 58, height: 58, borderRadius: '50%',
                            background: `linear-gradient(135deg, ${borderColor}30, #000)`,
                            border: `3px solid ${borderColor}`, color: borderColor,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20
                          }}>
                            {c.name ? c.name[0].toUpperCase() : 'U'}
                          </div>
                        )}

                        <div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>
                            {c.name}
                          </div>
                          <Link to={`/u/${c.username}`} style={{ fontSize: 12, color: 'var(--sub)', textDecoration: 'none' }}>
                            @{c.username}
                          </Link>
                          <div style={{ marginTop: 4 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px',
                              borderRadius: 6, background: `${borderColor}20`, color: borderColor,
                              textTransform: 'uppercase'
                            }}>
                              {c.badge}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* College */}
                      <div style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>🎓</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.institution}
                        </span>
                      </div>

                      {/* Points Card */}
                      <div style={{
                        background: 'var(--card, #0a0e14)', border: '1px solid var(--border)',
                        borderRadius: 14, padding: '12px 16px', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center', marginBottom: 16
                      }}>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--sub)', fontWeight: 700, textTransform: 'uppercase' }}>
                            Total Score
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 900, color: borderColor }}>
                            {c.points} <span style={{ fontSize: 12 }}>PTS</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--sub)' }}>
                          <div>{c.postsCount} resources</div>
                          <div>{c.commentsCount} comments</div>
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/u/${c.username}`}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '10px', borderRadius: 10, background: 'var(--s2)',
                        border: '1px solid var(--border)', color: 'var(--text)',
                        fontSize: 12.5, fontWeight: 600, textDecoration: 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span>View Full Profile</span>
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Complete Leaderboard Grid ── */}
        <div style={{ marginBottom: 64 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 14, marginBottom: 24, paddingBottom: 12,
            borderBottom: '1px solid var(--border)'
          }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                All Platform Contributors ({contributorsList.length})
              </h2>
              <p style={{ fontSize: 13, color: 'var(--sub)', margin: '4px 0 0' }}>
                Ranked dynamically by active contributions and peer impact
              </p>
            </div>

            <Link
              to="/notes/upload"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 18px', borderRadius: 10, background: 'var(--green, #00b4d8)',
                color: '#000', fontSize: 13, fontWeight: 700, textDecoration: 'none'
              }}
            >
              <UploadCloud size={16} />
              <span>Earn Points (Upload)</span>
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--sub)' }}>
              <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: '#00dbe9' }} />
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>Calculating real-time user points...</p>
            </div>
          ) : contributorsList.length === 0 ? (
            <div style={{
              background: 'var(--surface)', border: '1px dashed var(--border)',
              borderRadius: 16, padding: '40px 20px', textAlign: 'center'
            }}>
              <p style={{ color: 'var(--sub)', fontSize: 14 }}>No contributor scores recorded yet. Be the first to earn points!</p>
            </div>
          ) : (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: 16
            }}>
              {contributorsList.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between', transition: 'all 0.2s ease',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 180, 216, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800,
                          padding: '2px 8px', borderRadius: 6, background: 'var(--s2)',
                          color: c.rank <= 3 ? 'var(--green)' : 'var(--sub)'
                        }}>
                          #{c.rank}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px',
                          borderRadius: 6, background: 'rgba(0, 180, 216, 0.1)', color: '#00b4d8',
                          textTransform: 'uppercase'
                        }}>
                          {c.tier}
                        </span>
                      </div>

                      <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--green, #00b4d8)' }}>
                        {c.points} <span style={{ fontSize: 10, color: 'var(--sub)' }}>PTS</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      {c.avatar ? (
                        <img
                          src={c.avatar}
                          alt={c.name}
                          style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: 42, height: 42, borderRadius: '50%',
                          background: 'var(--s2)', color: 'var(--green)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 15
                        }}>
                          {c.name ? c.name[0].toUpperCase() : 'U'}
                        </div>
                      )}

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.name}
                        </div>
                        <Link to={`/u/${c.username}`} style={{ fontSize: 11.5, color: 'var(--sub)', textDecoration: 'none' }}>
                          @{c.username}
                        </Link>
                      </div>
                    </div>

                    <div style={{ fontSize: 11.5, color: 'var(--sub)', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      🎓 {c.institution}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderTop: '1px solid var(--border)', paddingTop: 10, fontSize: 11, color: 'var(--sub)'
                  }}>
                    <span>{c.postsCount} resources</span>
                    <span>{c.commentsCount} doubts solved</span>
                    <Link to={`/u/${c.username}`} style={{ color: 'var(--green)', textDecoration: 'none', fontWeight: 600 }}>
                      Profile &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </PageWrapper>
    </>
  );
}
