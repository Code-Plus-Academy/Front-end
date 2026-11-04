"use client";

/**
 * src/components/projects/GitHubConnect.jsx
 * §5 Connection management — connect button, callback page target, repo
 * picker, public/private indicators, already-added state, Basic/Advanced
 * selector, private confirmation, management list actions.
 */

import { useCallback, useEffect, useState } from "react";
import { Star, GitFork, Eye, EyeOff, Trash2, Link2Off, Plus, Check } from "lucide-react";
import { api } from "../../api/axios";

export default function GitHubConnect({ onProjectsChanged }) {
  const [connection, setConnection] = useState(null); // { installation } | null
  const [repos, setRepos] = useState(null);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(null); // active creation form for a repo
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const refreshProjects = useCallback(async () => {
    try {
      const res = await api.get("/github/showcase/projects");
      setProjects(res.data.projects || []);
      onProjectsChanged?.();
    } catch {
      /* management list optional */
    }
  }, [onProjectsChanged]);

  const refreshConnection = useCallback(async () => {
    try {
      const res = await api.get("/github/showcase/repos");
      setConnection(res.data);
      setRepos(res.data.repos || []);
    } catch (err) {
      if (err?.response?.status === 404) setConnection(null);
      else setError("LOAD_FAILED");
    }
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  useEffect(() => {
    refreshConnection();
  }, [refreshConnection]);

  // ── Not connected: Connect with GitHub (GitHub App install flow) ────────
  if (!connection) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center">
        <h3 className="font-semibold">GitHub Projects</h3>
        <p className="mt-1 text-sm opacity-70">
          Connect your GitHub account to showcase your repositories on your profile.
        </p>
        {error && <p className="mt-2 text-sm text-red-500">Couldn’t load. Try again.</p>}
        <a
          href="/api/github/showcase/connect" // backend 302 -> GitHub App install URL
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--accent,#6366f1)] px-4 py-2 text-sm font-medium text-white"
        >
          <Plus size={15} /> Connect GitHub
        </a>
      </div>
    );
  }

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.post("/github/showcase/projects", form);
      setForm(null);
      await Promise.all([refreshProjects(), refreshConnection()]);
    } catch (err) {
      const code = err?.response?.data?.error;
      setError(
        code === "PRIVATE_CONFIRMATION_REQUIRED"
          ? "Please confirm you want to showcase this private repository."
          : code === "REPOSITORY_ALREADY_ADDED"
          ? "This repository is already in your showcase."
          : "Couldn’t add the project. Try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const action = async (shortId, verb) => {
    setBusy(true);
    try {
      if (verb === "hide") await api.post(`/github/showcase/projects/${shortId}/hide`);
      if (verb === "restore") await api.post(`/github/showcase/projects/${shortId}/restore`);
      if (verb === "delete") await api.delete(`/github/showcase/projects/${shortId}`);
      await refreshProjects();
    } catch {
      setError("Action failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm("Disconnect GitHub? All your showcase projects will be hidden.")) return;
    setBusy(true);
    try {
      await api.post("/github/showcase/disconnect");
      setConnection(null);
      setRepos(null);
      setProjects([]);
      onProjectsChanged?.();
    } catch {
      setError("Disconnect failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const addedRepos = new Set(projects.map((p) => p.repo_full_name));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">GitHub Projects</h3>
        <button onClick={disconnect} disabled={busy} className="inline-flex items-center gap-1 text-sm underline opacity-70">
          <Link2Off size={14} /> Disconnect
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Management list */}
      {projects.length > 0 && (
        <ul className="divide-y rounded-2xl border">
          {projects.map((p) => (
            <li key={p.short_id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {p.title} <span className="opacity-50">· {p.repo_full_name}</span>
                </p>
                <p className="text-xs opacity-60">
                  {p.access_level} · {p.status} {p.is_private ? "· private" : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {p.status === "active" ? (
                  <button title="Hide" onClick={() => action(p.short_id, "hide")} disabled={busy} className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10">
                    <EyeOff size={15} />
                  </button>
                ) : (
                  <button title="Restore" onClick={() => action(p.short_id, "restore")} disabled={busy} className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10">
                    <Eye size={15} />
                  </button>
                )}
                <button title="Delete" onClick={() => action(p.short_id, "delete")} disabled={busy} className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10">
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Repository picker */}
      {repos && repos.length === 0 && (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm opacity-70">
          No repositories available in this GitHub installation.
        </p>
      )}
      {repos && repos.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium">Add a repository</h4>
          <ul className="grid gap-2">
            {repos.map((r) => {
              const added = addedRepos.has(r.full_name);
              return (
                <li key={r.full_name} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <p className="flex flex-wrap items-center gap-2 text-xs opacity-60">
                      {r.private ? <span className="font-medium text-amber-600">Private</span> : <span>Public</span>}
                      {r.language && <span>· {r.language}</span>}
                      <span className="inline-flex items-center gap-1">· <Star size={11} /> {r.stargazers_count}</span>
                      <span className="inline-flex items-center gap-1">· <GitFork size={11} /> {r.forks_count}</span>
                    </p>
                  </div>
                  {added ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs opacity-60">
                      <Check size={13} /> Added
                    </span>
                  ) : (
                    <button
                      onClick={() => setForm({
                        repo_full_name: r.full_name,
                        repo_node_id: r.node_id,
                        title: r.name,
                        description: r.description || "",
                        homepage_url: r.homepage || "",
                        is_private: r.private,
                        private_confirmed: false,
                        access_level: "basic",
                      })}
                      className="shrink-0 rounded-full bg-[var(--accent,#6366f1)] px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Add
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Creation form (private confirmation + access level) */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setForm(null)}>
          <div className="w-full max-w-md rounded-2xl bg-[var(--card-bg,#fff)] p-5 dark:bg-[var(--card-bg-dark,#0f172a)]" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-semibold">Add {form.repo_full_name}</h4>
            <label className="mt-3 block text-xs font-medium">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={120}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
            />
            <label className="mt-3 block text-xs font-medium">Homepage URL (optional)</label>
            <input
              value={form.homepage_url}
              onChange={(e) => setForm({ ...form, homepage_url: e.target.value })}
              placeholder="https://"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
            />
            <p className="mt-3 text-xs font-medium">Access level</p>
            <div className="mt-1 flex gap-2">
              {["basic", "advanced"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setForm({ ...form, access_level: lvl })}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs ${
                    form.access_level === lvl ? "border-[var(--accent,#6366f1)] font-medium" : "opacity-70"
                  }`}
                >
                  {lvl === "basic" ? "Basic — README only" : "Advanced — code explorer"}
                </button>
              ))}
            </div>
            {form.is_private && (
              <label className="mt-4 flex items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={form.private_confirmed}
                  onChange={(e) => setForm({ ...form, private_confirmed: e.target.checked })}
                  className="mt-0.5"
                />
                <span>
                  This is a <strong>private repository</strong>. I understand its contents
                  will be visible on my FocusGram profile as configured.
                </span>
              </label>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setForm(null)} className="rounded-full px-4 py-2 text-sm">Cancel</button>
              <button
                onClick={create}
                disabled={busy || !form.title.trim() || (form.is_private && !form.private_confirmed)}
                className="rounded-full bg-[var(--accent,#6366f1)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {busy ? "Adding…" : "Add project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
