import React, { useState } from 'react';
import { Terminal, Copy, Check, Code2 } from 'lucide-react';

/**
 * Lightweight, high-accuracy syntax highlighter for common programming languages.
 * Supports TypeScript, JavaScript, Python, Go, Rust, Java, C++, SQL, HTML/CSS, JSON, Bash.
 */
function highlightCode(code, language = 'typescript') {
  if (!code) return '';

  const lang = (language || 'typescript').toLowerCase();

  // Escape HTML entities
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments (// and /* */ and #)
  const commentRegex = lang === 'python' || lang === 'bash' || lang === 'shell'
    ? /(#.*$)/gm
    : /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g;

  // Strings ('...', "...", `...`)
  const stringRegex = /(["'`])(?:(?=(\\?))\2[\s\S])*?\1/g;

  // Keywords
  const keywords = [
    'export', 'class', 'private', 'public', 'protected', 'constructor', 'new', 'this',
    'function', 'return', 'const', 'let', 'var', 'import', 'from', 'as', 'default',
    'if', 'else', 'switch', 'case', 'break', 'for', 'while', 'do', 'try', 'catch', 'finally',
    'throw', 'typeof', 'instanceof', 'void', 'delete', 'async', 'await', 'yield',
    'def', 'self', 'elif', 'print', 'package', 'func', 'type', 'struct', 'interface',
    'fn', 'mut', 'impl', 'trait', 'pub', 'match', 'use', 'crate', 'SELECT', 'FROM',
    'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'JOIN', 'GROUP BY', 'ORDER BY', 'TABLE'
  ];
  const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');

  // Types & Built-ins
  const types = [
    'WebSocket', 'Promise', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Set', 'Map',
    'string', 'number', 'boolean', 'any', 'unknown', 'never', 'void', 'null', 'undefined',
    'int', 'float', 'char', 'bool', 'int64', 'float64', 'error', 'Delta', 'Buffer', 'Record'
  ];
  const typeRegex = new RegExp(`\\b(${types.join('|')})\\b`, 'g');

  // Function calls
  const funcRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/g;

  // Token replacement with styled spans
  // 1. Strings
  escaped = escaped.replace(stringRegex, match => `<span style="color: #34d399;">${match}</span>`);

  // 2. Keywords
  escaped = escaped.replace(keywordRegex, match => `<span style="color: #38bdf8; font-weight: 600;">${match}</span>`);

  // 3. Types
  escaped = escaped.replace(typeRegex, match => `<span style="color: #67e8f9; font-weight: 500;">${match}</span>`);

  // 4. Function calls
  escaped = escaped.replace(funcRegex, match => `<span style="color: #c084fc;">${match}</span>`);

  // 5. Comments
  escaped = escaped.replace(commentRegex, match => `<span style="color: #64748b; font-style: italic;">${match}</span>`);

  return escaped;
}

/**
 * Utility to extract markdown code blocks from a post's caption/description.
 * Returns: { beforeText, codeSnippet: { language, code, title }, afterText }
 */
export function extractCodeBlock(text) {
  if (!text) return { text, codeSnippet: null };

  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/;
  const match = text.match(codeBlockRegex);

  if (!match) {
    return { text, codeSnippet: null };
  }

  const fullMatch = match[0];
  const language = match[1] || 'typescript';
  const code = match[2].trim();
  const matchIndex = match.index;

  const beforeText = text.slice(0, matchIndex).trim();
  const afterText = text.slice(matchIndex + fullMatch.length).trim();

  return {
    beforeText,
    afterText,
    codeSnippet: {
      language,
      code,
    },
  };
}

export default function CodeSnippetCard({
  code,
  language = 'typescript',
  title = '',
  className = '',
  style = {}
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedHtml = highlightCode(code, language);
  const displayLang = (language || 'typescript').toLowerCase();

  return (
    <div
      className={`cpa-code-snippet-box ${className}`}
      style={{
        background: '#070c18',
        border: '1px solid #1e293b',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
        margin: '12px 0',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace",
        position: 'relative',
        ...style,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── IDE Top Header Bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: '#0b1324',
          borderBottom: '1px solid #1e293b',
          userSelect: 'none',
        }}
      >
        {/* Left: Terminal Prompt & Language */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#00dbe9', fontSize: 13, fontWeight: 800 }}>&gt;_</span>
          <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em' }}>
            {displayLang}
          </span>
          {title && (
            <span style={{ color: '#64748b', fontSize: 11, marginLeft: 4 }}>
              • {title}
            </span>
          )}
        </div>

        {/* Right: Badge & Copy Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 11,
            color: '#64748b',
            letterSpacing: '0.04em',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}>
            CPA Syntax Highlight
          </span>

          <button
            type="button"
            onClick={handleCopy}
            title="Copy code"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 9px',
              borderRadius: 6,
              background: copied ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              border: copied ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: copied ? '#34d399' : '#94a3b8',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* ── Code Body Area ── */}
      <div
        style={{
          padding: '16px 20px',
          overflowX: 'auto',
          maxHeight: 480,
          background: '#070c18',
        }}
      >
        <pre
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.6,
            color: '#e2e8f0',
            whiteSpace: 'pre',
            wordWrap: 'normal',
            tabSize: 2,
            fontFamily: 'inherit',
          }}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      </div>
    </div>
  );
}