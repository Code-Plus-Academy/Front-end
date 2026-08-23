import React, { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Terminal, Copy, Check, Code2 } from 'lucide-react';

/**
 * Intelligent heuristics-based programming language auto-detector.
 * Analyzes keywords, syntax constructs, declarations, and formatting.
 */
export function detectLanguage(code) {
  if (!code || typeof code !== 'string') return 'javascript';
  const clean = code.trim();
  if (!clean) return 'javascript';

  // 1. JSON check
  if ((clean.startsWith('{') && clean.endsWith('}')) || (clean.startsWith('[') && clean.endsWith(']'))) {
    try {
      JSON.parse(clean);
      return 'json';
    } catch (_) {}
  }

  // 2. Shebang / CLI bash
  if (/^#!\/(bin|usr)\/(bash|sh|zsh)/m.test(clean) || /^\s*(npm\s+(run|install|i|test)|npx|git\s+(commit|push|pull|status|clone|checkout)|docker\s+(run|build|compose)|sudo\s+|chmod\s+\+x|curl\s+-)/m.test(clean)) {
    return 'bash';
  }

  // 3. Weighted score detection
  const scores = {
    python: 0,
    typescript: 0,
    javascript: 0,
    go: 0,
    rust: 0,
    cpp: 0,
    java: 0,
    sql: 0,
    html: 0,
    css: 0,
    solidity: 0,
  };

  // Python
  if (/\bdef\s+\w+\s*\([^)]*\)\s*:/m.test(clean)) scores.python += 5;
  if (/\belif\s+/m.test(clean)) scores.python += 5;
  if (/\bfrom\s+[\w.]+\s+import\b/m.test(clean)) scores.python += 4;
  if (/\bimport\s+[\w.]+(\s+as\s+\w+)?$/m.test(clean)) scores.python += 3;
  if (/\bprint\s*\(/m.test(clean)) scores.python += 2;
  if (/\b__init__\b/m.test(clean)) scores.python += 4;
  if (/\bself\.\w+/m.test(clean)) scores.python += 3;
  if (/\bif\s+__name__\s*==\s*['"]__main__['"]\s*:/m.test(clean)) scores.python += 6;
  if (/\b(True|False|None)\b/m.test(clean)) scores.python += 2;

  // Rust
  if (/\bfn\s+\w+\s*\(/m.test(clean)) scores.rust += 5;
  if (/\blet\s+mut\s+/m.test(clean)) scores.rust += 5;
  if (/\bprintln!\s*\(/m.test(clean)) scores.rust += 5;
  if (/\bvec!\s*\[/m.test(clean)) scores.rust += 4;
  if (/\bmatch\s+\w+\s*\{/m.test(clean)) scores.rust += 3;
  if (/\buse\s+(std|crate)::/m.test(clean)) scores.rust += 5;
  if (/->\s*(Result|Option|Self|\w+)\s*\{/m.test(clean)) scores.rust += 3;

  // Go
  if (/\bpackage\s+(main|\w+)/m.test(clean)) scores.go += 6;
  if (/\bfunc\s+(\([^)]+\)\s+)?\w+\s*\(/m.test(clean)) scores.go += 5;
  if (/\bfmt\.(Println|Printf|Sprintf|Errorf)\b/m.test(clean)) scores.go += 5;
  if (/\bgo\s+func\b/m.test(clean)) scores.go += 4;
  if (/:=/m.test(clean)) scores.go += 3;
  if (/\btype\s+\w+\s+struct\s*\{/m.test(clean)) scores.go += 4;

  // C / C++
  if (/#include\s*<[\w.]+>/m.test(clean)) scores.cpp += 6;
  if (/\bstd::(cout|cin|vector|string|map|endl|make_shared)\b/m.test(clean)) scores.cpp += 6;
  if (/\b(printf|scanf)\s*\(/m.test(clean)) scores.cpp += 4;
  if (/\bcout\s*<</m.test(clean)) scores.cpp += 5;
  if (/\bnullptr\b/m.test(clean)) scores.cpp += 3;
  if (/\bint\s+main\s*\([^)]*\)\s*\{/m.test(clean)) scores.cpp += 4;

  // Java
  if (/\bpublic\s+(class|interface|enum)\s+\w+/m.test(clean)) scores.java += 5;
  if (/\bpublic\s+static\s+void\s+main\s*\(/m.test(clean)) scores.java += 6;
  if (/\bSystem\.(out|err)\.(println|print)\b/m.test(clean)) scores.java += 6;
  if (/\b(package|import)\s+java[x]?\./m.test(clean)) scores.java += 5;

  // SQL
  if (/\bSELECT\s+[\s\S]+\s+FROM\b/i.test(clean)) scores.sql += 6;
  if (/\bINSERT\s+INTO\b/i.test(clean)) scores.sql += 5;
  if (/\bUPDATE\s+\w+\s+SET\b/i.test(clean)) scores.sql += 5;
  if (/\bCREATE\s+TABLE\b/i.test(clean)) scores.sql += 5;
  if (/\b(GROUP|ORDER)\s+BY\b/i.test(clean)) scores.sql += 3;
  if (/\bPRIMARY\s+KEY\b/i.test(clean)) scores.sql += 3;

  // Solidity
  if (/\bpragma\s+solidity\b/m.test(clean)) scores.solidity += 7;
  if (/\bcontract\s+\w+\s*\{/m.test(clean)) scores.solidity += 5;
  if (/\bmapping\s*\([^)]+\)\s*=>/m.test(clean)) scores.solidity += 4;
  if (/\b(msg\.sender|msg\.value|uint256|address\s+public)\b/m.test(clean)) scores.solidity += 4;

  // HTML
  if (/<!DOCTYPE\s+html/i.test(clean)) scores.html += 7;
  if (/<\/?(html|head|body|div|span|p|a|ul|li|button|input|h[1-6]|form|table|script|style)[\s>]/i.test(clean)) scores.html += 4;

  // CSS
  if (/[.#][a-zA-Z0-9_-]+\s*\{[^}]*(display|margin|padding|background|color|font-size|border):/i.test(clean)) scores.css += 5;
  if (/@media\s*\([^)]*\)\s*\{/i.test(clean)) scores.css += 4;

  // TypeScript vs JavaScript
  if (/\b(interface|type)\s+[A-Z]\w*\s*(=|\{)/m.test(clean)) scores.typescript += 5;
  if (/:\s*(string|number|boolean|any|unknown|never|void|Record<|Promise<|Array<|React\.)/m.test(clean)) scores.typescript += 4;
  if (/\bas\s+(const|string|number)\b/m.test(clean)) scores.typescript += 3;
  if (/\bexport\s+(interface|type)\b/m.test(clean)) scores.typescript += 4;

  if (/\b(const|let|var)\s+\w+/m.test(clean)) {
    scores.javascript += 2;
    scores.typescript += 1;
  }
  if (/\bfunction\s*\w*\s*\(/m.test(clean)) {
    scores.javascript += 2;
    scores.typescript += 1;
  }
  if (/=>/m.test(clean)) {
    scores.javascript += 1;
    scores.typescript += 1;
  }
  if (/console\.(log|warn|error|info)/m.test(clean)) {
    scores.javascript += 3;
    scores.typescript += 2;
  }
  if (/\b(async|await)\b/m.test(clean)) {
    scores.javascript += 2;
    scores.typescript += 2;
  }
  if (/import\s+.*from\s+['"]/m.test(clean)) {
    scores.javascript += 2;
    scores.typescript += 2;
  }

  let maxLang = 'javascript';
  let maxScore = 0;
  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxLang = lang;
    }
  }

  return maxScore > 0 ? maxLang : 'javascript';
}

/**
 * Single-pass, collision-free tokenizer & syntax highlighter.
 * Supports TypeScript, JavaScript, Python, Go, Rust, Java, C++, SQL, HTML/CSS, JSON, Bash, Solidity.
 */
function highlightCode(code, language = 'javascript') {
  if (!code) return '';

  const lang = (language || 'javascript').toLowerCase();

  // Escape HTML entities helper (full character escaping)
  const esc = (s) => (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');

  const keywords = new Set([
    'export', 'class', 'private', 'public', 'protected', 'constructor', 'new', 'this',
    'function', 'return', 'const', 'let', 'var', 'import', 'from', 'as', 'default',
    'if', 'else', 'switch', 'case', 'break', 'for', 'while', 'do', 'try', 'catch', 'finally',
    'throw', 'typeof', 'instanceof', 'void', 'delete', 'async', 'await', 'yield',
    'def', 'self', 'elif', 'print', 'package', 'func', 'type', 'struct', 'interface',
    'fn', 'mut', 'impl', 'trait', 'pub', 'match', 'use', 'crate', 'SELECT', 'FROM',
    'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'JOIN', 'GROUP', 'ORDER', 'BY', 'TABLE',
    'select', 'from', 'where', 'insert', 'update', 'delete', 'join', 'group', 'order', 'by', 'table',
    'True', 'False', 'None', 'true', 'false', 'null', 'contract', 'pragma', 'solidity'
  ]);

  const types = new Set([
    'WebSocket', 'Promise', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Set', 'Map',
    'string', 'number', 'boolean', 'any', 'unknown', 'never', 'void', 'null', 'undefined',
    'int', 'float', 'char', 'bool', 'int64', 'float64', 'error', 'Delta', 'Buffer', 'Record',
    'uint256', 'address', 'bytes32', 'mapping', 'vector', 'std'
  ]);

  // Single-pass tokenizer regex
  // 1: Comments (//, /* */, #)
  // 2: Strings ("...", '...', `...`)
  // 3: Numbers (123, 45.67)
  // 4: Identifiers / Words
  // 5: Whitespace and symbols
  const tokenRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*\b)|(\s+|[^\s\w])/g;

  return code.replace(tokenRegex, (match, comment, str, num, word) => {
    if (comment) {
      return `<span style="color: #64748b; font-style: italic;">${esc(comment)}</span>`;
    }
    if (str) {
      return `<span style="color: #34d399;">${esc(str)}</span>`;
    }
    if (num) {
      return `<span style="color: #f59e0b;">${esc(num)}</span>`;
    }
    if (word) {
      if (keywords.has(word)) {
        return `<span style="color: #38bdf8; font-weight: 600;">${esc(word)}</span>`;
      }
      if (types.has(word)) {
        return `<span style="color: #67e8f9; font-weight: 500;">${esc(word)}</span>`;
      }
      return esc(word);
    }
    return esc(match);
  });
}

/**
 * Robust extraction of markdown code blocks from a post's caption/description.
 * Matches:
 *  - ```javascript\ncode\n```
 *  - ```code```
 *  - Automatically auto-detects language if unspecified or generic.
 * Returns: { beforeText, codeSnippet: { language, code, title }, afterText }
 */
export function extractCodeBlock(text) {
  if (!text || typeof text !== 'string') {
    return { beforeText: text || '', codeSnippet: null, afterText: '' };
  }

  // Matches ```lang ... ``` or ``` ... ``` with optional leading spaces or newlines
  const codeBlockRegex = /```([a-zA-Z0-9_#-]*)[ \t]*\r?\n?([\s\S]*?)```/;
  const match = text.match(codeBlockRegex);

  if (!match) {
    return { beforeText: text, codeSnippet: null, afterText: '' };
  }

  const fullMatch = match[0];
  let rawLang = (match[1] || '').trim().toLowerCase();
  const code = (match[2] || '').trim();
  const matchIndex = match.index;

  const beforeText = text.slice(0, matchIndex).trim();
  const afterText = text.slice(matchIndex + fullMatch.length).trim();

  if (!code) {
    return { beforeText: text, codeSnippet: null, afterText: '' };
  }

  // If language tag is missing or generic, auto detect
  let language = rawLang;
  if (!language || ['code', 'text', 'txt', 'plaintext', 'snippet', 'auto'].includes(language)) {
    language = detectLanguage(code);
  }

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
  language,
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

  // Determine active language with automatic fallback detection
  const displayLang = (!language || ['code', 'text', 'txt', 'plaintext', 'snippet', 'auto'].includes(language.toLowerCase()))
    ? detectLanguage(code)
    : language.toLowerCase();

  const highlightedHtml = highlightCode(code, displayLang);

  // Sanitize generated HTML with DOMPurify
  const cleanHtml = useMemo(() => {
    if (typeof window !== 'undefined' && DOMPurify?.sanitize) {
      return DOMPurify.sanitize(highlightedHtml, {
        USE_PROFILES: { html: true }
      });
    }
    return highlightedHtml;
  }, [highlightedHtml]);

  return (
    <div
      className={`cpa-code-snippet-box ${className}`}
      style={{
        background: '#070c18',
        border: '1px solid #1e293b',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        margin: '8px 0',
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
          padding: '6px 12px',
          background: '#0b1324',
          borderBottom: '1px solid #1e293b',
          userSelect: 'none',
        }}
      >
        {/* Left: Terminal Prompt & Language */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ color: '#00dbe9', fontSize: 12, fontWeight: 800 }}>&gt;_</span>
          <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'lowercase' }}>
            {displayLang}
          </span>
          {title && (
            <span style={{ color: '#64748b', fontSize: 11, marginLeft: 2 }} className="truncate">
              • {title}
            </span>
          )}
        </div>

        {/* Right: Badge & Copy Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="hidden sm:inline-flex" style={{
            fontSize: 10,
            color: '#64748b',
            letterSpacing: '0.04em',
            fontWeight: 500,
            alignItems: 'center',
            gap: 4,
          }}>
            CPA Syntax
          </span>

          <button
            type="button"
            onClick={handleCopy}
            title="Copy code"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
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
            {copied ? <Check size={11} /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* ── IDE Code Body ── */}
      <pre
        style={{
          margin: 0,
          padding: '12px 14px',
          overflowX: 'auto',
          fontSize: '12px',
          lineHeight: '1.5',
          color: '#e2e8f0',
          background: 'transparent',
          tabSize: 2,
        }}
      >
        <code
          dangerouslySetInnerHTML={{ __html: cleanHtml }}
          style={{ fontFamily: 'inherit' }}
        />
      </pre>
    </div>
  );
}