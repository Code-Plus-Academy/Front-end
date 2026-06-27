/**
 * SingleColumnLayout — centered single column (Pattern C)
 * Used by: standard-article, tech-deep-dive, problem-solution,
 *          code-playground, comparison, learning-path
 */
export default function SingleColumnLayout({ children, maxWidth = 760 }) {
  return (
    <div style={{
      maxWidth,
      margin: '0 auto',
      padding: 'clamp(16px, 4vw, 40px) clamp(12px, 4vw, 24px)',
    }}>
      {children}
    </div>
  );
}
