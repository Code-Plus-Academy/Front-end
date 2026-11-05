'use client';
/**
 * src/api/showcase.js — GitHub Project Showcase API client.
 * All calls go through the shared axios instance (cpa_token cookie auth).
 * Backend routes (mounted at merge per routes/showcaseWiring.js).
 */

import api from './axios';

const BASE = '/github/showcase';

// GET /github/showcase/connection — status for the settings UI
export async function getConnectionStatus() {
  const { data } = await api.get(`${BASE}/connection`);
  return data;
}

// POST /github/showcase/connection — link installation after callback
export async function connectGitHub(installationId) {
  const { data } = await api.post(`${BASE}/connection`, { installation_id: installationId });
  return data;
}

// GET /github/showcase/repos — installation repository picker
export async function listInstallationRepos() {
  const { data } = await api.get(`${BASE}/repos`);
  return data?.repos || [];
}

// GET /github/showcase/projects — owner management list (cursor paginated)
export async function listMyProjects({ cursor = null, limit = 12 } = {}) {
  const { data } = await api.get(`${BASE}/projects`, { params: { cursor, limit } });
  return data;
}

// POST /github/showcase/projects — create a showcase project
export async function createProject(payload) {
  const { data } = await api.post(`${BASE}/projects`, payload);
  return data?.project || data;
}

// PATCH /github/showcase/projects/:shortId — edit title/description/homepage/access
export async function updateProject(shortId, patch) {
  const { data } = await api.patch(`${BASE}/projects/${shortId}`, patch);
  return data?.project || data;
}

// POST /github/showcase/projects/:shortId/hide
export async function hideProject(shortId) {
  const { data } = await api.post(`${BASE}/projects/${shortId}/hide`);
  return data?.project || data;
}

// POST /github/showcase/projects/:shortId/restore
export async function restoreProject(shortId) {
  const { data } = await api.post(`${BASE}/projects/${shortId}/restore`);
  return data?.project || data;
}

// DELETE /github/showcase/projects/:shortId — soft delete
export async function deleteProject(shortId) {
  const { data } = await api.delete(`${BASE}/projects/${shortId}`);
  return data?.project || data;
}

// POST /github/showcase/disconnect
export async function disconnectGitHub() {
  const { data } = await api.post(`${BASE}/disconnect`);
  return data?.installation || data;
}

// GET /github/showcase/p/:shortId — public project detail
export async function getPublicProject(shortId) {
  const { data } = await api.get(`${BASE}/p/${shortId}`);
  return data;
}

// GET /github/showcase/p/:shortId/readme
export async function getProjectReadme(shortId) {
  const { data } = await api.get(`${BASE}/p/${shortId}/readme`);
  return data;
}

// GET /github/showcase/p/:shortId/tree — advanced code tree
export async function getProjectTree(shortId) {
  const { data } = await api.get(`${BASE}/p/${shortId}/tree`);
  return data;
}

// GET /github/showcase/p/:shortId/file?path=... — advanced file content
export async function getProjectFile(shortId, path) {
  const { data } = await api.get(`${BASE}/p/${shortId}/file`, { params: { path } });
  return data;
}
