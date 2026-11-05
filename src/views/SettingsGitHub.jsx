'use client';
/**
 * src/views/SettingsGitHub.jsx — GitHub Project Showcase settings section.
 *
 * Flow:
 *   1. User clicks Connect → opens the GitHub App install URL in a new tab
 *      (backend serves the app slug via the connection status response
 *      extension; the URL is github.com/apps/<slug>/installations/new).
 *   2. GitHub redirects back to the configured callback with installation_id
 *      in the query string.
 *   3. This component detects the callback param and POSTs the id to the
 *      connection endpoint for server-side verification + linking.
 *
 * Security: the installation_id is verified against the GitHub App API by the
 * backend before linking (connectionService.saveConnection) — this UI never
 * trusts client-side state for authorization.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getConnectionStatus, connectGitHub, disconnectGitHub } from '../api/showcase';
import { getErrorMessage } from '../api/axios';

function SettingsGitHub() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState(null);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
      setStatus(await getConnectionStatus());
      setActionError(null);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial status load
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Handle the GitHub App install callback: installation_id arrives as a
  // query param on the redirect target configured in the GitHub App settings.
  const installationIdParam = searchParams.get('installation_id');
  useEffect(() => {
    if (!installationIdParam) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const result = await connectGitHub(Number(installationIdParam));
        if (!cancelled) setStatus(result);
      } catch (err) {
        if (!cancelled) setActionError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [installationIdParam]);

  const handleConnect = () => {
    if (!status?.app_slug) {
      setActionError('GitHub App is not configured. Please try again later.');
      return;
    }
    window.open(
      `https://github.com/apps/${status.app_slug}/installations/new`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleDisconnect = async () => {
    setConfirmingDisconnect(false);
    try {
      setLoading(true);
      await disconnectGitHub();
      await refreshStatus();
    } catch (err) {
      setActionError(getErrorMessage(err));
      setLoading(false);
    }
  };

  if (loading && !status) {
    return (
      <div className="settings-section">
        <h3>GitHub</h3>
        <p className="text-muted">Loading connection status…</p>
      </div>
    );
  }

  return (
    <div className="settings-section">
      <h3>GitHub</h3>

      {actionError && (
        <div className="error-banner" role="alert">{actionError}</div>
      )}

      {status?.connected ? (
        <>
          <p>
            Connected as <strong>{status.github_login}</strong>
            {' '}(personal account)
          </p>
          {confirmingDisconnect ? (
            <div className="confirm-row">
              <span>Disconnect GitHub? This revokes access to all showcased repositories.</span>
              <button type="button" onClick={handleDisconnect} className="btn-danger">Yes, disconnect</button>
              <button type="button" onClick={() => setConfirmingDisconnect(false)} className="btn-secondary">Cancel</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmingDisconnect(true)} className="btn-secondary">
              Disconnect GitHub
            </button>
          )}
        </>
      ) : (
        <>
          <p>Showcase your GitHub repositories on your FocusGram profile.</p>
          <button
            type="button"
            onClick={handleConnect}
            disabled={loading}
            className="btn-primary"
          >
            Connect GitHub
          </button>
        </>
      )}
    </div>
  );
}

export default SettingsGitHub;
