'use client';
/**
 * src/views/ShowcaseManage.jsx — owner project management list (PR 3 UI).
 * Cursor-paginated list with hide/restore, edit (title/description/homepage/
 * access level), and soft delete with confirmation. Empty, loading, and error
 * states per the approved UI spec.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  listMyProjects,
  updateProject,
  hideProject,
  restoreProject,
  deleteProject,
} from '../api/showcase';
import { getErrorMessage } from '../api/axios';

const PAGE_SIZE = 12;

function ShowcaseManage() {
  const [projects, setProjects] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // project being edited
  const [confirmDelete, setConfirmDelete] = useState(null); // project id
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async (nextCursor) => {
    try {
      setBusyId('page');
      const data = await listMyProjects({ cursor: nextCursor, limit: PAGE_SIZE });
      const rows = data?.projects || [];
      setProjects((prev) => (nextCursor ? [...prev, ...rows] : rows));
      setHasMore(!!data?.nextCursor);
      setCursor(data?.nextCursor || null);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(null);
  }, [load]);

  const applyLocalUpdate = (shortId, patch) => {
    setProjects((prev) => prev.map((p) => (p.short_id === shortId ? { ...p, ...patch } : p)));
  };

  const handleHide = async (project) => {
    try {
      setBusyId(project.short_id);
      const updated = await hideProject(project.short_id);
      applyLocalUpdate(project.short_id, updated || { status: 'hidden' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleRestore = async (project) => {
    try {
      setBusyId(project.short_id);
      const updated = await restoreProject(project.short_id);
      applyLocalUpdate(project.short_id, updated || { status: 'active' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (project) => {
    setConfirmDelete(null);
    try {
      setBusyId(project.short_id);
      await deleteProject(project.short_id);
      setProjects((prev) => prev.filter((p) => p.short_id !== project.short_id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveEdit = async (patch) => {
    if (!editing) return;
    try {
      setBusyId(editing.short_id);
      const updated = await updateProject(editing.short_id, patch);
      applyLocalUpdate(editing.short_id, updated || patch);
      setEditing(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="showcase-manage">
      <h2>Your Projects</h2>

      {error && <div className="error-banner" role="alert">{error}</div>}

      {loading ? (
        <p className="text-muted">Loading your projects…</p>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <p>You haven't showcased any repositories yet.</p>
          <a href="/settings/github/new" className="btn-primary">Create your first project</a>
        </div>
      ) : (
        <>
          <ul className="project-manage-list">
            {projects.map((project) => (
              <li key={project.short_id} className="project-manage-item">
                <div className="project-manage-head">
                  <strong>{project.title}</strong>
                  <span className={`status-badge status-${project.status}`}>{project.status}</span>
                  <span className={`access-badge access-${project.access_level}`}>{project.access_level}</span>
                </div>
                <div className="project-manage-meta">
                  {project.repo_full_name}
                  {project.is_private ? ' · private' : ''}
                </div>
                <div className="action-row">
                  <button type="button" onClick={() => setEditing(project)} className="btn-secondary"
                    disabled={busyId === project.short_id}>
                    Edit
                  </button>
                  {project.status === 'active' ? (
                    <button type="button" onClick={() => handleHide(project)} className="btn-secondary"
                      disabled={busyId === project.short_id}>
                      Hide
                    </button>
                  ) : (
                    <button type="button" onClick={() => handleRestore(project)} className="btn-secondary"
                      disabled={busyId === project.short_id || project.status === 'access_revoked'}>
                      Restore
                    </button>
                  )}
                  <button type="button" onClick={() => setConfirmDelete(project)} className="btn-danger"
                    disabled={busyId === project.short_id}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="action-row">
              <button type="button" onClick={() => load(cursor)} className="btn-secondary" disabled={busyId === 'page'}>
                {busyId === 'page' ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}

      {editing && (
        <EditDialog project={editing} onSave={handleSaveEdit} onClose={() => setEditing(null)} busy={busyId === editing.short_id} />
      )}

      {confirmDelete && (
        <div className="confirm-dialog" role="dialog" aria-modal="true">
          <p>Delete <strong>{confirmDelete.title}</strong> from your profile? The repository can be re-added later.</p>
          <div className="action-row">
            <button type="button" onClick={() => handleDelete(confirmDelete)} className="btn-danger">Delete</button>
            <button type="button" onClick={() => setConfirmDelete(null)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditDialog({ project, onSave, onClose, busy }) {
  const [title, setTitle] = useState(project.title || '');
  const [description, setDescription] = useState(project.description || '');
  const [homepageUrl, setHomepageUrl] = useState(project.homepage_url || '');
  const [accessLevel, setAccessLevel] = useState(project.access_level || 'basic');

  return (
    <div className="edit-dialog" role="dialog" aria-modal="true">
      <h3>Edit project</h3>
      <label>
        Title
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </label>
      <label>
        Homepage URL (optional)
        <input type="url" value={homepageUrl} onChange={(e) => setHomepageUrl(e.target.value)} placeholder="https://example.com" />
      </label>
      <fieldset>
        <legend>Access level</legend>
        <label className="access-option">
          <input type="radio" name="edit_access_level" value="basic" checked={accessLevel === 'basic'}
            onChange={() => setAccessLevel('basic')} />
          <span>Basic</span>
        </label>
        <label className="access-option">
          <input type="radio" name="edit_access_level" value="advanced" checked={accessLevel === 'advanced'}
            onChange={() => setAccessLevel('advanced')} />
          <span>Advanced</span>
        </label>
      </fieldset>
      <div className="action-row">
        <button
          type="button"
          className="btn-primary"
          disabled={busy || !title.trim()}
          onClick={() => onSave({
            title: title.trim(),
            description: description.trim() || null,
            homepage_url: homepageUrl.trim() || null,
            access_level: accessLevel,
          })}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
      </div>
    </div>
  );
}

export default ShowcaseManage;
