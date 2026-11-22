"use client";

/**
 * app/settings/connections/page.jsx
 * GitHub connection settings host page.
 */

import GitHubConnect from "@/components/projects/GitHubConnect";

export default function ConnectionsSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">Connections</h1>
      <GitHubConnect />
    </div>
  );
}
