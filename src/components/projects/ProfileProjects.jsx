"use client";

/**
 * src/components/projects/ProfileProjects.jsx
 * §A Profile Projects — cursor-paginated project grid for a user's profile,
 * reusing ProjectCard. Empty and error states included.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import ProjectCard from "./ProjectCard";
import { api } from "../../api/axios";

export default function ProfileProjects({ username }) {
  const [projects, setProjects] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const sentinelRef = useRef(null);

  const load = useCallback(
    async (cur) => {
      try {
        if (cur) setLoadingMore(true);
        const res = await api.get(`/github/showcase/by/${username}`, {
          params: { cursor: cur || undefined, limit: 12 },
        });
        setProjects((prev) =>
          cur ? [...prev, ...res.data.projects] : res.data.projects
        );
        setCursor(res.data.nextCursor || null);
        setError(null);
      } catch (err) {
        setError(err?.response?.status === 404 ? "NOT_FOUND" : "LOAD_FAILED");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [username]
  );

  useEffect(() => {
    load(null);
  }, [load]);

  // Infinite scroll via IntersectionObserver (cursor pagination)
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !cursor || loading || loadingMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) load(cursor);
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, loading, loadingMore, load]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-56 animate-pulse rounded-2xl bg-black/5 dark:bg-white/10" />
        ))}
      </div>
    );
  }

  if (error === "NOT_FOUND") return null; // profile has no showcase — hide section entirely

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center opacity-70">
        <p>Couldn’t load projects right now.</p>
        <button onClick={() => load(null)} className="mt-2 underline">
          Retry
        </button>
      </div>
    );
  }

  if (projects.length === 0) return null; // empty state: section hidden on other users' profiles

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">Projects</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.short_id} project={p} />
        ))}
      </div>
      <div ref={sentinelRef} aria-hidden className="h-1" />
      {loadingMore && (
        <p className="mt-4 text-center text-sm opacity-60">Loading more…</p>
      )}
    </div>
  );
}
