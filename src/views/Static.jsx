'use client';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronDown, Send, AlertCircle, Clock, ShieldAlert, Scale, AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const faqData = [
  {
    category: 'General & Accounts',
    items: [
      {
        q: 'Who can create an account?',
        a: 'You must be at least 18 to create an account yourself. If you\'re between 13 and 18, you can use the Platform, but a parent or legal guardian needs to verify their identity and give consent first — a checkbox alone isn\'t enough under Indian law. We don\'t permit accounts for anyone under 13.'
      },
      {
        q: 'Does Code Plus Academy track or advertise to users under 18?',
        a: 'No. Accounts belonging to Users under 18 have analytics tracking, profiling, and targeted advertising switched off by default, and this cannot be enabled.'
      },
      {
        q: 'How can I access, correct, or delete my personal data?',
        a: 'Go to Account Settings → My Data to request an export, correct your details, or request deletion — or contact our Grievance Officer directly. We may retain certain data as required by Indian law (e.g., financial records) even after a deletion request.'
      },
      {
        q: 'Does Code Plus Academy use cookies?',
        a: 'Yes — see our Cookie Policy for the categories we use and how to manage your preferences. Analytics and advertising cookies are always off for accounts under 18.'
      }
    ]
  },
  {
    category: 'Content & Copyright',
    items: [
      {
        q: 'Can I upload any PDF, book, or note I find online?',
        a: 'No. You may only upload content you created yourself, that\'s in the public domain, or that you have explicit written permission to share. Uploading pirated textbooks, scanned books, or paid course materials is strictly prohibited.'
      },
      {
        q: 'Does Code Plus Academy own the notes or documents I upload?',
        a: 'No. You retain full ownership. By uploading, you grant us a license to store, display, and distribute your content on the Platform.'
      },
      {
        q: 'What happens if someone claims my uploaded document infringes their copyright?',
        a: 'It depends on how the complaint reaches us. If it\'s a court order or an authorized government notice, we act within 36 hours as required by law. For an ordinary complaint from a rightsholder, we acknowledge it within 24 hours and resolve it within 15 days, usually faster for clear-cut cases. See our Copyright Policy for the full process, including how to appeal.'
      },
      {
        q: 'How do I report a copyright violation on the Platform?',
        a: 'Use the "Report" button next to the specific content, or email our Grievance Officer at grievance@codeplusacademy.in with the details outlined in our Copyright Policy.'
      },
      {
        q: 'Do you check every uploaded file for copyright before it goes live?',
        a: 'No. We act as an intermediary and don\'t pre-screen every upload — responsibility for the content rests with the User who uploads it. We act quickly once we receive a valid complaint.'
      }
    ]
  },
  {
    category: 'Moderation & Outcomes',
    items: [
      {
        q: 'What if I disagree with a moderation decision?',
        a: 'You can file an appeal with our Grievance Officer, as described in our Copyright Policy. If you\'re still not satisfied, you can escalate to the government\'s Grievance Appellate Committee.'
      },
      {
        q: 'Do you guarantee I will get a job or pass an exam using your resources?',
        a: 'No. Code Plus Academy provides educational resources for learning purposes only. We don\'t guarantee outcomes, certifications, or employment, and code/technical content is provided "AS IS."'
      }
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
      <Helmet><title>FAQ — Code Plus Academy</title></Helmet>
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
    </>
  );
}

export function Privacy() {
  return (
    <>
      <Helmet><title>Privacy Policy — Code Plus Academy</title></Helmet>
      <PageWrapper style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)', marginBottom: 4 }}>// legal</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32 }}>Privacy Policy</h1>
          <p style={{ color: 'var(--dim)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 8 }}>Effective Date: July 15, 2026 | Last Updated: July 15, 2026</p>
        </div>
        <div className="card" style={{ padding: 32 }}>
          <div className="prose" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
              This Privacy Policy is issued by <strong>Code Plus Academy Private Limited</strong>, which acts as a "Data Fiduciary" under the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>. It explains how we collect, process, and protect your "Personal Data" as a "Data Principal."
            </p>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>1. Personal Data We Collect</h2>
              <ul style={{ color: 'var(--sub)', lineHeight: 1.8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li><strong>Directly from You:</strong> Name, email address, phone number, educational background, account credentials, and your date of birth (used to determine whether the additional protections in Section 3 apply).</li>
                <li><strong>Creator Data:</strong> If you are a content creator, we collect your PAN and banking details for tax and payment processing, and your signed licensing agreement. We do not collect or store your Aadhaar number unless a specific legal requirement makes this necessary, in which case it is collected and stored separately from our general systems in accordance with applicable law and UIDAI guidance.</li>
                <li><strong>Uploaded Content Data:</strong> If you upload documents or files, we collect the file itself, associated metadata (file name, upload time, file identifier), and a record of your confirmation that you own the rights or are authorized to share it.</li>
                <li><strong>Automatically:</strong> IP address, device type, browser information, and usage data via cookies and similar technologies — see our Cookie Policy.</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>2. Purpose of Processing & Consent</h2>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 12 }}>
                We process your Personal Data only for lawful, specified purposes, including: providing educational services, executing creator licensing agreements, processing payments, sending service-related notifications, and complying with legal obligations under the IT Act, 2000, and the DPDP Act, 2023.
              </p>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
                <strong>Consent:</strong> By using the Platform, you provide free, specific, informed, and unambiguous consent for us to process your data. You may withdraw consent at any time via Account Settings → My Data, or by contacting our Grievance Officer. Withdrawal may limit your ability to use the Platform.
              </p>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>3. Children's Personal Data</h2>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 12 }}>
                Any User under the age of 18 is a "child" under the DPDP Act, 2023. Before we process a child's personal data, we require verifiable consent from a parent or lawful guardian, obtained through verifying parental credentials or government-approved ID checks. Until this consent is verified, we process only the minimum data necessary to complete the verification step.
              </p>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 12 }}>We do not:</p>
              <ul style={{ color: 'var(--sub)', lineHeight: 1.8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                <li>Undertake behavioral monitoring or tracking of children;</li>
                <li>Show children targeted advertisements; or</li>
                <li>Engage in profiling of children that could cause them detriment,</li>
              </ul>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
                except where explicitly permitted under applicable law. A parent or guardian may withdraw consent at any time by contacting our Grievance Officer, which may result in suspension of the child's account and erasure of their data as described in Section 5.
              </p>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>4. Sharing and Disclosure of Data</h2>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 12 }}>
                We do not sell your Personal Data. We may share it with:
              </p>
              <ul style={{ color: 'var(--sub)', lineHeight: 1.8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li><strong>Service Providers:</strong> Hosting providers, payment gateways, and analytics services bound by confidentiality agreements.</li>
                <li><strong>Embedded Content Providers:</strong> Third-party platforms (e.g., YouTube) may collect data directly when you interact with their embedded content. We do not control their data practices.</li>
                <li><strong>Legal Authorities:</strong> When required by law, court order, or government directive.</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>5. Data Principal Rights (DPDP Act, 2023)</h2>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 12 }}>You have the right to:</p>
              <ol style={{ color: 'var(--sub)', lineHeight: 1.8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                <li><strong>Access:</strong> Obtain a summary of the Personal Data we hold about you.</li>
                <li><strong>Correction & Erasure:</strong> Request correction of inaccurate data, or request erasure, unless retention is necessary for legal compliance.</li>
                <li><strong>Grievance Redressal:</strong> Raise grievances regarding your Personal Data.</li>
              </ol>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
                You can exercise these rights directly through Account Settings → My Data, or by contacting our Grievance Officer. We aim to action Access and Correction requests promptly, and otherwise follow the timelines in Section 6.
              </p>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>6. Grievance Officer</h2>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 12 }}>
                In compliance with the IT (Intermediary Guidelines) Rules, 2021, and the DPDP Act, 2023, we have appointed a Grievance Officer, who handles both content-related grievances (including copyright complaints — see our Copyright Policy) and privacy/data requests. We acknowledge grievances within 24 hours and resolve them within 15 days.
              </p>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: 16, borderRadius: 8, lineHeight: 1.8 }}>
                <strong>Name:</strong> Mr. Atharva Kapse<br/>
                <strong>Designation:</strong> Grievance Officer<br/>
                <strong>Email:</strong> <a href="mailto:grievance@codeplusacademy.in" style={{ color: 'var(--green)' }}>grievance@codeplusacademy.in</a>
              </div>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>7. Data Security, Retention & Transfers</h2>
              <ul style={{ color: 'var(--sub)', lineHeight: 1.8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li><strong>7.1. Security:</strong> We implement reasonable security practices (aligned with ISO/IEC 27001 and IT Act rules) to protect your data.</li>
                <li><strong>7.2. Retention:</strong> We retain Personal Data only as long as necessary for the purposes of this Policy, or as required by Indian law (e.g., 8 years for financial records under the Companies Act).</li>
                <li><strong>7.3. Cross-Border Transfers:</strong> Your data is primarily stored in India. We may transfer data outside India only to jurisdictions not restricted by the Central Government under the DPDP Act, 2023.</li>
              </ul>
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}

export function Terms() {
  return (
    <>
      <Helmet><title>Terms & Conditions — Code Plus Academy</title></Helmet>
      <PageWrapper style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)', marginBottom: 4 }}>// legal</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32 }}>Terms and Conditions</h1>
          <p style={{ color: 'var(--dim)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 8 }}>Effective Date: July 15, 2026 | Last Updated: July 15, 2026</p>
        </div>
        <div className="card" style={{ padding: 32 }}>
          <div className="prose" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
              Welcome to <strong>Code Plus Academy</strong> ("Platform", "we", "us", or "our"). These Terms and Conditions ("Terms") govern your access to and use of the Code Plus Academy website, applications, and services. By accessing or using the Platform, you ("User", "you", or "your") agree to be bound by these Terms. If you do not agree, you must not use the Platform.
            </p>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>1. Definitions</h2>
              <ul style={{ color: 'var(--sub)', lineHeight: 1.8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li><strong>"Platform"</strong> refers to Code Plus Academy, operated by <strong>Code Plus Academy Private Limited</strong>, a company registered under the Companies Act, 2013.</li>
                <li><strong>"Embedded Content"</strong> refers to third-party content displayed via official embed codes, iframes, or APIs, which remains hosted on the original third-party server.</li>
                <li><strong>"Creator-Hosted Content"</strong> refers to content hosted on our servers pursuant to a direct, written license from the original copyright owner.</li>
                <li><strong>"Uploaded Content"</strong> refers to documents, notes, or files uploaded directly by Users to the Platform.</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>2. Eligibility and Accounts</h2>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 8 }}>
                <strong>2.1.</strong> You must be at least 18 years of age to create an account. Users between 13 and 18 may use the Platform only with the explicit consent of a parent or legal guardian, verified as described in our Privacy Policy. We do not permit accounts for Users under 13.
              </p>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
                <strong>2.2.</strong> You are solely responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
              </p>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>3. Educational and Professional Disclaimer</h2>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 8 }}>
                <strong>3.1. No Guarantee of Outcomes:</strong> Code Plus Academy provides educational content, coding tutorials, and technical resources. We do not guarantee specific educational outcomes, certifications, or employment.
              </p>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
                <strong>3.2. Code Execution:</strong> Any code snippets, scripts, or technical instructions are provided "AS IS" for educational purposes. We do not warrant that they will function correctly in your environment or are free of bugs or security vulnerabilities.
              </p>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>4. Content, Intellectual Property & Licensing</h2>
              <ul style={{ color: 'var(--sub)', lineHeight: 1.8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li><strong>4.1. Embedded Content:</strong> We do not host, store, or control Embedded Content, and claim no ownership over it. All trademarks and copyrights remain the property of their respective owners. We are not liable for the accuracy, legality, or availability of Embedded Content.</li>
                <li><strong>4.2. Creator-Hosted Content:</strong> Creators grant Code Plus Academy a non-exclusive, worldwide, royalty-free license to host and display their content, and warrant that they own the copyright or have secured all necessary third-party rights.</li>
                <li><strong>4.3. User-Uploaded Content:</strong> Users retain ownership of documents they upload. By uploading, you grant Code Plus Academy a non-exclusive, worldwide, royalty-free license to store, display, and distribute that content on the Platform.</li>
                <li><strong>4.4. Strict Prohibition on Piracy:</strong> Users are strictly prohibited from uploading pirated, scanned, or illegally distributed copies of copyrighted books, textbooks, paid courses, or proprietary materials without explicit, written authorization.</li>
                <li><strong>4.5. Upload Confirmation:</strong> Before uploading, you must confirm that you own the copyright to the content or have explicit permission to share it. This confirmation is logged and forms part of your agreement to these Terms.</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>5. User Conduct & Prohibited Activities</h2>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 8 }}>You agree NOT to:</p>
              <ul style={{ color: 'var(--sub)', lineHeight: 1.8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>Scrape, download, or extract content from the Platform using automated scripts or bots.</li>
                <li>Attempt to bypass the Terms of Service of third-party platforms whose content we embed.</li>
                <li>Upload malicious code, viruses, or material that infringes on third-party rights.</li>
                <li>Use the Platform for any unlawful purpose or to violate any applicable Indian law, including the Information Technology Act, 2000.</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>6. Intermediary Status and Safe Harbor</h2>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 8 }}>
                <strong>6.1.</strong> Code Plus Academy operates as an "intermediary" under Section 2(1)(w) of the Information Technology Act, 2000.
              </p>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 8 }}>
                <strong>6.2.</strong> We do not pre-screen, monitor, or verify the copyright status of Uploaded Content, and claim protection under Section 79 of the IT Act, 2000, and the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
              </p>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
                <strong>6.3.</strong> Upon receiving actual knowledge of infringing content, we act in accordance with our <strong>Copyright and Notice-and-Takedown Policy</strong>, which sets out the applicable timelines — including the distinct, shorter timeline that applies specifically to court orders and government notices — and the full process in detail.
              </p>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>7. Limitation of Liability & Indemnification</h2>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 8 }}>
                <strong>7.1. Limitation:</strong> To the maximum extent permitted by Indian law, Code Plus Academy shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the Platform.
              </p>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
                <strong>7.2. Indemnification:</strong> You agree to indemnify and hold harmless Code Plus Academy, its directors, and employees from any claims, damages, or legal fees arising out of your breach of these Terms, your violation of any Indian law, or your upload of infringing material.
              </p>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>8. Privacy</h2>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
                Your use of the Platform is also governed by our <strong>Privacy Policy</strong>, which explains how we collect, use, and protect your personal data, including additional protections for Users under 18.
              </p>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>9. Governing Law, Jurisdiction & Arbitration</h2>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 8 }}>
                <strong>9.1. Governing Law:</strong> These Terms are governed by the laws of the Republic of India.
              </p>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 8 }}>
                <strong>9.2. Arbitration:</strong> Disputes arising out of these Terms shall be resolved by binding arbitration under the Arbitration and Conciliation Act, 1996. The seat and venue shall be <strong>Pune</strong>, India, in English.
              </p>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
                <strong>9.3. Jurisdiction:</strong> Subject to arbitration, the courts at <strong>Pune</strong>, India, have exclusive jurisdiction.
              </p>
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}

export function Support() {
  const { user } = useAuth();
  const [tab, setTab] = useState('submit'); // 'submit', 'my_reports', 'content_reports'
  
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
  
  // Detail state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [actions, setActions] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [appealReason, setAppealReason] = useState('');

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
    }
  }, [tab, user]);

  const loadTicketDetails = async (id) => {
    try {
      const res = await api.get(`/support/cases/${id}`);
      setSelectedTicket(res.data.ticket);
      setActions(res.data.actions || []);
      setAppeals(res.data.appeals || []);
      setAppealReason('');
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



                {/* USER APPEAL PANEL */}
                {(selectedTicket.status === 'action_taken' || selectedTicket.status === 'dismissed') && (
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



          </div>
        )}

      </PageWrapper>
    </>
  );
}

export function GrievanceOfficer() {
  return (
    <>
      <Helmet><title>Copyright & Notice-and-Takedown Policy — Code Plus Academy</title></Helmet>
      <PageWrapper style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)', marginBottom: 4 }}>// legal</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32 }}>Copyright and Notice-and-Takedown Policy</h1>
          <p style={{ color: 'var(--dim)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 8 }}>Effective Date: July 15, 2026</p>
        </div>
        <div className="card" style={{ padding: 32 }}>
          <div className="prose" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
              Code Plus Academy respects the intellectual property rights of others and complies with the <strong>Copyright Act, 1957</strong>, and the <strong>Information Technology Act, 2000</strong>. We operate under a "Notice and Takedown" framework and do not pre-screen Uploaded Content for copyright status.
            </p>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>1. Reporting Copyright Infringement</h2>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 12 }}>
                If you believe that any content on Code Plus Academy — Embedded, Creator-Hosted, or User-Uploaded — infringes your copyright, use the "Report" button on the specific content, or submit a written notice to our Grievance Officer at <strong><a href="mailto:grievance@codeplusacademy.in" style={{ color: 'var(--green)' }}>grievance@codeplusacademy.in</a></strong> containing:
              </p>
              <ol style={{ color: 'var(--sub)', lineHeight: 1.8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>A physical or electronic signature of the copyright owner or authorized agent.</li>
                <li>Identification of the copyrighted work claimed to have been infringed.</li>
                <li>Identification of the infringing material, with sufficient detail (e.g., specific URL) to locate it.</li>
                <li>Your contact information (address, telephone number, and email).</li>
                <li>A statement that you have a good faith belief the use is not authorized by the copyright owner, its agent, or the law.</li>
                <li>A statement, under penalty of perjury, that the information is accurate and that you are authorized to act on behalf of the owner.</li>
              </ol>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>2. Our Response Timeline</h2>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 12 }}>
                We apply two different timelines, depending on how a complaint reaches us — this distinction matters and should not be collapsed into a single number:
              </p>
              <ul style={{ color: 'var(--sub)', lineHeight: 1.8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <li><strong>(a) Court Orders & Authorized Government Notices:</strong> Upon receiving actual knowledge via a court order or a notification from an authorized government officer (a Joint Secretary-rank official, or DIG-rank for police, under the current rules), we remove or disable access to the identified content within <strong>36 hours</strong>, in accordance with Rule 3(1)(d) of the IT Rules, 2021.</li>
                <li><strong>(b) All Other Valid Complaints</strong> (the typical case — a rightsholder or User reporting infringing content): we acknowledge the complaint within <strong>24 hours</strong> and act on it expeditiously, in any event within <strong>15 days</strong>, in line with our Grievance Redressal process. We aim to resolve clear, well-evidenced complaints faster than this in practice.</li>
              </ul>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginTop: 12 }}>
                In either case, we may act without prior notice to the uploading User where necessary to preserve our Safe Harbor protection under Section 79 of the IT Act, 2000, though we will generally notify the User once action is taken.
              </p>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>3. Appeal Procedure</h2>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 12 }}>
                If a User believes their content was removed in error or as a result of misidentification, they may submit an appeal to our Grievance Officer containing:
              </p>
              <ol style={{ color: 'var(--sub)', lineHeight: 1.8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                <li>Their physical or electronic signature.</li>
                <li>Identification of the removed material and its location prior to removal.</li>
                <li>A statement, under penalty of perjury, that they have a good faith belief the material was removed by mistake or misidentification.</li>
                <li>Their name, address, telephone number, and email address, and a statement consenting to the jurisdiction of Indian courts.</li>
              </ol>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
                We will review and respond to appeals within <strong>7 days</strong>. If you remain unsatisfied with the outcome, you may escalate to the <strong>Grievance Appellate Committee</strong>, a government-constituted body, within 30 days of our decision, at <strong><a href="https://gac.gov.in" target="_blank" rel="noreferrer" style={{ color: 'var(--green)' }}>https://gac.gov.in</a></strong>.
              </p>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>4. No Active Promotion of Infringing Content</h2>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
                Code Plus Academy does not manually feature, pin, or promote Uploaded Content that has been reported or is evidently an unauthorized copy of copyrighted material. Content surfaced to other Users is driven by material that has cleared our moderation process, not manual selection from an unreviewed pool.
              </p>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>5. Repeat Infringer Policy</h2>
              <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
                Code Plus Academy operates a strike-based repeat infringer policy. A User who receives three (3) upheld copyright removals will have their account suspended or permanently terminated, at our discretion. Users are notified at each strike.
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 10 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Official Grievance Officer Contact:</h3>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: 16, borderRadius: 8, lineHeight: 1.8 }}>
                <strong>Name:</strong> Mr. Atharva Kapse<br/>
                <strong>Designation:</strong> Grievance Officer<br/>
                <strong>Email:</strong> <a href="mailto:grievance@codeplusacademy.in" style={{ color: 'var(--green)' }}>grievance@codeplusacademy.in</a>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}

export function CookiePolicy() {
  return (
    <>
      <Helmet><title>Cookie Policy — Code Plus Academy</title></Helmet>
      <PageWrapper style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)', marginBottom: 4 }}>// legal</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32 }}>Cookie Policy</h1>
          <p style={{ color: 'var(--dim)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 8 }}>Last Updated: July 15, 2026</p>
        </div>

        <p style={{ color: 'var(--sub)', lineHeight: 1.8, marginBottom: 24 }}>
          This page explains how Code Plus Academy uses cookies and similar technologies, and how you can control them.
        </p>

        <div className="card" style={{ padding: 32, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>What Are Cookies?</h2>
          <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
            Small files stored on your device that help websites remember information about your visit — such as whether you're signed in, or your preferences.
          </p>
        </div>

        <div className="card" style={{ padding: 32, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>Categories We Use</h2>
          <ul style={{ color: 'var(--sub)', lineHeight: 1.8, paddingLeft: 20 }}>
            <li><strong>Essential</strong> — required for the Platform to function (e.g. keeping you signed in). Always on.</li>
            <li><strong>Functional</strong> — remembers your preferences.</li>
            <li><strong>Analytics</strong> — helps us understand how the Platform is used, so we can improve it.</li>
            <li><strong>Advertising</strong> — used to show relevant ads and measure their performance.</li>
          </ul>
        </div>

        <div className="card" style={{ padding: 32, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>Your Choices</h2>
          <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
            You can accept or reject non-essential categories at any time via our cookie banner, or the Cookie Preferences link in the footer. Rejecting a category is exactly as easy as accepting it.
          </p>
        </div>

        <div className="card" style={{ padding: 32, marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>Accounts Under 18</h2>
          <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
            Analytics and Advertising cookies are switched off by default and cannot be enabled for accounts registered as belonging to a User under 18, in line with our obligations under the Digital Personal Data Protection Act, 2023.
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 12 }}>Embedded Content</h2>
          <p style={{ color: 'var(--sub)', lineHeight: 1.8 }}>
            Some pages embed videos or other content from third parties (e.g. YouTube). These providers may set their own cookies when you interact with that content. We do not control these cookies — please refer to the relevant third party's own policy.
          </p>
        </div>
      </PageWrapper>
    </>
  );
}

export { default as AboutUs } from './AboutUs';
export { default as Contributors } from './Contributors';
export { default as Partners } from './Partners';

