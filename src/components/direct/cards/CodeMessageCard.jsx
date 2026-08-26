'use client';

import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy, Code2 } from 'lucide-react';

export default function CodeMessageCard({ attachment, isMine }) {
  const [copied, setCopied] = useState(false);

  if (!attachment) return null;

  const code = attachment.code || '';
  const language = (attachment.language || 'javascript').toLowerCase();
  const title = attachment.title || `${language} snippet`;

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-xl"
      style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: '#0F172A',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      {/* macOS-style Header */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 bg-black/40 border-b border-white/10"
      >
        <div className="flex items-center gap-2">
          {/* macOS window control dots */}
          <div className="flex items-center gap-1.5 mr-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] inline-block opacity-85" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] inline-block opacity-85" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] inline-block opacity-85" />
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-300 truncate max-w-[180px]">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-purple-300 font-semibold uppercase tracking-wider">
            {language}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy code"
            className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span className="text-emerald-400 font-bold text-[10px]">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span className="text-[10px]">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Display */}
      <div className="max-h-[320px] overflow-y-auto text-[11px] leading-relaxed">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers={true}
          wrapLines={true}
          customStyle={{
            margin: 0,
            padding: '12px',
            backgroundColor: '#0F172A',
            fontSize: '11px',
            fontFamily: '"JetBrains Mono", monospace',
          }}
          lineNumberStyle={{
            minWidth: '2em',
            paddingRight: '1em',
            color: 'rgba(255, 255, 255, 0.25)',
            userSelect: 'none',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
