import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Code2, ArrowLeft, Save, Loader2, X, Globe, Lock, Users,
  AlertCircle, CheckCircle2, FileText, Sparkles, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/layout/PageWrapper';
import NoIndex from '../components/seo/NoIndex';
import CodeSnippetCard, { extractCodeBlock } from '../components/posts/CodeSnippetCard';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (e) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  return matches;
}

const CODE_LANGUAGES = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go (Golang)' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'sql', label: 'SQL / PostgreSQL' },
  { value: 'html', label: 'HTML / CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'solidity', label: 'Solidity' },
];

const T = {
  cyan: '#00dbe9',
  cyanGlow: 'rgba(0, 219, 233, 0.15)',
  accent: '#2563eb',
  accentGlow: 'rgba(37, 99, 235, 0.25)',
  bg: '#04070c',
  surface: '#0a0e14',
  surface2: '#111722',
  border: 'rgba(255, 255, 255, 0.08)',
  text: '#f0f2f8',
  textMuted: '#94a3b8',
  danger: '#ef4444',
  success: '#10b981',
  fontMono: '"JetBrains Mono", monospace',
  fontHead: '"Space Grotesk", sans-serif',
  fontBody: '"Geist", -apple-system, sans-serif',
};

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState(null);

  // Form fields
  const [caption, setCaption] = useState('');
  const [includeCode, setIncludeCode] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('typescript');
  const [codeTitle, setCodeTitle] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [visibility, setVisibility] = useState('public');

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    background: '#070a0e',
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: isMobile ? '8px 10px' : '10px 12px',
    color: T.text,
    fontSize: isMobile ? 13 : 14,
    fontFamily: T.fontBody,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontFamily: T.fontMono,
    fontSize: 10,
    fontWeight: 700,
    color: T.cyan,
    textTransform: 'lowercase',
    letterSpacing: '0.04em',
    marginBottom: 4,
  };

  useEffect(() => {
    let mounted = true;
    async function fetchPost() {
      try {
        setLoading(true);
        const res = await api.get(`/posts/${id}`);
        const p = res.data.post;
        if (!mounted) return;

        if (!p) {
          toast.error('Post not found');
          navigate('/feed');
          return;
        }

        // Authorize check
        if (user && p.creator_id !== user.id && user.role !== 'admin') {
          toast.error('You do not have permission to edit this post');
          navigate(`/posts/${id}`);
          return;
        }

        setPost(p);
        setDifficulty(p.difficulty || 'beginner');
        setVisibility(p.visibility || 'public');

        if (Array.isArray(p.tags)) {
          setTags(p.tags);
        }

        // Extract code block if existing
        const raw = p.description || p.caption || p.content || p.title || '';
        const { beforeText, codeSnippet: parsedCode } = extractCodeBlock(raw);

        if (parsedCode) {
          setIncludeCode(true);
          setCodeSnippet(parsedCode.code || '');
          setCodeLanguage(parsedCode.language || 'typescript');
          setCaption(beforeText || '');
        } else {
          setCaption(raw);
        }
      } catch (err) {
        if (!mounted) return;
        toast.error('Failed to load post for editing');
        navigate('/feed');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (id) fetchPost();

    return () => { mounted = false; };
  }, [id, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasCode = includeCode && codeSnippet.trim().length > 0;
    if (!caption.trim() && !hasCode) {
      toast.error('Please enter a caption or attach a code snippet.');
      return;
    }

    setSaving(true);
    try {
      let finalDescription = caption.trim();
      if (hasCode) {
        finalDescription = finalDescription
          ? `${finalDescription}\n\n\`\`\`${codeLanguage}\n${codeSnippet.trim()}\n\`\`\``
          : `\`\`\`${codeLanguage}\n${codeSnippet.trim()}\n\`\`\``;
      }

      await api.patch(`/posts/${id}`, {
        description: finalDescription,
        tags,
        difficulty,
        visibility,
      });

      toast.success('Post updated successfully!');
      navigate(`/posts/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.cyan, fontFamily: T.fontMono, fontSize: 13 }}>
            <Loader2 className="animate-spin" size={20} />
            <span>Loading post...</span>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <NoIndex />
      <Helmet>
        <title>Edit Post | Code Plus Academy</title>
      </Helmet>

      <div style={{
        maxWidth: 780,
        margin: isMobile ? '4px auto 90px' : '14px auto 60px',
        padding: isMobile ? '0 8px' : '0 16px',
      }}>
        {/* Header Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: isMobile ? 12 : 16,
        }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
              color: T.text, padding: isMobile ? '5px 12px' : '6px 14px', borderRadius: 20,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>

          <span style={{
            fontSize: 10, fontFamily: T.fontMono, color: T.cyan,
            background: 'rgba(0, 219, 233, 0.1)', border: '1px solid rgba(0, 219, 233, 0.3)',
            padding: '2px 8px', borderRadius: 4, fontWeight: 700,
          }}>
            EDIT MODE
          </span>
        </div>

        {/* Main Card */}
        <div style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 14,
          padding: isMobile ? '16px 12px' : '22px 24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
        }}>
          <h1 style={{
            margin: '0 0 2px', fontSize: isMobile ? 18 : 22, fontWeight: 800,
            fontFamily: T.fontHead, color: '#fff', letterSpacing: '-0.02em',
          }}>
            Edit Post
          </h1>
          <p style={{ margin: isMobile ? '0 0 14px' : '0 0 18px', fontSize: 12, color: T.textMuted }}>
            Update your caption, code snippet, tags, and audience visibility.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 16 }}>
            {/* Caption */}
            <div>
              <span style={labelStyle}>// caption</span>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Write or edit your caption... ✨"
                rows={isMobile ? 3 : 4}
                style={{
                  ...inputStyle,
                  resize: 'vertical', lineHeight: 1.5,
                }}
              />
            </div>

            {/* Code Snippet Module */}
            <div style={{
              background: includeCode ? 'rgba(0, 219, 233, 0.03)' : '#070a0e',
              border: `1px solid ${includeCode ? 'rgba(0, 219, 233, 0.35)' : T.border}`,
              borderRadius: 10,
              padding: isMobile ? '10px 10px' : '14px 14px',
              transition: 'all 0.25s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: includeCode ? 'rgba(0, 219, 233, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${includeCode ? 'rgba(0, 219, 233, 0.4)' : T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: includeCode ? T.cyan : T.textMuted, flexShrink: 0,
                  }}>
                    <Code2 size={15} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f2f8', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="truncate">Attached Code Snippet</span>
                      {includeCode && (
                        <span style={{
                          fontSize: 9, fontFamily: T.fontMono, color: T.cyan,
                          background: 'rgba(0, 219, 233, 0.12)', border: '1px solid rgba(0, 219, 233, 0.3)',
                          padding: '1px 5px', borderRadius: 4, fontWeight: 700, flexShrink: 0,
                        }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIncludeCode(!includeCode)}
                  style={{
                    padding: '4px 10px', borderRadius: 6,
                    background: includeCode ? 'rgba(0, 219, 233, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                    border: `1px solid ${includeCode ? T.cyan : T.border}`,
                    color: includeCode ? T.cyan : T.text,
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                  }}
                >
                  {includeCode ? 'Remove Code' : '+ Add Code'}
                </button>
              </div>

              {/* Code Editor Panel */}
              <AnimatePresence>
                {includeCode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ marginTop: 12, overflow: 'hidden' }}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 10, marginBottom: 10
                    }}>
                      <div>
                        <span style={{ ...labelStyle, fontSize: 9 }}>// Language</span>
                        <select
                          value={codeLanguage}
                          onChange={e => setCodeLanguage(e.target.value)}
                          style={{ ...inputStyle, padding: '7px 10px', fontSize: 12 }}
                        >
                          {CODE_LANGUAGES.map(l => (
                            <option key={l.value} value={l.value} style={{ background: '#0a0e14', color: '#fff' }}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span style={{ ...labelStyle, fontSize: 9 }}>// File / Title (Optional)</span>
                        <input
                          value={codeTitle}
                          onChange={e => setCodeTitle(e.target.value)}
                          placeholder="e.g. RealtimeSyncManager.ts"
                          style={{ ...inputStyle, padding: '7px 10px', fontSize: 12 }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: '#0b1324', border: '1px solid #1e293b', borderBottom: 'none',
                        borderTopLeftRadius: 8, borderTopRightRadius: 8,
                        padding: '6px 10px', fontSize: 10, fontFamily: T.fontMono, color: '#94a3b8',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: T.cyan, fontWeight: 800 }}>&gt;_</span>
                          <span>{codeLanguage} editor</span>
                        </div>
                        <span>{codeSnippet.split('\n').length} lines</span>
                      </div>

                      <textarea
                        value={codeSnippet}
                        onChange={e => setCodeSnippet(e.target.value)}
                        placeholder={`// Paste your ${codeLanguage} code here...`}
                        rows={isMobile ? 6 : 8}
                        spellCheck={false}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: '#070c18', border: '1px solid #1e293b',
                          borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
                          padding: '10px 12px', fontSize: 12, color: '#e2e8f0',
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          lineHeight: 1.45, outline: 'none', resize: 'vertical',
                          tabSize: 2,
                        }}
                      />
                    </div>

                    {codeSnippet.trim() && (
                      <div style={{ marginTop: 10 }}>
                        <span style={{ ...labelStyle, fontSize: 9, color: T.cyan }}>
                          // Live Card Preview
                        </span>
                        <CodeSnippetCard
                          code={codeSnippet}
                          language={codeLanguage}
                          title={codeTitle}
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tags / Topics */}
            <div>
              <span style={labelStyle}>// tags / topics (press enter to add)</span>
              <div style={{
                ...inputStyle,
                display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center',
                padding: '6px 8px', minHeight: 38,
              }}>
                {tags.map((tag, i) => (
                  <span key={i} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    padding: '2px 6px', borderRadius: 4,
                    background: 'rgba(0, 219, 233, 0.12)', border: '1px solid rgba(0, 219, 233, 0.3)',
                    color: T.cyan, fontSize: 10, fontFamily: T.fontMono, fontWeight: 700,
                  }}>
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
                      style={{ background: 'none', border: 'none', color: T.cyan, cursor: 'pointer', padding: 0, display: 'flex' }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}

                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const val = tagInput.trim().replace(/^#/, '').replace(/\s+/g, '-');
                      if (val && !tags.includes(val) && tags.length < 8) {
                        setTags([...tags, val]);
                        setTagInput('');
                      }
                    }
                  }}
                  placeholder={tags.length === 0 ? "e.g. TypeScript, React, SystemDesign" : "Add tag..."}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: '#f0f2f8', fontSize: 12, flex: 1, minWidth: 100,
                    fontFamily: T.fontBody,
                  }}
                />
              </div>
            </div>

            {/* Submit & Actions */}
            <div style={{
              display: 'flex', gap: 10, paddingTop: 12,
              justifyContent: 'flex-end', borderTop: `1px solid ${T.border}`,
            }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  padding: isMobile ? '8px 16px' : '9px 18px', borderRadius: 20,
                  background: 'transparent', border: `1px solid ${T.border}`,
                  color: T.text, cursor: 'pointer', fontWeight: 600,
                  fontFamily: T.fontBody, fontSize: 12,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: isMobile ? '8px 18px' : '9px 24px', borderRadius: 20,
                  background: `linear-gradient(135deg, ${T.cyan}, ${T.accent})`,
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  fontFamily: T.fontHead, border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  boxShadow: `0 4px 16px ${T.accentGlow}`,
                }}
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
