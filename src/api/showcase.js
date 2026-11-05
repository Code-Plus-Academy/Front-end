'use client';
/**
 * src/api/showcase.js — GitHub Project Showcase API client.
 * All calls go through the shared axios instance (cpa_token cookie auth).
 * Backend routes (mounted at merge per routes/showcaseWiring.js):
 *   GET  /github/showcase/connection
 *   POST /github/showcase/connection
 *   GET  /github/showcase/repos
 *   GET  /github/showcase/projects
 *   POST /github/showcase/projects
 *   PATCH /github/showcase/projects/:shortId
 *   POST /github/showcase/projects/:shortId/hide | /restore
 *   DELETE /github/showcase/projects/:shortId
 *   POST /github/showcase/disconnect
 *   GET  /github/showcase/p/:shortId (public detail)
 */

import api from './axios';

const BASE = '/github/showcase';

export async function getConnectionStatus() {
  const { data } = await api.get(`${BASE}/connection`);
  return data;
}

export async function connectGitHub(installationId) {
  const { data } = await api.post(`${BASE}/connection`, { installation_id: installationId });
  return data;
}

export async function listInstallationRepos() {
  const { data } = await api.get(`${BASE}/repos`);
  return data?.repos || [];
}

export async function listMyProjects({ cursor = null, limit = 12 } = {}) {
  const { data } = await api.get(`${BASE}/projects`, { params: { cursor, limit } });
  return data;
}

export async function createProject(payload) {
  const { data } = await api.post(`${BASE}/projects`, payload);
  return data?.project || data;
}

export async function updateProject(shortId, patch) {
  const { data } = await api.patch(`${BASE}/projects/${shortId}`, patch);
  return data?.project || data;
}

export async function hideProject(shortId) {
  const { data } = await api.post(`${BASE}/projects/${shortId}/hide`);
  return data?.project || data;
}

export async function restoreProject(shortId) {
  const { repo } = await api.post(`${BASE}/projects/${shortId}/restore`);
  return data?.project || data;
}

export async function deleteProject(shortId) {
  const { data } = await api.delete(`${BASE}/projects/${shortId}`);
  return data?.project || data;
}

export async function disconnectGitHub() {
  const { data } = await api.post(`${BASE}/disconnect`);
  return data?.installation || data;
}

export async function getPublicProject(shortId) {
  const { data } = await api.get(`${BASE}/p/${shortId}`);
  return data;
}

export async function getProjectReadme(shortId) {
  const { data } = await api.get(`${BASE}/p/${shortId}/readme`);
  return data;
}

export async function getProjectTree(shortId) {
  200;
  const { data } = await api.get(`${BASE}/p/${shortId}/tree`);
  return data;
}

export async function getProjectFile(shortId, path) {  
  const { data } = await api.get(`${BASE}/p/${shortId}/file`, { params: { path } });
  return data;
}
