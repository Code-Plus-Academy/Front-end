'use client';
/**
 * CourseRightPanel — Enrollment card + course meta + tabs
 * Reference: Images 17–19 from desktop-layout-guide
 */
import { useState } from 'react';

const panelCard = {
  background: 'var(--surface)',
  borderRadius: 14,
  border: '1px solid var(--border)',
  padding: '20px',
  marginBottom: 16,
};

export default function CourseRightPanel({ article }) {
  const [activeTab, setActiveTab] = useState(0);
  const meta = article.meta || {};
  const tabs = ['Overview', 'Curriculum', 'Instructor'];

  const price = meta.price || 'Free';
  const strikePrice = meta.strike_price;
  const discount = meta.discount;

  return (
    <div>
      {/* Enrollment Card */}
      <div style={panelCard}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 28,
              fontWeight: 800, color: 'var(--text)',
            }}>{price}</span>
            {strikePrice && (
              <span style={{
                fontSize: 14, color: 'var(--dim)',
                textDecoration: 'line-through',
              }}>{strikePrice}</span>
            )}
            {discount && (
              <span style={{
                background: 'rgba(34,197,94,0.15)', color: '#22c55e',
                fontSize: 11, fontWeight: 700, padding: '3px 8px',
                borderRadius: 5, letterSpacing: '0.04em',
              }}>{discount}</span>
            )}
          </div>
        </div>

        <button style={{
          width: '100%', background: 'var(--accent-purple, #6e00ff)',
          border: 'none', borderRadius: 10, padding: '13px',
          color: '#fff', fontWeight: 800, fontSize: 15,
          cursor: 'pointer', fontFamily: 'var(--font-display)',
          transition: 'all 0.18s ease',
        }}>
          Enroll Now
        </button>

        {/* Course Meta Rows */}
        <div style={{ marginTop: 18 }}>
          {[
            { icon: '⏱', label: 'Duration', value: meta.duration || '—' },
            { icon: '📊', label: 'Level', value: meta.level || '—' },
            { icon: '📅', label: 'Next Cohort', value: meta.next_cohort || '—' },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontSize: 13, color: 'var(--sub)', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>{row.icon}</span>{row.label}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={panelCard}>
        <div style={{
          display: 'flex', borderBottom: '1px solid var(--border)',
          marginBottom: 14, position: 'relative',
        }}>
          {tabs.map((tab, i) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === i}
              onClick={() => setActiveTab(i)}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                padding: '10px 0', fontSize: 12, fontWeight: 700,
                color: activeTab === i ? 'var(--green)' : 'var(--dim)',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'color 0.2s ease',
              }}
            >
              {tab}
            </button>
          ))}
          {/* Animated underline */}
          <div style={{
            position: 'absolute', bottom: -1, height: 2,
            background: 'var(--green)',
            width: `${100 / tabs.length}%`,
            left: `${(100 / tabs.length) * activeTab}%`,
            transition: 'left 0.2s ease',
            borderRadius: 2,
          }} />
        </div>

        <div style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.7 }}>
          {activeTab === 0 && (
            <div>
              <p>{meta.overview || article.meta?.description || 'Course overview available upon enrollment.'}</p>
              <div style={{ marginTop: 12 }}>
                {(meta.includes || ['Video content', 'Practice exercises', 'Certificate']).map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                    <span style={{ color: 'var(--green)', fontSize: 12 }}>✓</span>
                    <span style={{ fontSize: 12 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 1 && <p>View curriculum in the main content area.</p>}
          {activeTab === 2 && <p>Instructor details in the main content area.</p>}
        </div>
      </div>

      {/* Help & Share */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, padding: '8px 0' }}>
        <span style={{ fontSize: 12, color: 'var(--dim)', cursor: 'pointer' }}>💬 Help</span>
        <span style={{ fontSize: 12, color: 'var(--dim)', cursor: 'pointer' }}>🔗 Share</span>
      </div>
    </div>
  );
}
