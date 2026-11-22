"use client";

/**
 * src/components/projects/CodeExplorer.jsx
 * §E Advanced Code Explorer — two-panel desktop / collapsible mobile.
 *
 * Error contract handled (from backend): FILE_TOO_LARGE, BINARY_FILE,
 * FILE_WITHHELD, FILE_NOT_FOUND, ADVANCED_NOT_AVAILABLE, truncated trees,
 * network errors.
 */

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, ChevronDown, File as FileIcon, FolderOpen, Folder } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { api } from "../../api/axios";

const ERROR_MESSAGES = {
  FILE_TOO_LARGE: "This file is too large to display (limit 512 KB).",
  BINARY_FILE: "Binary files can’t be displayed.",
  FILE_WITHHELD: "This file is withheld for security reasons.",
  FILE_NOT_FOUND: "File not found — it may have been moved or deleted.",
  ADVANCED_NOT_AVAILABLE: "The code explorer isn’t available for this project.",
  NETWORK: "Couldn’t reach the server. Try again.",
};

function buildTree(entries) {
  const root = { name: "", path: "", type: "tree", children: {} };
  for (const e of entries || []) {
    const parts = e.path.split("/");
    let node = root;
    parts.forEach((part, i) => {
      const isLeaf = i === parts.length - 1;
      if (!node.children[part]) {
        node.children[part] = isLeaf
          ? { name: part, path: e.path, type: e.type, size: e.size }
          : { name: part, path: parts.slice(0, i + 1).join("/"), type: "tree", children: {} };
      }
      node = node.children[part];
    });
  }
  return root;
}

function TreeNode({ node, depth, selected, onSelect }) {
  const [open, setOpen] = useState(depth < 1);
  const children = Object.values(node.children || {});

  if (node.type !== "tree") {
    return (
      <button
        onClick={() => onSelect(node.path)}
        className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left text-xs ${
          selected === node.path ? "bg-[var(--accent,#6366f1)]/10 font-medium" : ""
        }`}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        <FileIcon size={12} aria-hidden /> {node.name}
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-xs font-medium"
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {open ? <FolderOpen size={12} /> : <Folder size={12} />} {node.name || "/"}
      </button>
      {open &&
        children.map((c) => (
          <TreeNode key={c.path} node={c} depth={depth + 1} selected={selected} onSelect={onSelect} />
        ))}
    </div>
  );
}

export default function CodeExplorer({ shortId }) {
  const [tree, setTree] = useState(null);
  const [treeError, setTreeError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(false); // mobile collapsible

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/github/showcase/p/${shortId}/tree`)
      .then((res) => !cancelled && setTree(res.data))
      .catch((err) => {
        const code = err?.response?.data?.error;
        if (!cancelled) setTreeError(code && ERROR_MESSAGES[code] ? code : "NETWORK");
      });
    return () => {
      cancelled = true;
    };
  }, [shortId]);

  const root = useMemo(() => buildTree(tree?.entries), [tree]);

  const openFile = (path) => {
    setSelected(path);
    setExplorerOpen(false);
    setLoadingFile(true);
    setFileError(null);
    api
      .get(`/github/showcase/p/${shortId}/file`, { params: { path } })
      .then((res) => {
        setFile(res.data);
        // language from extension for highlighter
      })
      .catch((err) => {
        const code = err?.response?.data?.error;
        setFileError(code && ERROR_MESSAGES[code] ? code : "NETWORK");
        setFile(null);
      })
      .finally(() => setLoadingFile(false));
  };

  if (treeError) {
    return (
      <p className="py-10 text-center opacity-70">
        {ERROR_MESSAGES[treeError] || ERROR_MESSAGES.NETWORK}
      </p>
    );
  }

  if (!tree) {
    return <div className="h-64 animate-pulse rounded-2xl bg-black/5 dark:bg-white/10" />;
  }

  const langOf = (path) => {
    const ext = path.split(".").pop();
    return /^[a-z]{1,10}$/i.test(ext) ? ext.toLowerCase() : "text";
  };

  return (
    <div className="space-y-3">
      {tree.truncated && (
        <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          Large repository — showing the first 2,000 entries.
        </p>
      )}

      {/* Mobile: collapsible explorer */}
      <div className="lg:hidden">
        <button
          onClick={() => setExplorerOpen((o) => !o)}
          className="flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm"
        >
          <Folder size={14} /> {explorerOpen ? "Hide file explorer" : "Browse files"}
        </button>
        {explorerOpen && (
          <div className="mt-2 max-h-72 overflow-auto rounded-xl border p-2">
            <TreeNode node={root} depth={0} selected={selected} onSelect={openFile} />
          </div>
        )}
      </div>

      {/* Desktop: two-panel layout */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[280px_1fr]">
        <div className="max-h-[70vh] overflow-auto rounded-xl border p-2">
          <TreeNode node={root} depth={0} selected={selected} onSelect={openFile} />
        </div>
        <div className="max-h-[70vh] overflow-auto rounded-xl border">
          <FilePanel file={file} error={fileError} loading={loadingFile} selected={selected} langOf={langOf} />
        </div>
      </div>

      {/* Mobile: selected file viewer (horizontal code scrolling) */}
      <div className="lg:hidden">
        <FilePanel file={file} error={fileError} loading={loadingFile} selected={selected} langOf={langOf} />
      </div>
    </div>
  );
}

function FilePanel({ file, error, loading, selected, langOf }) {
  if (loading) {
    return <div className="h-48 m-3 animate-pulse rounded-xl bg-black/5 dark:bg-white/10" />;
  }
  if (error) {
    return <p className="p-6 text-center text-sm opacity-70">{ERROR_MESSAGES[error]}</p>;
  }
  if (!file && !selected) {
    return <p className="p-6 text-center text-sm opacity-60">Select a file to view its source.</p>;
  }
  if (!file) return null;

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between px-3 py-2 text-xs opacity-60">
        <span>{file.path}</span>
        <span>{Math.ceil((file.size || 0) / 1024)} KB</span>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={langOf(file.path)}
        wrapLongLines={false}
        customStyle={{ margin: 0, background: "transparent", fontSize: 12.5 }}
        codeTagProps={{ style: { whiteSpace: "pre" } }}
      >
        {file.content}
      </SyntaxHighlighter>
    </div>
  );
}
