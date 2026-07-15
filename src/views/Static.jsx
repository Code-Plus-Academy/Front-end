'use client';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronDown, Send, AlertCircle, Clock, ShieldAlert, Scale, AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Footer from '../components/layout/Footer';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const faqData = [
  {
    category: 'Account & Age Requirements',
    items: [
      { q: 'Who can create an account?', a: 'You must be at least 18 to create an account yourself. If you\'re between 13 and 18, you can use Code Plus Academy, but a parent or legal guardian needs to give consent first. We don\'t permit accounts for anyone under 13.' },
      { q: 'I\'m under 18 — what does "parental consent" actually involve?', a: 'We ask for your date of birth when you sign up. If you\'re under 18, we\'ll ask a parent or guardian to verify their identity and confirm consent before your account is fully activated — a checkbox alone isn\'t enough under Indian law. Until that\'s done, we only use the minimum data needed to complete this step.' },
      { q: 'Does Code Plus Academy show ads or track behavior for under-18 users?', a: 'No. Accounts belonging to users under 18 have analytics tracking, behavioral profiling, and targeted advertising switched off — this isn\'t a setting you need to change, it\'s off by default and can\'t be turned on.' },
      { q: 'Can my parent withdraw their consent later?', a: 'Yes. A parent or guardian can contact our Grievance Officer at any time to withdraw consent, which may lead to the account being suspended and the associated data being erased.' }
    ],
  },
  {
    category: 'Content, Copyright & Reporting',
    items: [
      { q: 'How is content on Code Plus Academy sourced?', a: 'Three ways: (1) embedded from third-party platforms like YouTube using official embed codes — we don\'t host this content ourselves; (2) hosted directly on our servers with explicit written permission from the creator; (3) uploaded by users themselves (notes, study materials).' },
      { q: 'I think something on the Platform infringes my copyright. What do I do?', a: 'Use the "Report" button on the specific video, article, profile, or document, and select "Copyright/IP infringement." You can also email our Grievance Officer directly — see the Grievance Officer & Copyright Complaints page for what to include.' },
      { q: 'What happens after I report something?', a: 'You\'ll get an acknowledgment within 24 hours. Our moderation team reviews the case, checks any evidence, and makes a decision — removal, restriction, or dismissal — typically within 15 days, faster for clear-cut cases. If the complaint comes via a court order or an authorized government notice, we act within 36 hours as required by law.' },
      { q: 'Can I appeal a decision?', a: 'Yes. Whoever the decision affects — the person who reported, or the content owner — can file one appeal. If you\'re still not satisfied after that, we\'ll tell you how to escalate to the government\'s Grievance Appellate Committee.' },
      { q: 'Can I upload my own notes or study materials?', a: 'Yes, but you must confirm you own the copyright or have permission before uploading — we\'ll ask you to check a confirmation box each time. We don\'t pre-screen every upload, but we act quickly on valid reports.' },
      { q: 'What happens if I upload something I don\'t have rights to?', a: 'It gets removed once a valid report is upheld, and it counts as a strike against your account. Three upheld strikes and your account may be suspended or terminated.' }
    ],
  },
  {
    category: 'Privacy & Your Data',
    items: [
      { q: 'What personal data does Code Plus Academy collect?', a: 'Basics like your name, email, and account details; if you\'re a Creator, your PAN and banking details for payments; and standard technical data like IP address and device/browser info. Full details are in our Privacy Policy.' },
      { q: 'How can I access, correct, or delete my data?', a: 'Go to Account Settings → My Data. You can request an export, correct your own profile fields directly, or request erasure. Some fields route to a support case if they can\'t be self-edited — you\'ll see the status in "My Reports."' },
      { q: 'Can I withdraw my consent?', a: 'Yes, for anything that isn\'t strictly necessary to run your account (like marketing emails) — there\'s a toggle in My Data. Withdrawing some consents may limit what you can do on the Platform; we\'ll tell you what, before you confirm.' },
      { q: 'Does Code Plus Academy use cookies?', a: 'Yes — see our Cookie Policy for the categories we use and how to manage your preferences.' }
    ],
  },
  {
    category: 'Support & Grievances',
    items: [
      { q: 'Who do I contact with a complaint?', a: 'Our Grievance Officer — contact details and process are on the Grievance Officer & Copyright Complaints page.' },
      { q: 'What\'s the difference between "Report" and contacting the Grievance Officer directly?', a: 'They reach the same place. The Report button is the fastest way to flag a specific piece of content; emailing the Grievance Officer works for anything else, including formal legal notices.' },
      { q: 'How do I check the status of my case?', a: '"My Reports" in your account shows every case you\'ve filed and where it stands — acknowledged, under review, decided, appealed, or closed — along with the timeline we\'re working to.' }
    ]
  }
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
          <p style={{ color: 'var(--dim)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 8 }}>Last updated: July 2026</p>
        </div>
        <div className="card" style={{ padding: 32 }}>
          <div className="prose">
            {[
              { title: '1. Information We Collect', content: 'We collect information you provide directly: name, email, username, bio, avatar, and content you post. In compliance with the DPDP Act 2023, we collect and verify the Date of Birth (DoB) for age classification, and collect parental/guardian emails for users under 18 to seek verifiable consent.' },
              { title: '2. Children\'s Data & Parental Consent', content: 'Under the DPDP Act 2023, processing of personal data for minors (under 18) requires verifiable parental/guardian consent. For minor accounts, all tracking, profiling, and behavioral advertising cookies are hard-disabled, and they are restricted from publishing public professional content until approved.' },
              { title: '3. Secure Creator Payment Details', content: 'For professional creators, we collect PAN numbers and bank/UPI details to process payouts. These details are stored securely using AES-256 encryption at rest. To prevent over-collection of sensitive identity details, Aadhaar card numbers are strictly excluded and blocked from collection.' },
              { title: '4. Cookie Preferences & Tracking', content: 'We support granular cookie preferences (Essential, Functional, Analytics, Advertising). You can manage or withdraw consent for non-essential cookies under Settings at any time.' },
              { title: '5. Data Principal Rights', content: 'Under the DPDP Act 2023, you (as a Data Principal) have the right to access/export your data in a structured format, correct inaccurate details, and request erasure (deletion) of your account and personal data. These rights can be exercised directly via Settings → Privacy & Data Control.' },
              { title: '6. Grievance Redressal', content: 'For privacy grievances or rights requests, contact our designated Grievance Officer at grievance@codeplusacademy.in. Acknowledgement is sent within 24 hours, and resolutions are completed within 15 days.' },
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
          <p style={{ color: 'var(--dim)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 8 }}>Last updated: July 2026</p>
        </div>
        <div className="card" style={{ padding: 32 }}>
          <div className="prose">
            {[
              { title: '1. Acceptance of Terms', content: 'By using Code+ Academy, you agree to these Terms of Service. If you do not agree, please do not use the platform.' },
              { title: '2. Account Responsibilities', content: 'You are responsible for maintaining the security of your account and all activity under it. You must provide accurate information during registration, including your real Date of Birth.' },
              { title: '3. Content Policy & Moderation (IT Rules 2021)', content: 'Users may not post spam, malware, illegal content, or copyright-infringing works. In compliance with the IT Rules 2021, legal takedown notices (Court Orders or Government Directions) are actioned and resolved within 36 hours. Private complaints are actioned within 15 days.' },
              { title: '4. Intellectual Property & Copyright Consent', content: 'By uploading any resource to the Notes Arena, you declare that you own the rights to the uploaded material and that it does not violate any copyright or intellectual property rights. We log this compliance consent log on submission.' },
              { title: '5. Professional Creator Accounts', content: 'Professional creators agree to provide accurate descriptions of content. Paid payouts are subject to tax compliance verification (PAN card verification).' },
              { title: '6. Limitation of Liability', content: 'Code+ Academy is provided "as is" without warranties. We are not liable for any damages arising from use of the platform.' },
              { title: '7. Appeals & External Redressal', content: 'If your content is restricted or removed, you may appeal the decision once through the Support Desk. Escalations are reviewed by the Grievance Officer, and further appeals can be filed externally with the Government-appointed Grievance Appellate Committee (GAC) at https://gac.gov.in.' },
              { title: '8. Legal Contact', content: 'For legal queries, email legal@codeplusacademy.in' },
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
  const { user } = useAuth();
  const [tab, setTab] = useState('submit'); // 'submit', 'my_reports', 'content_reports', 'moderator'
  
  // Submit ticket state
  const [form, setForm] = useState({
    type: 'general-support',
    case_source: 'private_complainant',
    content_type: 'notes',
    content_id: '',
    category: 'General Inquiry',
    description: '',
    evidence_urls: '',
    reporter_email: ''
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState('');

  // Lists state
  const [myTickets, setMyTickets] = useState([]);
  const [contentTickets, setContentTickets] = useState([]);
  const [modTickets, setModTickets] = useState([]);
  
  // Detail state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [actions, setActions] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [appealReason, setAppealReason] = useState('');
  
  // Mod Action state
  const [modReason, setModReason] = useState('');
  const [issueStrike, setIssueStrike] = useState(false);

  const isModerator = user?.role === 'admin' || user?.role === 'moderator';

  // Load lists on tab change
  useEffect(() => {
    if (!user) return;
    if (tab === 'my_reports') {
      api.get('/support/my-reports')
        .then(res => setMyTickets(res.data?.cases || []))
        .catch(() => {});
    } else if (tab === 'content_reports') {
      api.get('/support/content-reports')
        .then(res => setContentTickets(res.data?.cases || []))
        .catch(() => {});
    } else if (tab === 'moderator' && isModerator) {
      api.get('/admin/cases')
        .then(res => setModTickets(res.data?.cases || []))
        .catch(() => {});
    }
  }, [tab, user]);

  const loadTicketDetails = async (id) => {
    try {
      const res = await api.get(`/support/cases/${id}`);
      setSelectedTicket(res.data.ticket);
      setActions(res.data.actions || []);
      setAppeals(res.data.appeals || []);
      setAppealReason('');
      setModReason('');
      setIssueStrike(false);
    } catch (e) {
      toast.error('Failed to load case details.');
    }
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        evidence_urls: form.evidence_urls ? form.evidence_urls.split('\n').filter(Boolean) : []
      };
      if (user) delete payload.reporter_email; // backend uses logged-in user email

      const res = await api.post('/support', payload);
      setCreatedTicketId(res.data.ticket.id);
      setSent(true);
      setForm({
        type: 'general-support',
        case_source: 'private_complainant',
        content_type: 'notes',
        content_id: '',
        category: 'General Inquiry',
        description: '',
        evidence_urls: '',
        reporter_email: ''
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealReason) return;
    try {
      await api.post(`/support/cases/${selectedTicket.id}/appeal`, { reason: appealReason });
      toast.success('Appeal submitted successfully.');
      loadTicketDetails(selectedTicket.id);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit appeal.');
    }
  };

  const handleModAction = async (actionType) => {
    if (!modReason) {
      toast.error('Please provide a justification reason.');
      return;
    }
    try {
      await api.patch(`/admin/cases/${selectedTicket.id}/action`, {
        action_type: actionType,
        reason: modReason,
        issue_strike: issueStrike
      });
      toast.success(`Action: ${actionType} recorded successfully.`);
      loadTicketDetails(selectedTicket.id);
      // Reload moderator list
      api.get('/admin/cases').then(res => setModTickets(res.data?.cases || []));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to record action.');
    }
  };

  const getSlaInfo = (ticket) => {
    if (ticket.status === 'closed') return { text: 'Resolved', urgent: false };
    const ms = new Date(ticket.sla_resolve_by) - new Date();
    if (ms < 0) return { text: 'SLA Expired (Overdue)', urgent: true };
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours < 24) {
      return { text: `${hours}h left`, urgent: true };
    }
    const days = Math.ceil(hours / 24);
    return { text: `${days} days left`, urgent: false };
  };

  return (
    <>
      <Helmet><title>Compliance & Support Desk — Code+ Academy</title></Helmet>
      <PageWrapper style={{ maxWidth: 960 }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)', marginBottom: 4 }}>// support_desk</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32 }}>Compliance & Support Desk</h1>
          <p style={{ color: 'var(--sub)', marginTop: 8 }}>File reports, track DPDP requests, and manage content moderation issues.</p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          <button onClick={() => { setTab('submit'); setSelectedTicket(null); }} style={{ background: tab === 'submit' ? 'var(--green)' : 'transparent', color: tab === 'submit' ? '#000' : 'var(--text)', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>
            Submit Ticket
          </button>
          {user && (
            <>
              <button onClick={() => { setTab('my_reports'); setSelectedTicket(null); }} style={{ background: tab === 'my_reports' ? 'var(--green)' : 'transparent', color: tab === 'my_reports' ? '#000' : 'var(--text)', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>
                My Filed Reports
              </button>
              <button onClick={() => { setTab('content_reports'); setSelectedTicket(null); }} style={{ background: tab === 'content_reports' ? 'var(--green)' : 'transparent', color: tab === 'content_reports' ? '#000' : 'var(--text)', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>
                Claims Against My Content
              </button>
            </>
          )}
          {isModerator && (
            <button onClick={() => { setTab('moderator'); setSelectedTicket(null); }} style={{ background: tab === 'moderator' ? 'rgba(138,43,255,0.2)' : 'transparent', color: tab === 'moderator' ? '#b47aff' : 'var(--text)', border: '1px solid #8a2bff', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>
              Moderator Dashboard
            </button>
          )}
        </div>

        {/* Selected Ticket Detail Overlay / View */}
        {selectedTicket ? (
          <div className="card" style={{ padding: 28 }}>
            <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', fontSize: 13, marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              &larr; Back to List
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
              
              {/* Left Column: Details & Audit Trail */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--sub)', fontFamily: 'var(--font-mono)' }}>{selectedTicket.id}</span>
                  <span style={{
                    background: selectedTicket.status === 'closed' ? 'rgba(34,197,94,0.15)' : 'rgba(232,160,32,0.15)',
                    color: selectedTicket.status === 'closed' ? '#22c55e' : '#eab308',
                    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase'
                  }}>{selectedTicket.status}</span>
                </div>
                
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>{selectedTicket.category}</h2>
                <p style={{ fontSize: 14, color: 'var(--sub)', lineHeight: 1.6, marginBottom: 20, whiteSpace: 'pre-wrap' }}>{selectedTicket.description}</p>
                
                {selectedTicket.content_id && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 20 }}>
                    <span style={{ fontSize: 11, color: 'var(--sub)', display: 'block' }}>Reported Content Info</span>
                    <strong style={{ fontSize: 13, color: 'var(--text)' }}>Type: {selectedTicket.content_type.toUpperCase()}</strong>
                    <span style={{ fontSize: 11, color: 'var(--dim)', display: 'block', wordBreak: 'break-all' }}>ID: {selectedTicket.content_id}</span>
                  </div>
                )}

                {/* Audit Actions Log */}
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>Case History & Logs</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {actions.map(act => (
                    <div key={act.id} style={{ fontSize: 12, borderLeft: '2px solid var(--border)', paddingLeft: 12, paddingBottom: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--dim)' }}>
                        <strong>{act.action_type.toUpperCase()}</strong>
                        <span>{new Date(act.created_at).toLocaleString()}</span>
                      </div>
                      <p style={{ margin: '4px 0 0', color: 'var(--sub)' }}>{act.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: SLA Timer, Appeals, or Mod actions */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                {/* SLA Clock */}
                {(() => {
                  const sla = getSlaInfo(selectedTicket);
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 8, background: sla.urgent ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${sla.urgent ? '#ef4444' : 'var(--border)'}`, marginBottom: 20 }}>
                      <Clock size={16} color={sla.urgent ? '#ef4444' : 'var(--sub)'} />
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--sub)', display: 'block' }}>Resolution Deadline (SLA)</span>
                        <strong style={{ fontSize: 14, color: sla.urgent ? '#ef4444' : 'var(--text)' }}>{sla.text}</strong>
                      </div>
                    </div>
                  );
                })()}

                {/* MODERATOR CONTROL PANEL */}
                {tab === 'moderator' && isModerator && selectedTicket.status !== 'closed' && (
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>Moderator Actions</h3>
                    
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 11, color: 'var(--sub)', display: 'block', marginBottom: 6 }}>Action Justification Reason</label>
                      <textarea
                        value={modReason}
                        onChange={(e) => setModReason(e.target.value)}
                        placeholder="Provide details for why this action is being taken..."
                        rows={3}
                        required
                        style={{ width: '100%', resize: 'vertical' }}
                      />
                    </div>

                    {selectedTicket.type === 'copyright' && (
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
                          <input
                            type="checkbox"
                            checked={issueStrike}
                            onChange={(e) => setIssueStrike(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ color: '#f59e0b', fontWeight: 600 }}>Issue Copyright Strike to Uploader</span>
                        </label>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button onClick={() => handleModAction('acknowledge')} className="btn-secondary" style={{ fontSize: 12, padding: 8 }}>Acknowledge</button>
                      <button onClick={() => handleModAction('dismiss')} className="btn-secondary" style={{ fontSize: 12, padding: 8 }}>Dismiss Report</button>
                      {selectedTicket.content_id && (
                        <button onClick={() => handleModAction('remove_content')} className="btn-primary" style={{ gridColumn: 'span 2', background: '#ef4444', color: '#fff', fontSize: 12, padding: 8 }}>Remove Content</button>
                      )}
                      <button onClick={() => handleModAction('close')} className="btn-primary" style={{ gridColumn: 'span 2', fontSize: 12, padding: 8 }}>Close Case (Resolved)</button>
                    </div>
                  </div>
                )}

                {/* USER APPEAL PANEL */}
                {tab !== 'moderator' && (selectedTicket.status === 'action_taken' || selectedTicket.status === 'dismissed') && (
                  <div>
                    {appeals.length > 0 ? (
                      <div style={{ background: 'rgba(34,197,94,.1)', padding: 12, borderRadius: 8, border: '1px solid rgba(34,197,94,.2)' }}>
                        <h4 style={{ margin: '0 0 4px', color: '#22c55e' }}>Appeal Filed</h4>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--sub)' }}>An appeal is currently pending review. Decisions will be finalized within 15 days.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleAppealSubmit}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>File an Appeal</h3>
                        <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 12 }}>You are entitled to file 1 appeal against this decision. Appeal reviews are escalated to senior operations managers.</p>
                        
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 11, color: 'var(--sub)', display: 'block', marginBottom: 6 }}>Grounds for Appeal</label>
                          <textarea
                            value={appealReason}
                            onChange={(e) => setAppealReason(e.target.value)}
                            placeholder="State clearly why the content removal or dismissal was incorrect..."
                            rows={3}
                            required
                            style={{ width: '100%', resize: 'vertical' }}
                          />
                        </div>

                        <button type="submit" className="btn-primary" style={{ width: '100%', padding: 10 }}>
                          Submit Appeal
                        </button>
                      </form>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        ) : (
          /* List Views */
          <div>
            
            {/* 1. SUBMIT TICKET TAB */}
            {tab === 'submit' && (
              <div>
                {sent ? (
                  <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Grievance Filed</h2>
                    <p style={{ color: 'var(--sub)', marginBottom: 16 }}>Your report has been successfully logged under Ticket ID: <strong>{createdTicketId}</strong>.</p>
                    <p style={{ fontSize: 13, color: 'var(--dim)' }}>An automated email acknowledgement has been sent to your address. Standard grievances are reviewed within 15 days.</p>
                    <button onClick={() => setSent(false)} className="btn-secondary" style={{ marginTop: 20, padding: '8px 16px' }}>Submit Another Report</button>
                  </div>
                ) : (
                  <div className="card" style={{ padding: 28 }}>
                    <form onSubmit={handleTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 11, color: 'var(--sub)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6 }}>// Report Type</label>
                          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, category: e.target.value === 'copyright' ? 'Copyright Claim' : 'General Inquiry' })} style={{ width: '100%' }}>
                            <option value="general-support">General Support / Inquiry</option>
                            <option value="copyright">Copyright Infringement (DMCA/IP)</option>
                            <option value="harassment">Harassment / Code of Conduct</option>
                            <option value="privacy-access">DPDP: Request Data Access</option>
                            <option value="privacy-correction">DPDP: Request Data Correction</option>
                            <option value="privacy-erasure">DPDP: Request Data Erasure</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: 'var(--sub)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6 }}>// Track / Priority</label>
                          <select value={form.case_source} onChange={e => setForm({ ...form, case_source: e.target.value })} style={{ width: '100%' }}>
                            <option value="private_complainant">Standard Private Complainant (15d SLA)</option>
                            {isModerator && (
                              <>
                                <option value="government_notice">Authorized Government Notice (36h SLA)</option>
                                <option value="court_order">Official Court Order (36h SLA)</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>

                      {form.type === 'copyright' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                          <div>
                            <label style={{ fontSize: 11, color: 'var(--sub)', display: 'block', marginBottom: 6 }}>Content Type</label>
                            <select value={form.content_type} onChange={e => setForm({ ...form, content_type: e.target.value })} style={{ width: '100%' }}>
                              <option value="notes">Document / Uploaded PDF</option>
                              <option value="video">Course Video</option>
                              <option value="article">Written Article</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: 'var(--sub)', display: 'block', marginBottom: 6 }}>Content ID / Resource Slug</label>
                            <input value={form.content_id} onChange={e => setForm({ ...form, content_id: e.target.value })} placeholder="e.g. 1a2b3c... or slug" required />
                          </div>
                        </div>
                      )}

                      {!user && (
                        <div>
                          <label style={{ fontSize: 11, color: 'var(--sub)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6 }}>// Your Email Address</label>
                          <input type="email" value={form.reporter_email} onChange={e => setForm({ ...form, reporter_email: e.target.value })} placeholder="you@domain.com" required />
                        </div>
                      )}

                      <div>
                        <label style={{ fontSize: 11, color: 'var(--sub)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6 }}>// Subject / Category</label>
                        <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Brief title of the issue" required />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, color: 'var(--sub)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6 }}>// Description & Detailed Proof</label>
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Please provide specific links, details, and details about your copyright ownership or support inquiry..." rows={5} required style={{ resize: 'vertical', width: '100%' }} />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, color: 'var(--sub)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6 }}>// Proof Links / Verification URLs (One per line)</label>
                        <textarea value={form.evidence_urls} onChange={e => setForm({ ...form, evidence_urls: e.target.value })} placeholder="e.g. link-to-original-work-copyright-url" rows={2} style={{ resize: 'vertical', width: '100%' }} />
                      </div>

                      <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '11px', gap: 6 }}>
                        <Send size={14} /> {loading ? 'Filing Grievance...' : 'Submit Report'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* 2. MY REPORTS LIST */}
            {tab === 'my_reports' && (
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>My Filed Reports</h3>
                {myTickets.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--sub)' }}>You haven't filed any support reports or grievances yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {myTickets.map(t => (
                      <div key={t.id} onClick={() => loadTicketDetails(t.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ fontSize: 13, color: 'var(--text)' }}>{t.category}</strong>
                            <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>{t.id}</span>
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--dim)' }}>Filed on {new Date(t.created_at).toLocaleDateString()}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>{t.status.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. CLAIMS AGAINST MY CONTENT */}
            {tab === 'content_reports' && (
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Intellectual Property / Copyright Claims</h3>
                <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 16 }}>Copyright takedowns or grievances filed against your uploaded resources.</p>
                {contentTickets.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--sub)' }}>No copyright claims or reports have been filed against your content.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {contentTickets.map(t => (
                      <div key={t.id} onClick={() => loadTicketDetails(t.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ fontSize: 13, color: 'var(--text)' }}>{t.category}</strong>
                            <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>{t.id}</span>
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--dim)' }}>Filed on {new Date(t.created_at).toLocaleDateString()}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>{t.status.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. MODERATOR DASHBOARD */}
            {tab === 'moderator' && isModerator && (
              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Grievance Queue (Moderator Panel)</h3>
                  <span style={{ fontSize: 11, color: 'var(--dim)' }}>Sort: SLA Deadline (Oldest First)</span>
                </div>
                {modTickets.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--sub)' }}>No open cases or grievances currently in the queue.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {modTickets.map(t => {
                      const isEmergency = t.case_source === 'court_order' || t.case_source === 'government_notice';
                      return (
                        <div key={t.id} onClick={() => loadTicketDetails(t.id)} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px',
                          background: isEmergency ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isEmergency ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
                          borderRadius: 8, cursor: 'pointer'
                        }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong style={{ fontSize: 13, color: 'var(--text)' }}>{t.category}</strong>
                              <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>{t.id}</span>
                              {isEmergency && <span style={{ fontSize: 10, background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>36H SLA</span>}
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--dim)' }}>Source: {t.case_source.replace('_', ' ')} · Filed {new Date(t.created_at).toLocaleDateString()}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>{t.status.toUpperCase()}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </PageWrapper>
      <Footer />
    </>
  );
}

export function GrievanceOfficer() {
  return (
    <>
      <Helmet><title>Grievance Officer & Copyright Complaints — Code+ Academy</title></Helmet>
      <PageWrapper style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)', marginBottom: 4 }}>// legal</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32 }}>Grievance Redressal & Copyright Complaints</h1>
          <p style={{ color: 'var(--dim)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 8 }}>In compliance with Information Technology Rules 2021 & DPDP Act 2023</p>
        </div>
        
        <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 24 }}>
          Code Plus Academy is committed to addressing your concerns quickly and fairly. This page explains how to raise a complaint, what happens next, and how to escalate if you're not satisfied.
        </p>

        <div className="card" style={{ padding: 32, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>Our Grievance Officer</h2>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 10, border: '1px solid var(--border)', lineHeight: 1.8 }}>
            <strong>Name:</strong> Mr. Atharva Kapse<br/>
            <strong>Designation:</strong> Grievance Officer<br/>
            <strong>Email:</strong> <a href="mailto:grievance@codeplusacademy.in" style={{ color: 'var(--green)' }}>grievance@codeplusacademy.in</a><br/>
            <strong>Address:</strong> Code Plus Academy Compliance Desk, Pune, Maharashtra, India.
          </div>
        </div>

        <div className="card" style={{ padding: 32, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>What we handle here</h2>
          <ul style={{ color: 'var(--sub)', lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Copyright and intellectual property complaints about any content on the Platform — embedded, creator-hosted, or user-uploaded</li>
            <li>Other content complaints, such as harassment or misinformation</li>
            <li>Requests about your personal data — access, correction, erasure, or withdrawing consent</li>
          </ul>
        </div>

        <div className="card" style={{ padding: 32, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>What happens after you file a complaint</h2>
          <ol style={{ color: 'var(--sub)', lineHeight: 1.8, paddingLeft: 20 }}>
            <li><strong>Acknowledged</strong> within 24 hours.</li>
            <li><strong>Reviewed</strong> by our moderation team, including any evidence you've provided.</li>
            <li><strong>Decided</strong> — typically within 15 days; within 36 hours if the complaint comes via a court order or authorized government notice, as required under Rule 3(1)(d) of the IT Rules, 2021.</li>
            <li><strong>Appeal</strong> — if you disagree with the decision, you can appeal once within 7 days.</li>
            <li><strong>Escalate</strong> — if you're still not satisfied after our internal appeal, you can escalate to the Grievance Appellate Committee, a government-run body, at <a href="https://gac.gov.in" target="_blank" rel="noreferrer" style={{ color: 'var(--green)' }}>https://gac.gov.in</a>.</li>
          </ol>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>How to file a copyright complaint</h2>
          <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 16 }}>
            Use the "Report" button on the specific video, article, profile, or document — or email us directly with:
          </p>
          <ul style={{ color: 'var(--sub)', lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Identification of your copyrighted work and the URL of the material you believe infringes it</li>
            <li>Your contact details and proof of ownership or authorization</li>
            <li>A statement, under penalty of perjury, that the use is unauthorized</li>
            <li>Your signature (physical or electronic)</li>
          </ul>
        </div>
      </PageWrapper>
      <Footer />
    </>
  );
}

export function CookiePolicy() {
  return (
    <>
      <Helmet><title>Cookie Policy — Code+ Academy</title></Helmet>
      <PageWrapper style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)', marginBottom: 4 }}>// legal</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32 }}>Cookie Policy</h1>
          <p style={{ color: 'var(--dim)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 8 }}>Last updated: July 2026</p>
        </div>

        <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 24 }}>
          This page explains how Code Plus Academy uses cookies and similar technologies, and how you can control them.
        </p>

        <div className="card" style={{ padding: 32, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>What are cookies?</h2>
          <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
            Small files stored on your device that help websites remember information about your visit — like whether you're logged in, or your language preference.
          </p>
        </div>

        <div className="card" style={{ padding: 32, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>Categories we use</h2>
          <ul style={{ color: 'var(--sub)', lineHeight: 1.8, paddingLeft: 20 }}>
            <li><strong>Essential</strong> — required for the Platform to work (e.g. keeping you signed in). Always on.</li>
            <li><strong>Functional</strong> — remembers your preferences.</li>
            <li><strong>Analytics</strong> — helps us understand how the Platform is used, so we can improve it.</li>
            <li><strong>Advertising</strong> — used to show relevant ads and measure how well they perform.</li>
          </ul>
        </div>

        <div className="card" style={{ padding: 32, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>Your choices</h2>
          <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
            Accept or reject non-essential categories any time via the cookie banner, or the Cookie Preferences link in the footer. Rejecting a category is just as easy as accepting it.
          </p>
        </div>

        <div className="card" style={{ padding: 32, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>Accounts under 18</h2>
          <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
            Analytics and Advertising cookies are switched off by default and cannot be enabled for accounts registered as belonging to a User under 18, in line with our obligations under the Digital Personal Data Protection Act, 2023.
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>Embedded content</h2>
          <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
            Some pages embed videos or other content from third parties (e.g. YouTube). These providers may set their own cookies when you interact with that content. We don't control these cookies — check the relevant third party's own policy for details.
          </p>
        </div>
      </PageWrapper>
      <Footer />
    </>
  );
}
