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
  textMuted: '#6b7280',
  danger: '#ef4444',
  success: '#10b981',
  fontMono: '"JetBrains Mono", monospace',
  fontHead: '"Space Grotesk", sans-serif',
  fontBody: '"Geist", -apple-system, sans-serif',
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#070a0e',
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  padding: '11px 14px',
  color: T.text,
  fontSize: 14,
  fontFamily: T.fontBody,
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const labelStyle = {
  display: 'block',
  fontFamily: T.fontMono,
  fontSize: 11,
  fontWeight: 700,
  color: T.cyan,
  textTransform: 'lowercase',
  letterSpacing: '0.04em',
  marginBottom: 6,
};

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: T.cyan, fontFamily: T.fontMono }}>
            <Loader2 className="animate-spin" size={24} />
            <span>Loading post data...</span>
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

      <div style={{ maxWidth: 860, margin: '20px auto 60px', padding: '0 16px' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
              color: T.text, padding: '8px 16px', borderRadius: 20,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 12, fontFamily: T.fontMono, color: T.cyan,
              background: 'rgba(0, 219, 233, 0.1)', border: '1px solid rgba(0, 219, 233, 0.3)',
              padding: '3px 10px', borderRadius: 6, fontWeight: 700,
            }}>
              EDIT MODE
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          padding: '28px 32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}>
          <h1 style={{
            margin: '0 0 8px', fontSize: 24, fontWeight: 800,
            fontFamily: T.fontHead, color: '#fff', letterSpacing: '-0.02em',
          }}>
            Edit Post
          </h1>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: T.textMuted }}>
            Update your post caption, syntax-highlighted code snippet, tags, and audience visibility.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Caption */}
            <div>
              <span style={labelStyle}>// caption</span>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Write or edit your caption... ✨"
                rows={4}
                style={{
                  ...inputStyle,
                  resize: 'vertical', lineHeight: 1.6,
                }}
              />
            </div>

            {/* Code Snippet Module */}
            <div style={{
              background: includeCode ? 'rgba(0, 219, 233, 0.03)' : '#070a0e',
              border: `1px solid ${includeCode ? 'rgba(0, 219, 233, 0.35)' : T.border}`,
              borderRadius: 14,
              padding: 16,
              transition: 'all 0.25s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: includeCode ? 'rgba(0, 219, 233, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${includeCode ? 'rgba(0, 219, 233, 0.4)' : T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: includeCode ? T.cyan : T.textMuted,
                  }}>
                    <Code2 size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f2f8', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Attached Code Snippet</span>
                      {includeCode && (
                        <span style={{
                          fontSize: 10, fontFamily: T.fontMono, color: T.cyan,
                          background: 'rgba(0, 219, 233, 0.12)', border: '1px solid rgba(0, 219, 233, 0.3)',
                          padding: '1px 6px', borderRadius: 4, fontWeight: 700,
                        }}>
                          IDE ACTIVE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>
                      Add or modify syntax-highlighted code inside your post
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIncludeCode(!includeCode)}
                  style={{
                    padding: '6px 14px', borderRadius: 8,
                    background: includeCode ? 'rgba(0, 219, 233, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                    border: `1px solid ${includeCode ? T.cyan : T.border}`,
                    color: includeCode ? T.cyan : T.text,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s ease',
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
                    style={{ marginTop: 16, overflow: 'hidden' }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                      <div>
                        <span style={{ ...labelStyle, fontSize: 10, marginBottom: 4 }}>// Language</span>
                        <select
                          value={codeLanguage}
                          onChange={e => setCodeLanguage(e.target.value)}
                          style={{ ...inputStyle, padding: '9px 12px', fontSize: 13 }}
                        >
                          {CODE_LANGUAGES.map(l => (
                            <option key={l.value} value={l.value} style={{ background: '#0a0e14', color: '#fff' }}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span style={{ ...labelStyle, fontSize: 10, marginBottom: 4 }}>// File / Snippet Title (Optional)</span>
                        <input
                          value={codeTitle}
                          onChange={e => setCodeTitle(e.target.value)}
                          placeholder="e.g. RealtimeSyncManager.ts"
                          style={{ ...inputStyle, padding: '9px 12px', fontSize: 13 }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: '#0b1324', border: '1px solid #1e293b', borderBottom: 'none',
                        borderTopLeftRadius: 10, borderTopRightRadius: 10,
                        padding: '8px 14px', fontSize: 11, fontFamily: T.fontMono, color: '#94a3b8',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: T.cyan, fontWeight: 800 }}>&gt;_</span>
                          <span>{codeLanguage} editor</span>
                        </div>
                        <span>{codeSnippet.split('\n').length} lines</span>
                      </div>

                      <textarea
                        value={codeSnippet}
                        onChange={e => setCodeSnippet(e.target.value)}
                        placeholder={`// Paste your ${codeLanguage} code here...`}
                        rows={8}
                        spellCheck={false}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: '#070c18', border: '1px solid #1e293b',
                          borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
                          padding: '14px 16px', fontSize: 13, color: '#e2e8f0',
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          lineHeight: 1.5, outline: 'none', resize: 'vertical',
                          tabSize: 2,
                        }}
                      />
                    </div>

                    {codeSnippet.trim() && (
                      <div style={{ marginTop: 14 }}>
                        <span style={{ ...labelStyle, fontSize: 10, marginBottom: 4, color: T.cyan }}>
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
                display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
                padding: '8px 12px', minHeight: 44,
              }}>
                {tags.map((tag, i) => (
                  <span key={i} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 8px', borderRadius: 6,
                    background: 'rgba(0, 219, 233, 0.12)', border: '1px solid rgba(0, 219, 233, 0.3)',
                    color: T.cyan, fontSize: 11, fontFamily: T.fontMono, fontWeight: 700,
                  }}>
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
                      style={{ background: 'none', border: 'none', color: T.cyan, cursor: 'pointer', padding: 0, display: 'flex' }}
                    >
                      <X size={12} />
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
                    color: '#f0f2f8', fontSize: 13, flex: 1, minWidth: 120,
                    fontFamily: T.fontBody,
                  }}
                />
              </div>
            </div>

            {/* Submit & Actions */}
            <div style={{
              display: 'flex', gap: 12, paddingTop: 16,
              justifyContent: 'flex-end', borderTop: `1px solid ${T.border}`,
            }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  padding: '10px 20px', borderRadius: 30,
                  background: 'transparent', border: `1px solid ${T.border}`,
                  color: T.text, cursor: 'pointer', fontWeight: 600,
                  fontFamily: T.fontBody, fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 28px', borderRadius: 30,
                  background: `linear-gradient(135deg, ${T.cyan}, ${T.accent})`,
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  fontFamily: T.fontHead, border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  boxShadow: `0 4px 20px ${T.accentGlow}`,
                }}
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
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
