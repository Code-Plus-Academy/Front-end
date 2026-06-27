/**
 * TwoColumnLayout — Content + Sticky Right Panel (Pattern A)
 * Used by: course, repository-article, project-showcase,
 *          document-article, learning-path
 *
 * Desktop (≥1024): CSS Grid 1fr 380px with sticky right
 * Mobile (<1024):  Single column, right panel below
 */
import useWindowWidth from '../../../hooks/useWindowWidth';

const BREAKPOINT = 1024;
const PANEL_WIDTH = 380;
const GAP = 32;

export default function TwoColumnLayout({ children, rightPanel }) {
  const width = useWindowWidth();
  const isDesktop = width >= BREAKPOINT;

  if (!isDesktop) {
    return (
      <div style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: 'clamp(16px, 4vw, 40px) clamp(12px, 4vw, 24px)',
      }}>
        {children}
        {rightPanel && (
          <div style={{ marginTop: 24 }}>{rightPanel}</div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `1fr ${PANEL_WIDTH}px`,
      gap: GAP,
      maxWidth: 1200,
      margin: '0 auto',
      padding: '40px 24px',
      alignItems: 'start',
    }}>
      {/* Main content column */}
      <div>{children}</div>

      {/* Sticky right panel */}
      {rightPanel && (
        <aside style={{
          position: 'sticky',
          top: 24,
          alignSelf: 'start',
          animation: 'panelSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) 0.2s both',
        }}>
          <style>{`
            @keyframes panelSlideIn {
              from { opacity: 0; transform: translateX(16px); }
              to   { opacity: 1; transform: translateX(0); }
            }
          `}</style>
          {rightPanel}
        </aside>
      )}
    </div>
  );
}
