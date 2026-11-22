"use client";

/**
 * app/projects/[shortId]/page.jsx
 * §C Project Detail — creator identity, header, links, stats, topics,
 * README-first navigation, Advanced Code tab, responsive + adaptive theme.
 */

import { useState } from "react";
import { Star, GitFork, ExternalLink, Home } from "lucide-react";
import { notFound } from "next/navigation";
import ReadmeView from "@/components/projects/ReadmeView";
import CodeExplorer from "@/components/projects/CodeExplorer";
import { api } from "@/api/axios";

export default async function ProjectDetailPage({ params }) {
  const { shortId } = params;

  let project;
  try {
    const res = await api.get(`/github/showcase/p/${shortId}`);
    project = res.data;
  } catch (err) {
    if (err?.response?.status === 404) notFound();
    throw err;
  }

  return <ProjectDetailClient project={project} shortId={shortId} />;
}

function ProjectDetailClient({ project, shortId }) {
  const [tab, setTab] = useState("readme");
  const advanced = project.access_level === "advanced";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <header className="mb-6">
        {project.cover_image_url && (
          <img
            src={project.cover_image_url}
            alt={project.title}
            className="mb-4 h-44 w-full rounded-2xl object-cover"
          />
        )}
        <h1 className="text-2xl font-bold">{project.title}</h1>
        {project.description && (
          <p className="mt-1 opacity-70">{project.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <a
            href={project.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline"
          >
            <ExternalLink size={14} /> Repository
          </a>
          {project.homepage_url && (
            <a
              href={project.homepage_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline"
            >
              <Home size={14} /> Homepage
            </a>
          )}
          {project.language && <span className="font-medium">{project.language}</span>}
          <span className="inline-flex items-center gap-1">
            <Star size={14} /> {project.stars.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1">
            <GitFork size={14} /> {project.forks.toLocaleString()}
          </span>
        </div>

        {Array.isArray(project.topics) && project.topics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {project.topics.map((t) => (
              <span
                key={t}
                className="rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Tabs: README-first, Advanced gated */}
      <nav className="mb-4 flex gap-1 border-b">
        <TabButton active={tab === "readme"} onClick={() => setTab("readme")}>
          README
        </TabButton>
        {advanced && (
          <TabButton active={tab === "code"} onClick={() => setTab("code")} disabled={!advanced}>
            Code
          </TabButton>
        )}
      </nav>

      {tab === "readme" ? (
        <ReadmeView markdown={project.readme} />
      ) : (
        <CodeExplorer shortId={shortId} />
      )}
    </main>
  );
}

function TabButton({ active, onClick, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-[var(--accent,#6366f1)] text-[var(--accent,#6366f1)]"
          : "border-transparent opacity-60 hover:opacity-100"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      {children}
    </button>
  );
}
