"use client";

/**
 * src/components/projects/ProjectSearchResults.jsx
 * §B Search Projects tab — ProjectCard reuse + creator info + pagination.
 */

import { useEffect, useState } from "react";
import ProjectCard from "./ProjectCard";
import { api } from "../../api/axios";

export default function ProjectSearchResults({ query, onSelect }) {
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setItems([]);
    setOffset(0);
  }, [query]);

  useEffect(() => {
    if (!query?.trim()) return;
    let cancelled = false;
    setLoading(true);
    api
      .get("/search/section", {
        params: { q: query, type: "projects", limit: 12, offset },
      })
      .then((res) => {
        if (cancelled) return;
        setItems((prev) => (offset === 0 ? res.data.items : [...prev, ...res.data.items]));
        setHasMore(!!res.data.hasMore);
        setError(null);
      })
      .catch(() => !cancelled && setError("LOAD_FAILED"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query, offset]);

  if (!query?.trim()) return null;

  if (error) {
    return <p className="py-8 text-center opacity-70">Couldn’t load project results.</p>;
  }

  if (!loading && items.length === 0) {
    return <p className="py-8 text-center opacity-70">No projects found.</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <ProjectCard
            key={p.id || p.short_id}
            project={p}
            creator={{
              username: p.creator_username,
              name: p.creator_name,
              avatar_url: p.creator_avatar,
            }}
          />
        ))}
      </div>
      <div className="mt-6 text-center">
        {loading ? (
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : hasMore ? (
          <button onClick={() => setOffset((o) => o + 12)} className="rounded-full px-4 py-2 text-sm underline">
            Load more
          </button>
        ) : null}
      </div>
    </div>
  );
}
