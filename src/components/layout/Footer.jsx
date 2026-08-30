import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect } from 'react';
import FocusGramBrand from '../brand/FocusGramBrand';

export default function Footer() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || resolvedTheme === 'dark';

  return (
    <footer style={{ 
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      padding: '60px 24px 40px',
      marginTop: 'auto'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '60px' }}>
          
          {/* Brand Col */}
          <div style={{ maxWidth: '300px' }}>
            <div style={{ marginBottom: 12 }}>
              <FocusGramBrand size={32} showSubtitle={true} />
            </div>
            <p style={{ color: 'var(--sub)', fontSize: 13, lineHeight: 1.6, marginTop: 10 }}>
              Where Developers Ship, Share & Grow.<br />
              <span style={{ fontSize: 11, color: 'var(--dim)' }}>Powered by Code Plus Academy</span>
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Product</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link to="/feed" style={{ color: 'var(--sub)', fontSize: 13 }}>Feed</Link>
              <Link to="/explore" style={{ color: 'var(--sub)', fontSize: 13 }}>Explore</Link>
              <Link to="/notes" style={{ color: 'var(--sub)', fontSize: 13 }}>Notes Arena</Link>
              <Link to="/notes/upload" style={{ color: 'var(--sub)', fontSize: 13 }}>Upload Notes</Link>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Community</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="https://discord.gg/J3bRCDTBc" target="_blank" rel="noreferrer" style={{ color: 'var(--sub)', fontSize: 13 }}>Discord</a>
              <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: 'var(--sub)', fontSize: 13 }}>GitHub</a>
              <a href="https://x.com/C_Plus_Academy" target="_blank" rel="noreferrer" style={{ color: 'var(--sub)', fontSize: 13 }}>Twitter/X</a>
              <a href="#" style={{ color: 'var(--sub)', fontSize: 13 }}>Newsletter</a>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Company</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link to="/about" style={{ color: 'var(--sub)', fontSize: 13 }}>About Us</Link>
              <Link to="/builders" style={{ color: 'var(--sub)', fontSize: 13 }}>Meet the Builders</Link>
              <Link to="/contributors" style={{ color: 'var(--sub)', fontSize: 13 }}>Contributors (Community)</Link>
              <Link to="/partners" style={{ color: 'var(--sub)', fontSize: 13 }}>Partners Program</Link>
              <Link to="/support" style={{ color: 'var(--sub)', fontSize: 13 }}>Support & Compliance</Link>
              <Link to="/legal/grievance-officer" style={{ color: 'var(--sub)', fontSize: 13 }}>Grievance Officer</Link>
              <Link to="/privacy" style={{ color: 'var(--sub)', fontSize: 13 }}>Privacy Policy</Link>
              <Link to="/terms" style={{ color: 'var(--sub)', fontSize: 13 }}>Terms & Conditions</Link>
              <Link to="/cookie-policy" style={{ color: 'var(--sub)', fontSize: 13 }}>Cookie Policy</Link>
              <Link to="/faq" style={{ color: 'var(--sub)', fontSize: 13 }}>Help / FAQ</Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <style>{`
          .footer-bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 24px;
            padding-top: 32px;
            border-top: 1px solid var(--border);
          }
          .footer-social-links {
            display: flex;
            gap: 16px;
            font-size: 13px;
            flex-wrap: wrap;
          }
          @media (max-width: 768px) {
            .footer-bottom {
              flex-direction: column !important;
              align-items: center !important;
              text-align: center !important;
              gap: 16px !important;
            }
            .footer-social-links {
              justify-content: center !important;
              gap: 12px 16px !important;
            }
          }
        `}</style>
        <div className="footer-bottom">
          <div className="footer-social-links">
            <a href="https://github.com" style={{ color: 'var(--dim)' }}>GitHub</a>
            <span style={{ color: 'var(--border)' }}>·</span>
            <a href="https://x.com/C_Plus_Academy" style={{ color: 'var(--dim)' }}>Twitter</a>
            <span style={{ color: 'var(--border)' }}>·</span>
            <a href="https://linkedin.com/company/code-plus-academy" style={{ color: 'var(--dim)' }}>LinkedIn</a>
            <span style={{ color: 'var(--border)' }}>·</span>
            <a href="https://instagram.com/code_plus_academy" style={{ color: 'var(--dim)' }}>Instagram</a>
            <span style={{ color: 'var(--border)' }}>·</span>
            <a href="https://youtube.com/@code_plus_academy" style={{ color: 'var(--dim)' }}>YouTube</a>
          </div>
          <div style={{ color: 'var(--dim)', fontSize: 13 }}>
            © {new Date().getFullYear()} FocusGram (powered by Code Plus Academy) · Made with ♥ for developers
          </div>
        </div>
      </div>
    </footer>
  );
}
