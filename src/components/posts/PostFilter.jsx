'use client';
const types = ['all', 'video'];
const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];
const languages = ['all', 'javascript', 'python', 'typescript', 'rust', 'go', 'java', 'c++', 'ruby', 'php'];

export default function PostFilter({ filters, onChange }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  const Chip = ({ value, current, onSelect }) => (
    <button onClick={() => onSelect(value)} style={{
      fontFamily: 'var(--font-mono)', fontSize: 11,
      padding: '5px 12px', borderRadius: 'var(--r-full)',
      border: `1px solid ${value === current ? 'var(--green)' : 'var(--border)'}`,
      background: value === current ? 'var(--green-dim)' : 'transparent',
      color: value === current ? 'var(--green)' : 'var(--sub)',
      cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
    }}>
      {value}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 0' }}>
      <div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--dim)', marginBottom: 6 }}>// type</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {types.map(t => <Chip key={t} value={t} current={filters.type} onSelect={v => set('type', v)} />)}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--dim)', marginBottom: 6 }}>// difficulty</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {difficulties.map(d => <Chip key={d} value={d} current={filters.difficulty} onSelect={v => set('difficulty', v)} />)}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--dim)', marginBottom: 6 }}>// language</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {languages.map(l => <Chip key={l} value={l} current={filters.language} onSelect={v => set('language', v)} />)}
        </div>
      </div>
    </div>
  );
}
