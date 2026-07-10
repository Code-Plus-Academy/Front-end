export default function InterestPicker({ categories, selected, onToggle, maxSelected }) {
  const selectedCount = selected.size;

  return (
    <div className="interest-picker">
      {categories.map((category) => (
        <section key={category.category} className="interest-category">
          <h4>{category.category}</h4>
          <div className="interest-grid">
            {category.items.map((item) => {
              const active = selected.has(item.slug);
              const disabled = !active && selectedCount >= maxSelected;
              return (
                <button
                  key={item.slug}
                  type="button"
                  className={`interest-chip ${active ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`}
                  onClick={() => !disabled && onToggle(item.slug)}
                  disabled={disabled}
                  title={disabled ? `Maximum of ${maxSelected} interests selected` : undefined}
                  aria-pressed={active}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
