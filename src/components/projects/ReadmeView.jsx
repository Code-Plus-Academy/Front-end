"use client";

/**
 * src/components/projects/ReadmeView.jsx
 * §D README rendering — react-markdown + remark-gfm (already repo deps).
 *
 * SECURITY: raw HTML is DISABLED (no rehype-raw), links open safely with
 * rel="noopener noreferrer nofollow". Sanitization contract: markdown AST
 * only; the only rendered HTML is what react-markdown itself generates.
 */

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function ReadmeView({ markdown }) {
  if (!markdown) {
    return (
      <p className="py-10 text-center opacity-60">
        This project has no README yet.
      </p>
    );
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-a:break-all">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer nofollow">
                {children}
              </a>
            );
          },
          img({ src, alt }) {
            return (
              <img
n                src={typeof src === "string" && /^https?:\/\//.test(src) ? src : undefined}
                alt={alt || ""}
                loading="lazy"
                className="max-w-full rounded-lg"
              />
            );
          },
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            if (!inline && match) {
              return (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ borderRadius: 12, fontSize: 13 }}
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              );
            }
            return (
              <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
