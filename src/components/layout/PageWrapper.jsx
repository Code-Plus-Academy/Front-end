export default function PageWrapper({ children, style = {} }) {
  return (
    <div className="page-enter" style={{
      maxWidth: 1200,
      margin: '0 auto',
      padding: '24px 16px 96px',
      ...style,
    }}>
      {children}
    </div>
  );
}
