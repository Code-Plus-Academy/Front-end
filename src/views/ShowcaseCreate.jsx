'use client';
/**
 * src/views/ShowcaseCreate.jsx — Project creation flow (PR 3 UI).
 *
 * Steps: 1) repository picker → 2) configuration form (title, description,
 * homepage, Basic/Advanced access) → 3) private-repo confirmation (if
 * applicable) → 4) create. Error contract matches the backend exactly:
 * REPOSITORY_ALREADY_ADDED / PRIVATE_CONFIRMATION_REQUIRED / INVALID_HOME_URL.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getConnectionStatus,
  listInstallationRepos,
  createProject,
} from '../api/showcase';
import { getErrorMessage } from '../api/axios';

const ACCESS_OPTIONS = [
  {
    value: 'basic',
    label: 'Basic',
    description: 'Profile card, project detail page, and README viewer.',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Everything in Basic plus a read-only code explorer (file tree + file viewer).',
  },
];

function ShowcaseCreate({ onCreated }) {
  const [step, setStep] = useState('picker'); // picker | form | confirm | done
  const [connection, setConnection] = useState(null);
  const [repos, setRepos] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    homepage_url: '',
    access_level: 'basic',
  });
  const [privateConfirmed, setPrivateConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load connection status + repository list together
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await getConnectionStatus();
        if (!status?.connected) {
          if (!cancelled) setError('Connect your GitHub account first.');
          return;
        }
        const repoList = await listInstallationRepos();
        if (!cancelled) {
          setConnection(status);
          setRepos(repoList);
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const chooseRepo = (repo) => {
    setSelectedRepo(repo);
    setForm((f) => ({
      ...f,
      title: repo.name,
      description: repo.description || '',
      homepage_url: repo.homepage || '',
    }));
    setPrivateConfirmed(false);
    setStep('form');
  };

  const handleFormChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const submitCreate = useCallback(async () => {
    if (!selectedRepo) return;
    setSubmitting(true);
    setError(null);
    try {
      const project = await createProject({
        repo_full_name: selectedRepo.full_name,
        title: form.title.trim(),
        description: form.description.trim() || null,
        homepage_url: form.homepage_url.trim() || null,
        access_level: form.access_level,
        is_private: !!selectedRepo.private,
        private_confirmed: selectedRepo.private ? privateConfirmed : false,
      });
      setStep('done');
      if (onCreated) onCreated(project);
    } catch (err) {
      const code = err?.response?.data?.error;
      if (code === 'PRIVATE_CONFIRMATION_REQUIRED') {
        setStep('confirm');
      } else if (code === 'REPOSITORY_ALREADY_ADDED') {
        setError('This repository is already showcased.');
        setStep('picker');
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }, [selectedRepo, form, privateConfirmed, onCreated]);

  const confirmPrivate = () => {
    setPrivateConfirmed(true);
    submitCreate();
  };

  const sortedRepos = useMemo(() => {
    if (!repos) return null;
    return [...repos].sort((a, b) => a.name.localeCompare(b.name));
  }, [repos]);

  if (loading) {
    return (
      <div className="showcase-create">
        <p className="text-muted">Loading repositories…</p>
      </div>
    );
  }

  if (!connection?.connected) {
    return (
      <div className="showcase-create">
        <h2>Create Project</h2>
        <div className="error-banner" role="alert">{error || 'Connect your GitHub account first.'}</div>
      </div>
      );
  }

  return (
    <div className="showcase-create">
      <h2>Create Project</h2>

      {error && <div className="error-banner" role="alert">{error}</div>}

      {step === 'picker' && (
        <div>
          <p>Pick a repository from your GitHub installation.</p>
          {!sortedRepos || sortedRepos.length === 0 ? (
            <p className="text-muted">No repositories found for this installation.</p>
          ) : (
            <ul className="repo-picker-list">
              {sortedRepos.map((repo) => (
                <li key={repo.full_name} className="repo-picker-item">
                  <button type="button" onClick={() => chooseRepo(repo)} className="repo-picker-button">
                    <span className="repo-name">{repo.full_name}</span>
                    <span className="repo-meta">
                      {repo.private ? 'Private' : 'Public'}
                      {repo.language ? ` · ${repo.language}` : ''}
                      {repo.stargazers_count ? ` · ★ ${repo.stargazers_count}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {step === 'form' && selectedRepo && (
        <div>
          <p>
            Repository: <strong>{selectedRepo.full_name}</strong>
            {selectedRepo.private ? ' (private)' : ''}
          </p>
          <label>
            Title
            <input
              type="text"
              value={form.title}
              onChange={handleFormChange('title')}
              maxLength={120}
              placeholder="Project title"
            />
          </label>
          <label>
            Description
            <textarea
              value={form.description}
          onChange={handleFormChange('description')}
              rows={3}
            />
          </label>
          <label>
            Homepage URL (optional)
            <input
              type="url"
              value={form.homepage_url}
              onChange={handleFormChange('homepage_url')}
              placeholder="https://example.com"
            />
          </label>
          <fieldset>
            <legend>Access level</legend>
            {ACCESS_OPTIONS.map((opt) => (
              <label key={opt.value} className="access-option">
                <input
                  type="radio"
                  name="access_level"
                  value={opt.value}
                  checked={form.access_level === opt.value}
                  onChange={() => setForm((f) => ({ ...f, access_level: opt.value }))}
                />
                <span>
                  <strong>{opt.label}</strong> — {opt.description}
                </span>
              </label>
            ))}
          </fieldset>

          {selectedRepo.private && (
            <label className="private-confirm">
              <input
                type="checkbox"
                checked={privateConfirmed}
                onChange={(e) => setPrivateConfirmed(e.target.checked)}
              />
              I confirm this repository is private and I want it visible on my
              profile to signed-in visitors (with owner confirmation on file).
            </label>
          )}

          <div className="action-row">
            <button type="button" onClick={() => setStep('picker')} className="btn-secondary">Back</button>
            <button
n              type="button"
              onClick={submitCreate}
              disabled={submitting || !form.title.trim()}
              className="btn-primary"
            >
              {submitting ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && selectedRepo && (
        <div className="confirm-private">
          <h3>Private repository confirmation</h3>
          <p>
            <strong>{selectedRepo.full_name}</strong> is private. To showcase it,
            you must explicitly confirm that you want this repository's public
            metadata and README shown on your FocusGram profile.
          </p>
          <div className="action-row">
            <button type="button" onClick={() => setStep('form')} className="btn-secondary">Back</button>
            <button type="button" onClick={confirmPrivate} disabled={submitting} className="btn-primary">
              {submitting ? 'Creating…' : 'Confirm and create'}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="success-box">
          <p>Project created. It now appears on your profile.</p>
          <button type="button" onClick={() => window.location.assign('/settings/github')} className="btn-secondary">
            Manage projects
          </button>
        </div>\      )}
    </div>
  );
}

export default ShowcaseCreate;
