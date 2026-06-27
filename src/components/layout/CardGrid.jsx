export default function CardGrid({ children, minCardWidth = '280px' }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}, 1fr))`,
        gap: '1.5rem',
      }}
    >
      {children}
    </div>
  );
}
