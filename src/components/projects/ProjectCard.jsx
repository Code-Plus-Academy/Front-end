"use client";

/**
 * src/components/projects/ProjectCard.jsx
 * Reusable showcase ProjectCard — approved UI/UX spec §A (Profile) + §B (Search).
 *
 * - Optional cover image; card stays attractive WITHOUT an image (gradient
 *   header fallback derived from repo language — no hardcoded theme colors).
 * - Light/dark themes via existing CSS token classes (adaptive theme rule).
 * - Cursor pagination friendly: presentational only, no data fetching.
 */

import Link from "next/link";
import { Star, GitFork, Globe } from "lucide-react";

const LANG_GRADIENTS = {
  JavaScript: "linear-gradient(135deg,#f7df1e33,#f7df1e11)",
  TypeScript: "linear-gradient(135deg,#3178c633,#3178c611)",
  Dart: "linear-gradient(135deg,#0175c233,#0175c211)",
  Python: "linear-gradient(135deg,#3776ab33,#3776ab11)",
  Rust: "linear-gradient(135deg,#dea58433,#dea58411)",
  Go: "linear-gradient(135deg,#00add833,#00add811)",
  Java: "linear-gradient(135deg,#e76f0033,#e76f0011)",
};

function fallbackGradient(language) {
  return (
    LANG_GRADIENTS[language] ||
    "linear-gradient(135deg,var(--tw-gradient-stops, rgba(99,102,241,.18), rgba(99,102,241,.05)))"
  );
}

export default function ProjectCard({ project, creator }) {
  const p = project || {};
  const lang = p.repo_language || p.language || null;
  const stars = p.stars ?? p.stars_count ?? 0;
  const forks = p.forks ?? p.forks_count ?? 0;
  const title = p.title || "Untitled project";
  const description = p.description || "";
  const topics = Array.isArray(p.topics) ? p.topics.slice(0, 4) : [];
  const href = `/projects/${p.short_id || p.id}`;

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-[var(--card-bg,#fff)] text-[var(--card-fg,#111)] shadow-sm transition hover:shadow-md dark:bg-[var(--card-bg-dark,#0f172a)] dark:text-[var(--card-fg-dark,#f1f5f9)]"
    >
      {/* Optional cover image; graceful no-image layout when absent */}
      {p.cover_image_url ? (
        <img
          src={p.cover_image_url}
          alt={title}
          loading="lazy"
          className="h-36 w-full object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="h-36 w-full"
          style={{ background: fallbackGradient(lang) }}
        />
      )}

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold">{title}</h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
              (p.access_level || "basic") === "advanced"
                ? "bg-[var(--badge-advanced,#7c3aed22)] text-[var(--badge-advanced-fg,#6d28d9)]"
                : "bg-[var(--badge-basic,#0ea5e922)] text-[var(--badge-basic-fg,#0369a1)]"
            }`}
            title={(p.access_level || "basic") === "advanced" ? "Advanced: code explorer enabled" : "Basic: README only"}
          >
            {p.access_level || "basic"}
          </span>
        </div>

        <p className="line-clamp-2 text-sm opacity-70">
          {description || "No description"}
        </p>

        {topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {topics.map((t) => (
              <span
                key={t}
                className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] dark:bg-white/10"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs opacity-80">
          {lang && <span className="font-medium">{lang}</span>}
          <span className="inline-flex items-center gap-1">
            <Star size={13} aria-hidden /> {stars.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1">
            <GitFork size={13} aria-hidden /> {forks.toLocaleString()}
          </span>
          {creator && (
            <span className="inline-flex items-center gap-1">
              <img
                src={creator.avatar_url || creator.creator_avatar}
                alt=""
                className="h-4 w-4 rounded-full"
                loading="lazy"
              />
              @{creator.username || creator.creator_username}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
