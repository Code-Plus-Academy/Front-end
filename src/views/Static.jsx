import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronDown, Send } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Footer from '../components/layout/Footer';
import api from '../api/axios';
import toast from 'react-hot-toast';

const faqData = [
  {
    category: 'General',
    items: [
      { q: 'What is Code+ Academy?', a: 'Code+ Academy (CPA) is a developer social learning platform where engineers share tutorials, projects, and resources with each other. Think of it as a mix of GitHub, LinkedIn, and Gumroad for developers.' },
      { q: 'Is CPA free to use?', a: 'Yes! Creating an account, following developers, reading posts, and commenting are all free. Professional creators can upload paid resources, but many share content for free.' },
      { q: 'Who is CPA for?', a: 'CPA is for anyone in software development — from students and junior developers to senior engineers and tech educators who want to share and grow.' },
    ],
  },
  {
    category: 'Accounts',
    items: [
      { q: 'What\'s the difference between Personal and Professional?', a: 'Personal accounts can browse, follow, like, comment, save, and DM. Professional accounts can also create and publish posts, upload files, and access the Creator Dashboard.' },
      { q: 'Can I switch from Personal to Professional?', a: 'Yes! Head to Settings → Profile to upgrade your account type at any time.' },
      { q: 'How do I verify my email?', a: 'After registering, we\'ll send a verification email to your address. Click the link in the email to verify. Some features require a verified email.' },
    ],
  },
  {
    category: 'Payments',
    items: [
      { q: 'How do paid resources work?', a: 'Professional creators can mark their posts as paid. Buyers get access to download attached files. Payment infrastructure is coming in Phase 2.' },
      { q: 'What payment methods are supported?', a: 'Full payment integration (Stripe, UPI) is planned for Phase 2. Currently all content is free to access.' },
    ],
  },
  {
    category: 'Technical',
    items: [
      { q: 'What file types can I upload?', a: 'Professional creators can upload any file type — PDF, ZIP, images, code files. Files are stored securely on Cloudinary.' },
      { q: 'Is there a mobile app?', a: 'The web app is fully responsive and works great on mobile. Native iOS/Android apps are planned for a future phase.' },
      { q: 'How do I report a bug or issue?', a: 'Use the Support page to contact us directly, or email support@codeplusacademy.in. We typically respond within 24 hours.' },
    ],
  },
];

function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        width: '100%', padding: '16px 0', background: 'none', border: 'none',
        cursor: 'pointer', textAlign: 'left', gap: 12,
      }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{q}</span>
        <ChevronDown size={16} color="var(--dim)" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && <p style={{ fontSize: 14, color: 'var(--sub)', lineHeight: 1.8, paddingBottom: 16 }}>{a}</p>}
    </div>
  );
}

export function FAQ() {
  return (
    <>
      <Helmet><title>FAQ — Code+ Academy</title></Helmet>
      <PageWrapper style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)', marginBottom: 4 }}>// faq</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36 }}>Frequently Asked Questions</h1>
          <p style={{ color: 'var(--sub)', marginTop: 8 }}>Can't find an answer? <a href="/support" style={{ color: 'var(--green)' }}>Contact us</a></p>
        </div>
        {faqData.map(({ category, items }) => (
          <div key={category} style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--green)', marginBottom: 12 }}>// {category.toLowerCase()}</div>
            <div className="card" style={{ padding: '0 20px' }}>
              {items.map(({ q, a }) => <AccordionItem key={q} q={q} a={a} />)}
            </div>
          </div>
        ))}
      </PageWrapper>
      <Footer />
    </>
  );
}

export function Privacy() {
  return (
    <>
      <Helmet><title>Privacy Policy — Code+ Academy</title></Helmet>
      <PageWrapper style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)', marginBottom: 4 }}>// legal</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32 }}>Privacy Policy</h1>
          <p style={{ color: 'var(--dim)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 8 }}>Last updated: January 2025</p>
        </div>
        <div className="card" style={{ padding: 32 }}>
          <div className="prose">
            {[
              { title: '1. Information We Collect', content: 'We collect information you provide directly — name, email, bio, avatar, and content you post. We also collect usage data such as pages visited, posts viewed, and interactions (likes, follows, comments) to improve the platform experience.' },
              { title: '2. How We Use Your Information', content: 'Your data is used to provide and improve the CPA platform, send email notifications you opt into, personalize your feed and suggestions, and ensure account security. We do not sell your personal data.' },
              { title: '3. Data Storage', content: 'Data is stored securely on Supabase PostgreSQL. Files are hosted on Cloudinary with industry-standard encryption. We retain your data as long as your account is active.' },
              { title: '4. Cookies', content: 'We use an HTTP-only JWT cookie (cpa_token) for authentication. This cookie is essential for the platform to function and cannot be disabled while using the service.' },
              { title: '5. Third-Party Services', content: 'We use Cloudinary for file storage, Resend for transactional email, Google/GitHub for OAuth authentication, and Render/Cloudflare for hosting. Each service has its own privacy policy.' },
              { title: '6. Your Rights', content: 'You can update your profile information anytime in Settings. You can delete your account from Settings → Danger Zone. This permanently removes all your data within 30 days.' },
              { title: '7. Contact', content: 'For privacy questions, email privacy@codeplusacademy.in' },
            ].map(({ title, content }) => (
              <div key={title} style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, marginBottom: 8 }}>{title}</h2>
                <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>{content}</p>
              </div>
            ))}
          </div>
        </div>
      </PageWrapper>
      <Footer />
    </>
  );
}

export function Terms() {
  return (
    <>
      <Helmet><title>Terms of Service — Code+ Academy</title></Helmet>
      <PageWrapper style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)', marginBottom: 4 }}>// legal</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32 }}>Terms of Service</h1>
          <p style={{ color: 'var(--dim)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 8 }}>Last updated: January 2025</p>
        </div>
        <div className="card" style={{ padding: 32 }}>
          <div className="prose">
            {[
              { title: '1. Acceptance of Terms', content: 'By using Code+ Academy, you agree to these Terms of Service. If you do not agree, please do not use the platform.' },
              { title: '2. Account Responsibilities', content: 'You are responsible for maintaining the security of your account and all activity under it. You must provide accurate information during registration.' },
              { title: '3. Content Policy', content: 'Users may not post spam, malware, illegal content, hate speech, or content that infringes on intellectual property. CPA reserves the right to remove violating content and suspend accounts.' },
              { title: '4. Intellectual Property', content: 'Content you post remains yours. By posting, you grant CPA a license to display it on the platform. Do not post content you do not own or have rights to.' },
              { title: '5. Professional Accounts', content: 'Professional creators agree to provide accurate descriptions of paid content. Fraudulent listings will result in account suspension.' },
              { title: '6. Limitation of Liability', content: 'Code+ Academy is provided "as is" without warranties. We are not liable for any damages arising from use of the platform.' },
              { title: '7. Changes to Terms', content: 'We may update these terms with notice. Continued use after changes constitutes acceptance.' },
              { title: '8. Contact', content: 'For legal questions, email legal@codeplusacademy.in' },
            ].map(({ title, content }) => (
              <div key={title} style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, marginBottom: 8 }}>{title}</h2>
                <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>{content}</p>
              </div>
            ))}
          </div>
        </div>
      </PageWrapper>
      <Footer />
    </>
  );
}

export function Support() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/support', form);
      setSent(true);
    } catch { toast.error('Failed to send. Email us directly at support@codeplusacademy.in'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Helmet><title>Support — Code+ Academy</title></Helmet>
      <PageWrapper style={{ maxWidth: 560 }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)', marginBottom: 4 }}>// support</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32 }}>Get Help</h1>
          <p style={{ color: 'var(--sub)', marginTop: 8 }}>We typically respond within 24 hours.</p>
        </div>

        {sent ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Message sent!</h2>
            <p style={{ color: 'var(--sub)' }}>We'll get back to you at {form.email} within 24 hours.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 28 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sub)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6 }}>// name</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" required />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sub)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6 }}>// email</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--sub)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6 }}>// subject</label>
                <input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="What's this about?" required />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--sub)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6 }}>// message</label>
                <textarea value={form.message} onChange={e => set('message', e.target.value)} placeholder="Describe your issue in detail..." rows={5} required style={{ resize: 'vertical' }} />
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '11px', gap: 6 }}>
                <Send size={14} /> {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--dim)' }}>Or email us directly at <a href="mailto:support@codeplusacademy.in" style={{ color: 'var(--green)' }}>support@codeplusacademy.in</a></p>
        </div>
      </PageWrapper>
      <Footer />
    </>
  );
}
