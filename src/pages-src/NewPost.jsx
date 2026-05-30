'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Helmet } from '../components/seo/HelmetShim';
import { Upload, X, Lock, FileImage, FileText, Send, Sparkles, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/layout/PageWrapper';
import NoIndex from '../components/seo/NoIndex';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TYPES = ['tutorial', 'project', 'article'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const LANGUAGES = ['javascript', 'typescript', 'python', 'rust', 'go', 'java', 'c++', 'ruby', 'php', 'swift', 'kotlin', 'other'];

const MAX_FILES = 5;
const MAX_CAPTION_LENGTH = 2200;

export default function NewPost() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Dual-tier UI State
  const isPro = user?.account_type === 'professional';
  const [tab, setTab] = useState('social'); // 'social' | 'article'

  useEffect(() => {
    if (!isPro) setTab('social');
  }, [isPro]);

  // Social Post State (Instagram style)
  const [socialFiles, setSocialFiles] = useState([]);
  const [caption, setCaption] = useState('');

  // Article Post State (Dev style)
  const [form, setForm] = useState({ title: '', description: '', type: 'tutorial', difficulty: 'beginner', language: 'javascript', tags: [], github_repo_url: '', price: 'free' });
  const [tagInput, setTagInput] = useState('');
  const [articleFiles, setArticleFiles] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);

  const [loading, setLoading] = useState(false);

  // --- Helpers for Article Mode ---
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().replace(/^#/, '');
      if (!form.tags.includes(tag)) set('tags', [...form.tags, tag]);
      setTagInput('');
    }
  };
  const removeTag = (tag) => set('tags', form.tags.filter(t => t !== tag));

  // --- Handlers for Media ---
  const handleSocialFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (socialFiles.length + newFiles.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} photos/videos allowed.`);
      return;
    }
    const withPreviews = newFiles.map(f => Object.assign(f, { preview: URL.createObjectURL(f) }));
    setSocialFiles(prev => [...prev, ...withPreviews]);
  };
  const removeSocialFile = (index) => {
    setSocialFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleArticleFileChange = (e) => {
    const f = Array.from(e.target.files);
    setArticleFiles(prev => [...prev, ...f]);
  };
  const handleThumbnailChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setThumbnail(f);
    setThumbPreview(URL.createObjectURL(f));
  };

  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tab === 'social' && socialFiles.length === 0) {
      toast.error('Add at least one photo or video.');
      return;
    }
    if (tab === 'social' && caption.trim().length < 20) {
      toast.error('Caption must be at least 20 characters.');
      return;
    }
    if (tab === 'article' && !form.title.trim()) {
      toast.error('Title is required for an article.');
      return;
    }
    
    setLoading(true);
    try {
      const fd = new FormData();
      
      if (tab === 'social') {
        fd.append('type', 'post');
        fd.append('description', caption); // Repurposed caption
        socialFiles.forEach(f => fd.append('files', f));
      } else {
        Object.entries(form).forEach(([k, v]) => {
          if (Array.isArray(v)) v.forEach(i => fd.append(k, i));
          else if (v) fd.append(k, v);
        });
        if (thumbnail) fd.append('thumbnail', thumbnail);
        articleFiles.forEach(f => fd.append('files', f));
      }

      const res = await api.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(tab === 'social' ? 'Post published!' : 'Article published!');
      router.push(`/posts/${res.data.post.id}?ref=new`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  // --- Components ---
  const ArticleSelect = ({ label, field, options }) => (
    <div>
      <label style={{ fontSize: 12, color: '#958da3', fontFamily: '"JetBrains Mono", monospace', display: 'block', marginBottom: 8 }}>{label}</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map(o => (
          <button key={o} type="button" onClick={() => set(field, o)} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, padding: '6px 14px', borderRadius: 20, border: `1px solid ${form[field] === o ? '#34d399' : 'rgba(74,68,87,0.3)'}`, background: form[field] === o ? 'rgba(52,211,153,0.1)' : 'transparent', color: form[field] === o ? '#34d399' : '#958da3', cursor: 'pointer', transition: 'all 0.2s' }}>{o}</button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <Helmet><title>New Post — Code+ Academy</title></Helmet>
      <NoIndex />
      <PageWrapper style={{ maxWidth: 760 }}>
        
        {/* --- Tab Switcher --- */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', background: '#0f1216', border: '1px solid #1f242b', borderRadius: 30, padding: 4, position: 'relative' }}>
            <button
              type="button"
              onClick={() => setTab('social')}
              style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 26, border: 'none', cursor: 'pointer', fontFamily: '"Space Grotesk", sans-serif', fontSize: 14, fontWeight: 700, transition: 'color 0.3s', background: 'transparent', color: tab === 'social' ? '#fff' : '#6b7280' }}
            >
              <FileImage size={16} /> Media Post
            </button>
            <button
              type="button"
              onClick={() => isPro && setTab('article')}
              style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 26, border: 'none', cursor: isPro ? 'pointer' : 'not-allowed', fontFamily: '"Space Grotesk", sans-serif', fontSize: 14, fontWeight: 700, transition: 'color 0.3s', background: 'transparent', color: tab === 'article' ? '#fff' : (isPro ? '#6b7280' : '#4a4457') }}
              title={!isPro ? "Requires Professional Account" : ""}
            >
              <FileText size={16} /> Tech Article {!isPro && <Lock size={14} color="#4a4457" />}
            </button>
            
            {/* Tab indicator pill */}
            <motion.div
              layoutId="tab-pill"
              initial={false}
              animate={{ left: tab === 'social' ? 4 : '50%', width: 'calc(50% - 4px)' }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              style={{ position: 'absolute', top: 4, bottom: 4, background: '#252a30', borderRadius: 26, zIndex: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
          
          <AnimatePresence mode="wait">
            {tab === 'social' ? (
              // ─── MEDIA POST (INSTAGRAM STYLE) ──────────────────────────────────────────────────────────
              <motion.div
                key="social"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 24, background: '#13181d', borderRadius: 20, border: '1px solid #1f242b', padding: '32px' }}
              >
                
                {/* Visual Media Dropzone */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, height: socialFiles.length > 0 ? 120 : 300, border: '2px dashed #2a3038', borderRadius: 16, cursor: 'pointer', background: 'radial-gradient(circle at center, #1b2025 0%, #13181d 100%)', transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#4cd6fb'; e.currentTarget.style.background = '#151b22'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a3038'; e.currentTarget.style.background = 'radial-gradient(circle at center, #1b2025 0%, #13181d 100%)'; }}
                  >
                    <input type="file" multiple accept="image/*,video/*" onChange={handleSocialFileChange} style={{ display: 'none' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(76,214,251,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Upload size={22} color="#4cd6fb" />
                      </div>
                      <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: 16, fontWeight: 600, color: '#dee3ea' }}>Select photos or videos</span>
                      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#6b7280' }}>Up to {MAX_FILES} high-res files</span>
                    </div>
                  </label>

                  {/* Desktop / Carousel Horizontal Grid */}
                  {socialFiles.length > 0 && (
                    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '16px 0', scrollSnapType: 'x mandatory' }}>
                      <AnimatePresence>
                        {socialFiles.map((file, i) => (
                          <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }}
                            style={{ position: 'relative', width: 140, height: 180, flexShrink: 0, borderRadius: 12, overflow: 'hidden', border: '1px solid #2a3038', scrollSnapAlign: 'start' }}
                          >
                            {file.type.startsWith('video/') ? (
                              <video src={file.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                            ) : (
                              <img src={file.preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                            <button type="button" onClick={() => removeSocialFile(i)} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                              <X size={14} />
                            </button>
                            {file.type.startsWith('video/') && (
                              <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 6, backdropFilter: 'blur(4px)', fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: '#fff' }}>VIDEO</div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Caption Field */}
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value.slice(0, MAX_CAPTION_LENGTH))}
                    placeholder="Write a caption... (Markdown supported) ✨"
                    rows={6}
                    style={{ width: '100%', background: '#0a0f14', border: '1px solid #1f242b', borderRadius: 12, padding: 16, fontSize: 14, color: '#dee3ea', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, transition: 'border-color 0.2s', paddingBottom: 24, boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#4cd6fb'}
                    onBlur={e => e.target.style.borderColor = '#1f242b'}
                  />
                  <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', alignItems: 'center', gap: 12, fontFamily: '"JetBrains Mono", monospace', fontSize: 10 }}>
                    {caption.length < 20 && (
                      <span style={{ color: '#ef4444' }}>min 20 chars</span>
                    )}
                    <span style={{ color: caption.length >= MAX_CAPTION_LENGTH ? '#ef4444' : '#6b7280' }}>
                      {caption.length} / {MAX_CAPTION_LENGTH}
                    </span>
                  </div>
                </div>

                {/* Submit Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12 }}>
                  <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 32px', borderRadius: 30, background: 'linear-gradient(135deg, #4cd6fb 0%, #1e90ff 100%)', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: '"Space Grotesk", sans-serif', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'transform 0.2s, boxShadow 0.2s', boxShadow: '0 4px 14px rgba(76,214,251,0.25)' }}
                    onMouseEnter={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(76,214,251,0.4)'; }}}
                    onMouseLeave={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(76,214,251,0.25)'; }}}
                  >
                    {loading ? 'Publishing...' : <>Share <Send size={16} /></>}
                  </button>
                </div>
              </motion.div>
            ) : (


              // ─── TECH ARTICLE (DEVELOPER STYLE) ──────────────────────────────────────────────────────────
              <motion.div
                key="article"
                initial={{ opacity: 0, scale: 0.98, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                <div style={{ marginBottom: 12, padding: '12px 16px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Sparkles size={20} color="#34d399" />
                  <p style={{ margin: 0, fontSize: 13, color: '#34d399', fontFamily: '"Space Grotesk", sans-serif' }}>You're using the Professional Article formatter. Deep dives, code blocks, and files are supported here.</p>
                </div>

                {/* Thumbnail */}
                <div>
                  <label style={{ fontSize: 12, color: '#958da3', fontFamily: '"JetBrains Mono", monospace', display: 'block', marginBottom: 8 }}>// cover_image</label>
                  <label style={{ display: 'block', cursor: 'pointer', position: 'relative' }}>
                    <input type="file" accept="image/*" onChange={handleThumbnailChange} style={{ display: 'none' }} />
                    {thumbPreview ? (
                      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', aspectRatio: '16/7', border: '1px solid #1f242b' }}>
                        <img src={thumbPreview} alt="thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                          <span style={{ color: '#fff', fontSize: 13, fontFamily: '"JetBrains Mono", monospace' }}>Click to change</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 36, border: '2px dashed #2a3038', borderRadius: 16, background: '#171c21', transition: 'all 0.2s', aspectRatio: '16/7' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#34d399'; e.currentTarget.style.background = 'rgba(52,211,153,0.05)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a3038'; e.currentTarget.style.background = '#171c21'; }}>
                        <ImageIcon size={28} color="#6b7280" />
                        <span style={{ fontSize: 14, color: '#dee3ea', fontWeight: 600 }}>Upload cover image</span>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>16:7 panoramic recommended</span>
                      </div>
                    )}
                  </label>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: '#958da3', fontFamily: '"JetBrains Mono", monospace', display: 'block', marginBottom: 6 }}>// title *</label>
                  <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Type the article title here..." 
                    style={{ boxSizing: 'border-box', width: '100%', background: '#0a0f14', border: '1px solid #1f242b', borderRadius: 12, padding: 14, fontSize: 16, color: '#fff', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = '#34d399'} onBlur={e => e.target.style.borderColor = '#1f242b'}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: '#958da3', fontFamily: '"JetBrains Mono", monospace', display: 'block', marginBottom: 6 }}>// content_markdown</label>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Write the body of your article here (Markdown supported)..." rows={10} 
                    style={{ boxSizing: 'border-box', width: '100%', background: '#0a0f14', border: '1px solid #1f242b', borderRadius: 12, padding: 14, fontSize: 14, color: '#dee3ea', outline: 'none', resize: 'vertical', lineHeight: 1.6, transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = '#34d399'} onBlur={e => e.target.style.borderColor = '#1f242b'}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <ArticleSelect label="// type" field="type" options={TYPES} />
                  <ArticleSelect label="// difficulty" field="difficulty" options={DIFFICULTIES} />
                </div>
                <ArticleSelect label="// core_language" field="language" options={LANGUAGES} />

                {/* Tags */}
                <div>
                  <label style={{ fontSize: 12, color: '#958da3', fontFamily: '"JetBrains Mono", monospace', display: 'block', marginBottom: 6 }}>// tags</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '10px 12px', background: '#0a0f14', border: '1px solid #1f242b', borderRadius: 12, minHeight: 44 }}>
                    {form.tags.map(tag => (
                      <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: '"JetBrains Mono", monospace', fontSize: 11, background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 20, padding: '4px 10px' }}>
                        #{tag}
                        <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#34d399', display: 'flex', padding: 0, marginLeft: 4 }}><X size={12} /></button>
                      </span>
                    ))}
                    <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag} placeholder="Add tag, press Enter..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', padding: 0, fontSize: 12, minWidth: 120, color: '#fff', fontFamily: '"JetBrains Mono", monospace' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={{ fontSize: 12, color: '#958da3', fontFamily: '"JetBrains Mono", monospace', display: 'block', marginBottom: 6 }}>// github_repo_url (optional)</label>
                    <input type="url" value={form.github_repo_url} onChange={e => set('github_repo_url', e.target.value)} placeholder="https://github.com/..." 
                      style={{ boxSizing: 'border-box', width: '100%', background: '#0a0f14', border: '1px solid #1f242b', borderRadius: 12, padding: 12, fontSize: 13, color: '#fff', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#958da3', fontFamily: '"JetBrains Mono", monospace', display: 'block', marginBottom: 8 }}>// pricing</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {['free', 'paid'].map(p => (
                        <button key={p} type="button" onClick={() => set('price', p)} style={{ padding: '10px 24px', borderRadius: 12, border: `1px solid ${form.price === p ? '#d0bcff' : '#1f242b'}`, background: form.price === p ? 'rgba(208,188,255,0.1)' : '#0a0f14', color: form.price === p ? '#d0bcff' : '#958da3', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', flex: 1, textTransform: 'uppercase' }}>{p}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Article Files */}
                <div>
                  <label style={{ fontSize: 12, color: '#958da3', fontFamily: '"JetBrains Mono", monospace', display: 'block', marginBottom: 8 }}>// project_files_zip</label>
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, border: '2px dashed #2a3038', borderRadius: 12, cursor: 'pointer', background: '#171c21', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#d0bcff'} onMouseLeave={e => e.currentTarget.style.borderColor = '#2a3038'}
                  >
                    <input type="file" multiple onChange={handleArticleFileChange} style={{ display: 'none' }} />
                    <Upload size={20} color="#6b7280" />
                    <span style={{ fontSize: 13, color: '#dee3ea', fontWeight: 500 }}>Upload attachments</span>
                  </label>
                  {articleFiles.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                      {articleFiles.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#1f242b', borderRadius: 8, border: '1px solid #2a3038' }}>
                          <FileText size={16} color="#d0bcff" />
                          <span style={{ fontSize: 12, color: '#dee3ea', flex: 1, fontFamily: '"JetBrains Mono", monospace' }}>{f.name}</span>
                          <button type="button" onClick={() => setArticleFiles(fs => fs.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#958da3' }}><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 12, paddingTop: 16, justifyContent: 'flex-end', borderTop: '1px solid #1f242b', marginTop: 12 }}>
                  <button type="button" onClick={() => router.back()} style={{ padding: '12px 24px', borderRadius: 30, background: 'transparent', border: '1px solid #2a3038', color: '#dee3ea', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                  <button type="submit" disabled={loading} style={{ padding: '12px 32px', borderRadius: 30, background: '#fff', color: '#000', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14 }}>
                    {loading ? 'Publishing...' : 'Publish Article'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </PageWrapper>
    </>
  );
}
