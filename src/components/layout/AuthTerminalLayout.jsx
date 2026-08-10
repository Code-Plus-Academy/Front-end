import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HelpCircle } from 'lucide-react';

/*
 * AuthTerminalLayout — dark/light follows device theme via prefers-color-scheme.
 *
 * Strategy: CSS custom properties scoped to [data-auth-theme="dark/light"].
 * A useEffect reads window.matchMedia('(prefers-color-scheme: dark)') on mount
 * and subscribes to changes so switching OS theme live-updates the page.
 * No flash: the <style> block ships both themes; the attribute on <div> selects one.
 */

import { useState, useEffect } from 'react';

export default function AuthTerminalLayout({
  title,
  processName,
  pid,
  classNameName,
  description,
  onSubmit,
  logs = [],
  children,
  pageClassName = '',
  panelMaxWidth = 520,
  background, // optional ReactNode — renders as a fixed full-bleed layer behind everything (e.g. a WebGL background)
}) {
  const [theme, setTheme] = useState('dark'); // safe default for SSR

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mq.matches ? 'dark' : 'light');
    const handler = (e) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <>
      <Helmet><title>{`CPA | ${title}`}</title></Helmet>

      <style>{`
        /* ── Token map ───────────────────────────────────────────────────── */
        [data-auth-theme="dark"] {
          --bg:           #080808;
          --bg-header:    #0d0d1a;
          --bg-panel:     #0a0a0a;
          --bg-titlebar:  #111111;
          --bg-input:     #111111;
          --bg-social:    #111111;
          --bg-syslog:    #0d0d0d;
          --bg-footer:    #0d0d1a;
          --bg-error:     rgba(220,38,38,0.10);

          --border:       rgba(110,0,255,0.25);
          --border-top:   #6e00ff;
          --border-input: #374151;
          --border-social:#1f2937;
          --border-header:rgba(110,0,255,0.15);
          --border-footer:rgba(110,0,255,0.08);
          --border-syslog:#1f2937;
          --border-tb:    rgba(255,255,255,0.05);

          --text:         #e8edf2;
          --text-muted:   #a1a1aa;
          --text-dim:     #71717a;
          --text-dimmer:  #4b5563;
          --text-label:   #c084fc;
          --text-prompt:  #6e00ff;
          --text-time:    #6e00ff;
          --text-social:  #a1a1aa;
          --text-footer:  #71717a;

          --accent:       #6e00ff;
          --accent-hover: #7c10ff;
          --accent-link:  #a78bfa;
          --accent-link-h:#c4b5fd;
          --accent-bypass:#374151;
          --accent-cur:   #a855f7;

          --shadow: 0 0 60px rgba(110,0,255,0.08), 0 20px 40px rgba(0,0,0,0.6);
          --glow:   0 0 24px rgba(110,0,255,0.30);
          --glow-h: 0 0 36px rgba(110,0,255,0.45);

          --kw-class: #d0bcff;
          --kw-name:  #ffffff;
          --kw-brace: #9ca3af;

          --error-border: #ef4444;
          --error-text:   #fca5a5;
        }

        [data-auth-theme="light"] {
          --bg:           #f3f4f6;
          --bg-header:    #ffffff;
          --bg-panel:     #ffffff;
          --bg-titlebar:  #f9fafb;
          --bg-input:     #f9fafb;
          --bg-social:    #f9fafb;
          --bg-syslog:    #f3f4f6;
          --bg-footer:    #ffffff;
          --bg-error:     rgba(220,38,38,0.06);

          --border:       rgba(110,0,255,0.20);
          --border-top:   #6e00ff;
          --border-input: #d1d5db;
          --border-social:#e5e7eb;
          --border-header:rgba(110,0,255,0.12);
          --border-footer:rgba(110,0,255,0.08);
          --border-syslog:#e5e7eb;
          --border-tb:    rgba(0,0,0,0.06);

          --text:         #090d16;
          --text-muted:   #374151;
          --text-dim:     #4b5563;
          --text-dimmer:  #6b7280;
          --text-label:   #7c3aed;
          --text-prompt:  #6e00ff;
          --text-time:    #6e00ff;
          --text-social:  #374151;
          --text-footer:  #4b5563;

          --accent:       #6e00ff;
          --accent-hover: #5b00d6;
          --accent-link:  #7c3aed;
          --accent-link-h:#6e00ff;
          --accent-bypass:#9ca3af;
          --accent-cur:   #7c3aed;

          --shadow: 0 0 40px rgba(110,0,255,0.06), 0 8px 32px rgba(0,0,0,0.10);
          --glow:   0 0 20px rgba(110,0,255,0.18);
          --glow-h: 0 0 28px rgba(110,0,255,0.28);

          --kw-class: #7c3aed;
          --kw-name:  #111827;
          --kw-brace: #6b7280;

          --error-border: #ef4444;
          --error-text:   #b91c1c;
        }

        /* ── Layout ──────────────────────────────────────────────────────── */
        .auth-root {
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          transition: background 0.25s, color 0.25s;
        }
        .auth-header {
          background: var(--bg-header);
          border-radius: 40vw;
          margin: 12px;
          border-bottom: 1px solid var(--border-header);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        @media (max-width: 640px) {
          .auth-header {
            padding: 10px 14px;
            margin: 8px;
            gap: 8px;
          }
          .auth-nav-links {
            gap: 8px !important;
          }
          .auth-nav-links a {
            font-size: 12px !important;
            padding: 4px 10px !important;
            background: rgba(255, 255, 255, 0.08) !important;
            border-radius: 9999px !important;
          }
          .auth-badge {
            display: none !important;
          }
        }
        .auth-logo {
          font-size: 1rem;
          font-weight: 700;
          color: #9333ea;
          text-decoration: none;
          letter-spacing: -0.02em;
        }
        .auth-badge {
          background: var(--bg-titlebar);
          color: var(--text-muted);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-left: 10px;
          border: 1px solid var(--border);
        }
        .auth-help-btn {
          background: none;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          padding: 4px;
          transition: color 0.15s;
        }
        .auth-help-btn:hover { color: var(--accent); }

        .auth-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0px 16px 24px;
          margin: 15px 20px;
        }
        .auth-panel {
          width: 100%;
          max-width: ${panelMaxWidth}px;
          background: var(--bg-panel);
          border: 1px solid var(--border);
          border-top: 3px solid var(--border-top);
          box-shadow: var(--shadow);
        }
        .auth-titlebar {
          background: var(--bg-titlebar);
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-tb);
        }
        .auth-dots { display: flex; gap: 6px; align-items: center; }
        .auth-dot  { width: 10px; height: 10px; border-radius: 50%; }
        .auth-dot-red    { background: #ff5f57; }
        .auth-dot-yellow { background: #febc2e; }
        .auth-dot-green  { background: #28c840; }
        .auth-titlebar-name {
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 0.08em;
        }
        .auth-titlebar-pid {
          font-size: 9px;
          color: var(--text-dim);
        }

        .auth-body { padding: 32px 28px 28px; }
        .auth-class-header { margin-bottom: 24px; }
        .auth-class-header h1 {
          font-size: 1.4rem;
          font-weight: 700;
          line-height: 1.3;
          margin: 0 0 6px;
          letter-spacing: -0.01em;
        }
        .kw-class { color: var(--kw-class); }
        .kw-name  { color: var(--kw-name);  }
        .kw-brace { color: var(--kw-brace); }
        .auth-desc { font-size: 12px; color: var(--text-muted); margin: 0; }

        .auth-form { display: flex; flex-direction: column; gap: 20px; }
        .auth-field { display: flex; flex-direction: column; gap: 6px; }
        .auth-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-label);
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .auth-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .auth-input-wrap {
          display: flex;
          align-items: center;
          background: var(--bg-input);
          border: none;
          border-bottom: 2px solid var(--border-input);
          padding: 10px 14px;
          transition: border-color 0.2s;
          gap: 10px;
        }
        .auth-input-wrap:focus-within { border-bottom-color: var(--accent); }
        .auth-prompt {
          color: var(--text-prompt);
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
          user-select: none;
        }
        .auth-input {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          color: var(--text) !important;
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 14px !important;
          width: 100%;
          padding: 0 !important;
          margin: 0 !important;
          line-height: 1.4;
        }
        .auth-input::placeholder { color: var(--text-dim) !important; }
        .auth-input:focus { border: none !important; box-shadow: none !important; }

        /* Light mode: browser autofill override */
        [data-auth-theme="light"] .auth-input:-webkit-autofill,
        [data-auth-theme="light"] .auth-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px var(--bg-input) inset !important;
          -webkit-text-fill-color: var(--text) !important;
        }
        [data-auth-theme="dark"] .auth-input:-webkit-autofill,
        [data-auth-theme="dark"] .auth-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #111111 inset !important;
          -webkit-text-fill-color: #e8edf2 !important;
        }

        .auth-btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 14px 20px;
          background: var(--accent);
          color: #ffffff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          box-shadow: var(--glow);
          margin-top: 8px;
        }
        .auth-btn-primary:hover {
          background: var(--accent-hover);
          box-shadow: var(--glow-h);
        }
        .auth-btn-primary:active  { transform: scale(0.98); }
        .auth-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .auth-social { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-dim);
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin: 4px 0;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border-social);
        }
        .auth-btn-social {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 11px 16px;
          background: var(--bg-social);
          color: var(--text-social);
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: 1px solid var(--border-social);
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .auth-btn-social:hover {
          background: var(--bg-titlebar);
          border-color: var(--accent);
          color: var(--text);
        }
        .auth-btn-social:disabled { opacity: 0.5; cursor: not-allowed; }

        .auth-error {
          background: var(--bg-error);
          border-left: 3px solid var(--error-border);
          color: var(--error-text);
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.04em;
          border-radius: 0 4px 4px 0;
        }
        .auth-footer-text {
          text-align: center;
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 20px;
        }
        .auth-footer-text a {
          color: var(--accent-link);
          text-decoration: none;
          transition: color 0.15s;
        }
        .auth-footer-text a:hover { color: var(--accent-link-h); }
        .auth-bypass {
          font-size: 10px;
          color: var(--accent-bypass);
          text-decoration: none;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: color 0.15s;
        }
        .auth-bypass:hover { color: var(--accent-link); }

        .auth-syslog {
          background: var(--bg-syslog);
          border: 1px solid var(--border-syslog);
          border-radius: 6px;
          padding: 14px;
          margin-top: 8px;
        }
        .auth-syslog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .auth-syslog-title {
          font-size: 9px;
          color: var(--text-dim);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .syslog-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #16a34a;
          animation: blink 1.2s step-end infinite;
        }
        .auth-syslog-version { font-size: 9px; color: var(--text-dimmer); }
        .auth-log-line { display: flex; gap: 12px; font-size: 11px; line-height: 1.8; }
        .log-time { color: var(--text-time); }
        .log-text  { color: var(--text); }
        .log-dim   { color: var(--text-dim); }
        .auth-close { color: var(--text-muted); font-size: 1.2rem; font-weight: 700; margin-top: 16px; }

        .auth-page-footer {
          background: var(--bg-footer);
          border-top: 1px solid var(--border-footer);
          padding: 20px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .auth-page-footer-links { display: flex; gap: 20px; }
        .auth-page-footer a {
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-footer);
          text-decoration: none;
          transition: color 0.15s;
        }
        .auth-page-footer a:hover { color: var(--accent); }
        .auth-page-footer p {
          font-size: 9px;
          color: var(--text-dimmer);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        @keyframes blink { 50% { opacity: 0; } }
        .cursor::after {
          content: '_';
          animation: blink 1s step-end infinite;
          color: var(--accent-cur);
        }

        /* ── Responsiveness Breakpoints ──────────────────────────────────── */
        
        /* 1. Large screens (>= 1200px) */
        @media (min-width: 1200px) {
          .auth-panel {
            border-radius: 16px;
          }
        }

        /* 2. Tablets & Laptops (<= 992px) */
        @media (max-width: 992px) {
          .auth-main {
            padding: 20px 12px;
          }
          .auth-body {
            padding: 24px 20px 20px;
          }
        }

        /* 3. Small Mobile Devices (<= 576px) */
        @media (max-width: 576px) {
          .auth-header {
            padding: 10px 16px;
          }
          .auth-badge {
            display: none;
          }
          .auth-main {
            padding: 12px 6px;
          }
          .auth-panel {
            border-left: none;
            border-right: none;
          }
          .auth-body {
            padding: 16px 14px 14px;
          }
          .auth-class-header h1 {
            font-size: 1.15rem;
          }
          .auth-desc {
            font-size: 11px;
          }
          .auth-titlebar {
            padding: 8px 12px;
          }
          .auth-titlebar-name {
            font-size: 9px;
          }
          .auth-titlebar-pid {
            display: none;
          }
          .auth-input-wrap {
            padding: 8px 10px;
          }
          .auth-prompt {
            font-size: 12px;
          }
          .auth-input {
            font-size: 13px !important;
          }
          .auth-btn-primary {
            padding: 12px 16px;
            font-size: 12px;
          }
          .auth-btn-social {
            padding: 10px 14px;
            font-size: 10px;
          }
          .auth-syslog {
            padding: 10px;
          }
          .auth-log-line {
            font-size: 10px;
            gap: 8px;
          }
          .auth-page-footer {
            padding: 16px 12px;
          }
        }

        /* 4. Ultra Small Mobile Devices (<= 360px) */
        @media (max-width: 360px) {
          .auth-main {
            padding: 8px 0;
          }
          .auth-body {
            padding: 12px 10px 10px;
          }
          .auth-class-header h1 {
            font-size: 1.05rem;
          }
          .auth-form {
            gap: 14px;
          }
          .auth-page-footer-links {
            gap: 12px;
          }
        }
      `}</style>

      {/* data-auth-theme drives the entire CSS token cascade */}
      <div
        className={['auth-root', pageClassName].filter(Boolean).join(' ')}
        data-auth-theme={theme}
        style={background ? { background: 'transparent', position: 'relative' } : undefined}
      >
        {/* Optional full-bleed background layer (e.g. a WebGL/Vanta effect) — sits behind all content */}
        {background && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
            {background}
          </div>
        )}

        <div style={background ? { position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' } : undefined}>

        {/* Header */}
        <header className="auth-header gradient-border">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href="/" className="auth-logo" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <img
                src={theme === 'dark' ? '/cpa-icon-dark.png' : '/cpa-icon-light.png'}
                alt="Code Plus Academy Icon"
                style={{ height: 42, width: 42, objectFit: 'contain', flexShrink: 0 }}
              />
              <img
                src={theme === 'dark' ? '/cpa-logo-name-dark.png' : '/cpa-logo-name-light.png'}
                alt="Code Plus Academy"
                style={{ height: 34, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
              />
            </a>
            <span className="auth-badge">Secure Auth</span>
          </div>

          <nav className="auth-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <a href="/" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>Home</a>
            <a href="/career" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>Career</a>
            <a href="https://studio.codeplusacademy.in" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>Studio</a>
          </nav>

          <button className="auth-help-btn">
            <HelpCircle size={20} strokeWidth={1.5} />
          </button>
        </header>

        {/* Main */}
        <main className="auth-main">
          <div className="auth-panel">
            {/* Title Bar */}
            <div className="auth-titlebar">
              <div className="auth-dots">
                <div className="auth-dot auth-dot-red" />
                <div className="auth-dot auth-dot-yellow" />
                <div className="auth-dot auth-dot-green" />
                <span className="auth-titlebar-name" style={{ marginLeft: 10 }}>
                  PROTOCOL: {processName}
                </span>
              </div>
              <span className="auth-titlebar-pid">PID: {pid}</span>
            </div>

            {/* Body */}
            <div className="auth-body">
              <div className="auth-class-header">
                <h1>
                  <span className="kw-class">class </span>
                  <span className="kw-name">{classNameName} </span>
                  <span className="kw-brace">{'{'}</span>
                </h1>
                <p className="auth-desc">{'// '}{description}</p>
              </div>

              <form className="auth-form" onSubmit={onSubmit}>
                {children}
              </form>

              {/* System Log */}
              {logs.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div className="auth-syslog">
                    <div className="auth-syslog-header">
                      <span className="auth-syslog-title">
                        <span className="syslog-dot" />
                        System Log
                      </span>
                      <span className="auth-syslog-version">v2.4.0-stable</span>
                    </div>
                    <div>
                      {logs.map((log, i) => (
                        <div key={i} className="auth-log-line">
                          <span className="log-time">[{log.time}]</span>
                          {log.isCursor
                            ? <span className="log-text cursor">{log.text}</span>
                            : <span className={log.dim ? 'log-dim' : 'log-text'}>{log.text}</span>
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="auth-close">{'}'}</div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="auth-page-footer">
          <div className="auth-page-footer-links">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/status">Status</Link>
          </div>
          <p>© 2025 Code Plus Academy</p>
        </footer>

        </div>
      </div>
    </>
  );
}


