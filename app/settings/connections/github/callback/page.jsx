"use client";

/**
 * app/settings/connections/github/callback/page.jsx
 * GitHub App installation callback page. The backend verifies the install
 * server-side (installation_id param) and the user lands here.
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function GitHubCallbackPage() {
  const params = useSearchParams();
  const installationId = params.get("installation_id");
  const setupAction = params.get("setup_action");
  const [status, setStatus] = useState("processing");

  useEffect(() => {
    if (!installationId) {
      setStatus("error");
      return;
    }
    // Backend completes the link between the FocusGram session and the
    // installation; 409/4xx states surface as user-readable errors.
    import("@/api/axios").then(({ api }) =>
      api
        .post("/github/showcase/connect/complete", { installation_id: Number(installationId) })
        .then(() => setStatus("done"))
        .catch(() => setStatus("error"))
    );
  }, [installationId]);

  if (status === "processing") {
    return <Center>Linking your GitHub installation…</Center>;
  }
  if (status === "error") {
    return (
      <Center>
        <p>We couldn’t link that GitHub installation.</p>
        {setupAction === "update" && (
          <p className="mt-1 opacity-60">The installation was updated — nothing more to do.</p>
        )}
        <Link href="/settings/connections" className="mt-4 underline">
          Back to connections
        </Link>
      </Center>
    );
  }
  return (
    <Center>
      <p>GitHub connected. 🎉</p>
      <Link href="/settings/connections" className="mt-4 underline">
        Choose repositories to showcase
      </Link>
    </Center>
  );
}

function Center({ children }) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-10 text-center">
      {children}
    </main>
  );
}
