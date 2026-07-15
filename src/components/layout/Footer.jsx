import { Link } from 'react-router-dom';

export default function Footer() {
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
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginBottom: 8 }}>
              C<span style={{ color: 'var(--color-brand-teal)' }}>⁺</span> Code Plus Academy
            </h2>
            <p style={{ color: 'var(--sub)', fontSize: 14, lineHeight: 1.6 }}>
              Where Developers Ship, Share & Grow
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Product</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link to="/feed" style={{ color: 'var(--sub)', fontSize: 13 }}>Feed</Link>
              <Link to="/explore" style={{ color: 'var(--sub)', fontSize: 13 }}>Explore</Link>
              <Link to="/courses" style={{ color: 'var(--sub)', fontSize: 13 }}>Courses</Link>
              <Link to="/articles" style={{ color: 'var(--sub)', fontSize: 13 }}>Articles</Link>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Community</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="#" style={{ color: 'var(--sub)', fontSize: 13 }}>Discord</a>
              <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: 'var(--sub)', fontSize: 13 }}>GitHub</a>
              <a href="https://x.com/C_Plus_Academy" target="_blank" rel="noreferrer" style={{ color: 'var(--sub)', fontSize: 13 }}>Twitter/X</a>
              <a href="#" style={{ color: 'var(--sub)', fontSize: 13 }}>Newsletter</a>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Company</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="#" style={{ color: 'var(--sub)', fontSize: 13 }}>About</a>
              <a href="#" style={{ color: 'var(--sub)', fontSize: 13 }}>Blog</a>
              <a href="#" style={{ color: 'var(--sub)', fontSize: 13 }}>Careers</a>
              <a href="#" style={{ color: 'var(--sub)', fontSize: 13 }}>Contact</a>
              <Link to="/privacy" style={{ color: 'var(--sub)', fontSize: 13 }}>Privacy Policy</Link>
              <Link to="/terms" style={{ color: 'var(--sub)', fontSize: 13 }}>Terms of Service</Link>
              <Link to="/legal/grievance-officer" style={{ color: 'var(--sub)', fontSize: 13 }}>Grievance Officer</Link>
              <Link to="/faq" style={{ color: 'var(--sub)', fontSize: 13 }}>Help / FAQ</Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: 24,
          paddingTop: 32,
          borderTop: '1px solid var(--border)' 
        }}>
          <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
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
            © {new Date().getFullYear()} Code Plus Academy · Made with ♥ for developers
          </div>
        </div>
      </div>
    </footer>
  );
}
