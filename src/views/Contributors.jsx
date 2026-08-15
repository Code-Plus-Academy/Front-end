'use client';

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { 
  Award, GitPullRequest, CheckCircle2, Star, Sparkles, 
  Users, BookOpen, ExternalLink, ArrowRight, ShieldCheck,
  FileCheck, UploadCloud, MessageSquare, Loader2, UserCheck,
  Plus, Trash2, Edit3, Search, X, Shield, RefreshCw
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import NoIndex from '../components/seo/NoIndex';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

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

const BADGE_PRESETS = [
  'Top Reviewer',
  'Gold Contributor',
  'Campus Ambassador',
  'Verified PR Author',
  'Subject Expert',
  'Senior Campus Lead',
  'Lab Specialist',
  'Class Representative',
];

export default function Contributors() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.account_type === 'professional');

  const [contributorsList, setContributorsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin In-Page Management States
  const [showAdminManager, setShowAdminManager] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingAdminUsers, setLoadingAdminUsers] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  
  // Modal / Inline Edit states
  const [selectedUserToFeature, setSelectedUserToFeature] = useState(null);
  const [roleTitle, setRoleTitle] = useState('');
  const [badge, setBadge] = useState('Top Reviewer');
  const [savingFeature, setSavingFeature] = useState(false);

  const fetchContributors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/stats/contributors');
      setContributorsList(res.data?.contributors || []);
    } catch (err) {
      console.warn('Contributors fetch warning:', err.message);
      setContributorsList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUsers = async (query = '') => {
    if (!isAdmin) return;
    setLoadingAdminUsers(true);
    try {
      const res = await api.get('/admin/contributors', { params: { q: query || undefined } });
      setAdminUsers(res.data?.contributors || res.data?.users || []);
    } catch (err) {
      toast.error('Failed to load registered platform users');
    } finally {
      setLoadingAdminUsers(false);
    }
  };

  useEffect(() => {
    fetchContributors();
  }, []);

  useEffect(() => {
    if (showAdminManager) {
      fetchAdminUsers(adminSearch);
    }
  }, [showAdminManager, adminSearch]);

  const handleFeatureSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedUserToFeature) return;
    setSavingFeature(true);
    try {
      await api.post('/admin/contributors/feature', {
        user_id: selectedUserToFeature.id,
        role_title: roleTitle.trim() || 'Senior Campus Lead',
        badge: badge || 'Top Reviewer',
      });
      toast.success(`Featured @${selectedUserToFeature.username} on /contributors!`);
      setSelectedUserToFeature(null);
      setRoleTitle('');
      await fetchContributors();
      if (showAdminManager) await fetchAdminUsers(adminSearch);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to feature contributor');
    } finally {
      setSavingFeature(false);
    }
  };

  const handleUnfeature = async (userId, username) => {
    if (!window.confirm(`Remove @${username} from the Featured Contributors Hall of Fame?`)) {
      return;
    }
    try {
      await api.delete(`/admin/contributors/feature/${userId}`);
      toast.success(`Removed @${username} from featured contributors`);
      await fetchContributors();
      if (showAdminManager) await fetchAdminUsers(adminSearch);
    } catch (err) {
      toast.error('Failed to remove contributor');
    }
  };

  const totalColleges = new Set(contributorsList.map(c => c.institution).filter(Boolean)).size;
  const totalPRs = contributorsList.reduce((sum, c) => sum + (c.prsMerged || 1), 0);

  return (
    <>
      <Helmet><title>Contributors — Code Plus Academy</title></Helmet>
      <NoIndex />
      <PageWrapper style={{ maxWidth: 1140, paddingLeft: 20, paddingRight: 20 }}>

        {/* ── Admin Management Banner (Visible to Admin/Professional) ── */}
        {isAdmin && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,219,233,0.12), rgba(122,0,255,0.15))',
            border: '1px solid rgba(0, 219, 233, 0.4)',
            borderRadius: 16,
            padding: '14px 18px',
            marginBottom: 28,
            boxShadow: '0 4px 20px rgba(0, 219, 233, 0.15)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={18} color="#00dbe9" />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    Admin Controls Active
                    <span style={{ fontSize: 10, background: '#00dbe9', color: '#070a0e', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                      ADMIN
                    </span>
                  </span>
                  <p style={{ margin: 0, fontSize: 11.5, color: '#94a3b8' }}>
                    You can add, edit badges, or remove any platform member from this page.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAdminManager(!showAdminManager)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 16px', borderRadius: 20,
                    background: showAdminManager ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #00dbe9, #2563eb)',
                    border: 'none', color: '#fff', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', boxShadow: showAdminManager ? 'none' : '0 2px 10px rgba(0, 219, 233, 0.3)',
                  }}
                >
                  {showAdminManager ? (
                    <>
                      <X size={14} />
                      <span>Close Contributor Manager</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>+ Add / Feature Contributor</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── Expandable Admin Contributor Management Drawer ── */}
            {showAdminManager && (
              <div style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 460 }}>
                    <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: 10 }} />
                    <input
                      value={adminSearch}
                      onChange={e => setAdminSearch(e.target.value)}
                      placeholder="Search users by name, @username, or college..."
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '7px 10px 7px 30px',
                        borderRadius: 8, background: '#070a0e', border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff', fontSize: 12, outline: 'none',
                      }}
                    />
                  </div>

                  <span style={{ fontSize: 11, color: '#00dbe9', fontFamily: 'monospace' }}>
                    {adminUsers.length} total platform users loaded
                  </span>
                </div>

                {loadingAdminUsers ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                    <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 6px', color: '#00dbe9' }} />
                    <span style={{ fontSize: 12 }}>Loading platform users...</span>
                  </div>
                ) : (
                  <div style={{
                    maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6,
                    paddingRight: 4,
                  }}>
                    {adminUsers.map(u => (
                      <div key={u.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', borderRadius: 8,
                        background: u.is_featured ? 'rgba(0, 219, 233, 0.08)' : 'rgba(0, 0, 0, 0.25)',
                        border: `1px solid ${u.is_featured ? 'rgba(0, 219, 233, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
                        gap: 10,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <img
                            src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                            alt={u.username}
                            width={32}
                            height={32}
                            style={{ borderRadius: '50%', border: u.is_featured ? '2px solid #00dbe9' : '1px solid #334155' }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className="truncate">{u.name || u.username}</span>
                              {u.is_featured && (
                                <span style={{ fontSize: 9, background: 'rgba(0,219,233,0.2)', color: '#00dbe9', border: '1px solid rgba(0,219,233,0.4)', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                                  ★ FEATURED
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
                              @{u.username} · {u.college_name || 'No College'} · {u.posts_count || 0} uploads
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          {u.is_featured ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUserToFeature(u);
                                  setRoleTitle(u.role_title || u.role || 'Senior Campus Lead');
                                  setBadge(u.badge || 'Top Reviewer');
                                }}
                                style={{
                                  padding: '4px 10px', borderRadius: 6,
                                  background: 'rgba(0, 219, 233, 0.12)', border: '1px solid rgba(0, 219, 233, 0.3)',
                                  color: '#00dbe9', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                }}
                              >
                                Edit Badge
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUnfeature(u.id, u.username)}
                                style={{
                                  padding: '4px 10px', borderRadius: 6,
                                  background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#f87171', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                }}
                              >
                                Remove
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserToFeature(u);
                                setRoleTitle(u.role || 'Senior Campus Lead');
                                setBadge('Top Reviewer');
                              }}
                              style={{
                                padding: '4px 12px', borderRadius: 6,
                                background: 'linear-gradient(135deg, #00dbe9, #2563eb)', border: 'none',
                                color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                              }}
                            >
                              + Feature
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Feature / Edit Dialog Overlay ── */}
        {selectedUserToFeature && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 16,
          }}>
            <div style={{
              background: '#0a0e14', border: '1px solid rgba(0, 219, 233, 0.4)', borderRadius: 18,
              padding: '22px 26px', maxWidth: 460, width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={18} color="#00dbe9" />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>
                    {selectedUserToFeature.is_featured ? 'Edit Contributor Profile' : 'Feature User as Contributor'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUserToFeature(null)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* User snapshot */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16,
              }}>
                <img
                  src={selectedUserToFeature.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedUserToFeature.username}`}
                  alt={selectedUserToFeature.username}
                  width={38}
                  height={38}
                  style={{ borderRadius: '50%', border: '2px solid #00dbe9' }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                    {selectedUserToFeature.name || selectedUserToFeature.username}
                  </div>
                  <div style={{ fontSize: 11, color: '#00dbe9', fontFamily: 'monospace' }}>
                    @{selectedUserToFeature.username} · {selectedUserToFeature.college_name || 'Autonomous Tech Institute'}
                  </div>
                </div>
              </div>

              <form onSubmit={handleFeatureSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#00dbe9', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'monospace' }}>
                    Role / Subtitle
                  </label>
                  <input
                    value={roleTitle}
                    onChange={e => setRoleTitle(e.target.value)}
                    placeholder="e.g. Senior Campus Lead & AI/ML Contributor"
                    required
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8,
                      background: '#070a0e', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#00dbe9', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'monospace' }}>
                    Hall of Fame Badge
                  </label>
                  <select
                    value={badge}
                    onChange={e => setBadge(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8,
                      background: '#070a0e', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, outline: 'none',
                    }}
                  >
                    {BADGE_PRESETS.map(b => (
                      <option key={b} value={b} style={{ background: '#0a0e14', color: '#fff' }}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedUserToFeature(null)}
                    style={{
                      padding: '7px 14px', borderRadius: 8, background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingFeature}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 18px', borderRadius: 8,
                      background: 'linear-gradient(135deg, #00dbe9, #2563eb)',
                      border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 700,
                      cursor: savingFeature ? 'not-allowed' : 'pointer', opacity: savingFeature ? 0.7 : 1,
                    }}
                  >
                    {savingFeature ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    <span>Save & Publish Live</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                Administrators can feature verified campus leads and active note creators directly using the Admin controls above or the Creator Dashboard.
              </p>
              
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => setShowAdminManager(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'linear-gradient(135deg, #00dbe9, #2563eb)',
                    color: '#fff', padding: '9px 22px', borderRadius: 20,
                    fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                  }}
                >
                  <Plus size={15} />
                  <span>+ Feature First Contributor</span>
                </button>
              ) : (
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
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {contributorsList.map((c, i) => (
                <div key={c.id || i} style={{
                  background: 'var(--card, #0a0e14)', border: '1px solid var(--border, rgba(255,255,255,0.08))',
                  borderRadius: 20, padding: 22, display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between', transition: 'all 0.25s ease',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  position: 'relative',
                }} className="hover:border-cyan-500/50 hover:-translate-y-1">
                  
                  {/* Admin Quick Action Buttons on Card */}
                  {isAdmin && (
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      display: 'flex', gap: 4, zIndex: 10,
                    }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserToFeature(c);
                          setRoleTitle(c.role || '');
                          setBadge(c.badge || 'Top Reviewer');
                        }}
                        title="Edit Badge / Role"
                        style={{
                          background: 'rgba(0, 219, 233, 0.15)', border: '1px solid rgba(0, 219, 233, 0.4)',
                          color: '#00dbe9', borderRadius: 6, padding: '4px 6px', cursor: 'pointer',
                        }}
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUnfeature(c.id, c.username)}
                        title="Remove Contributor"
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#f87171', borderRadius: 6, padding: '4px 6px', cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <img src={c.avatar} alt={c.name} style={{
                        width: 48, height: 48, borderRadius: '50%', objectFit: 'cover',
                        border: `2px solid ${c.color || '#00dbe9'}`,
                        background: '#070a0e', flexShrink: 0,
                      }} />
                      <div style={{ minWidth: 0, flex: 1, paddingRight: isAdmin ? 48 : 0 }}>
                        <h3 style={{ fontFamily: 'var(--font-display, sans-serif)', fontSize: 16, fontWeight: 700, color: 'var(--text, #fff)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.name}
                        </h3>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub, #94a3b8)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          @{c.username}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700,
                        padding: '2px 8px', borderRadius: 99, background: `${c.color || '#00dbe9'}18`,
                        color: c.color || '#00dbe9', border: `1px solid ${c.color || '#00dbe9'}35`,
                        flexShrink: 0,
                      }}>
                        ★ {c.badge || 'Verified'}
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
