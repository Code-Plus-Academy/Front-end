import React from 'react';
import { Clock, Sparkles } from 'lucide-react';

export default function DmSearchTabs({ activeTab, onTabChange, isDark = false }) {
  const tabs = [
    { id: 'all', label: 'All', icon: null },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'suggested', label: 'Suggested', icon: Sparkles },
  ];

  return (
    <div
      role="tablist"
      aria-label="Filter user results"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: '38px',
              padding: '0 14px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: isActive ? 700 : 600,
              fontFamily: "'Inter', 'Geist', sans-serif",
              cursor: 'pointer',
              border: isActive
                ? 'none'
                : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0'),
              background: isActive
                ? 'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)'
                : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF'),
              color: isActive
                ? '#FFFFFF'
                : (isDark ? '#E2E8F0' : '#1E293B'),
              boxShadow: isActive
                ? '0 4px 14px rgba(99, 102, 241, 0.35)'
                : (isDark ? 'none' : '0 1px 4px rgba(0, 0, 0, 0.03)'),
              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              outline: 'none',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : '#F8FAFC';
                e.currentTarget.style.borderColor = isDark
                  ? 'rgba(255, 255, 255, 0.18)'
                  : '#CBD5E1';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : '#FFFFFF';
                e.currentTarget.style.borderColor = isDark
                  ? 'rgba(255, 255, 255, 0.1)'
                  : '#E2E8F0';
              }
            }}
          >
            {Icon && (
              <Icon
                size={14}
                strokeWidth={2.2}
                color={isActive ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B')}
              />
            )}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
