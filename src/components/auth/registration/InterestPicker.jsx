import { useState, useMemo } from 'react';
import { Check, Search, Sparkles } from 'lucide-react';

const INTEREST_ICONS = {
  frontend: '⚛️',
  backend: '⚙️',
  fullstack: '💻',
  mobile: '📱',
  devops: '🚀',
  cloud: '☁️',
  infra: '🏗️',
  security: '🛡️',
  ai: '🧠',
  ml: '🤖',
  data: '📊',
  analytics: '📈',
  product: '📦',
  design: '🎨',
  growth: '⚡',
  founder: '💡',
  interviews: '🎯',
  'system-design': '🏛️',
  'open-source': '🌐',
  freelance: '💼',
};

export default function InterestPicker({ categories = [], selected = new Set(), onToggle, maxSelected = 10 }) {
  const [searchQuery, setSearchQuery] = useState('');
  const selectedCount = selected.size;

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return categories;

    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.slug.toLowerCase().includes(query) ||
            cat.category.toLowerCase().includes(query)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, searchQuery]);

  return (
    <div className="interest-picker">
      {/* Quick Search Bar */}
      <div className="interest-search-wrap">
        <Search size={15} className="interest-search-icon" aria-hidden="true" />
        <input
          type="text"
          className="interest-search-input"
          placeholder="Filter topics (e.g. React, Cloud, AI)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Filter interest topics"
        />
        {searchQuery && (
          <button
            type="button"
            className="interest-search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="Clear topic filter"
          >
            ✕
          </button>
        )}
      </div>

      {filteredCategories.length === 0 ? (
        <div className="interest-empty-state">
          <p>No topics matching &ldquo;{searchQuery}&rdquo;</p>
          <button
            type="button"
            className="link-btn"
            onClick={() => setSearchQuery('')}
          >
            Clear filter
          </button>
        </div>
      ) : (
        filteredCategories.map((category) => (
          <section key={category.category} className="interest-category">
            <div className="interest-cat-header">
              <span className="interest-cat-bullet" aria-hidden="true" />
              <h4>{category.category}</h4>
            </div>
            <div className="interest-grid">
              {category.items.map((item) => {
                const active = selected.has(item.slug);
                const disabled = !active && selectedCount >= maxSelected;
                const icon = INTEREST_ICONS[item.slug] || '✨';

                return (
                  <button
                    key={item.slug}
                    type="button"
                    className={`interest-chip ${active ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`}
                    onClick={() => !disabled && onToggle(item.slug)}
                    disabled={disabled}
                    title={disabled ? `Maximum of ${maxSelected} interests reached` : undefined}
                    aria-pressed={active}
                  >
                    <span className="interest-chip-icon" aria-hidden="true">{icon}</span>
                    <span className="interest-chip-label">{item.label}</span>
                    {active && <Check size={13} strokeWidth={3} className="interest-chip-check" />}
                  </button>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
