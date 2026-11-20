'use client';

import api from './axios';
import {
  getGraphQLPostComments,
  addGraphQLPostComment,
  deleteGraphQLPostComment,
  getGraphQLVideoComments,
  addGraphQLVideoComment,
} from './graphql';

export const COMMENT_CONTENT_TYPES = Object.freeze([
  'post',
  'video',
  'short',
  'article',
  'project',
  'note',
]);

const COMMENTS_V2_ENABLED = process.env.NEXT_PUBLIC_COMMENTS_V2_ENABLED === 'true';
const ULID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function isCommentsV2Enabled() {
  return COMMENTS_V2_ENABLED;
}

function normalizeTarget({ contentType, contentId }) {
  if (!COMMENT_CONTENT_TYPES.includes(contentType)) {
    throw new TypeError(`Unsupported comment content type: ${contentType}`);
  }
  if (contentId === undefined || contentId === null || String(contentId).trim() === '') {
    throw new TypeError('A content ID is required for comments');
  }
  return { contentType, contentId: String(contentId) };
}

function targetPath(target) {
  const { contentType, contentId } = normalizeTarget(target);
  return `/comments/v2/targets/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}`;
}

function normalizeCommentPage(data) {
  const payload = data?.data && typeof data.data === 'object' ? data.data : data;
  const comments = payload?.comments ?? payload?.replies ?? payload?.items ?? payload?.results ?? [];
  return {
    comments: Array.isArray(comments) ? comments : [],
    nextCursor: payload?.nextCursor ?? payload?.next_cursor ?? null,
    hasMore: Boolean(payload?.hasMore ?? payload?.has_more ?? payload?.lastEvaluatedKey),
    count: payload?.count !== undefined || payload?.comment_count !== undefined || payload?.total_count !== undefined || payload?.totalCount !== undefined
      ? Number(payload?.count ?? payload?.comment_count ?? payload?.total_count ?? payload?.totalCount)
      : null,
  };
}

function isV2DisabledResponse(error) {
  return error?.response?.status === 503;
}

async function listLegacyComments(target, limit, cursor, { allowRestFallback = true } = {}) {
  const { contentType, contentId } = target;
  if (contentType === 'post') {
    try {
      return normalizeCommentPage(await getGraphQLPostComments(contentId, { first: limit, after: cursor }));
    } catch (error) {
      if (!allowRestFallback || error?.response?.status === 426) throw error;
      const response = await api.get(`/posts/${encodeURIComponent(contentId)}/comments`, { params: { limit } });
      return normalizeCommentPage(response.data);
    }
  }
  if (contentType === 'video' || contentType === 'short') {
    try {
      return normalizeCommentPage(await getGraphQLVideoComments(contentId, { limit }));
    } catch (error) {
      if (!allowRestFallback || error?.response?.status === 426) throw error;
      const response = await api.get(`/videos/${encodeURIComponent(contentId)}/comments`, { params: { limit } });
      return normalizeCommentPage(response.data);
    }
  }
  if (contentType === 'article') {
    const response = await api.get(`/articles/${encodeURIComponent(contentId)}/comments`, { params: { limit } });
    return normalizeCommentPage(response.data);
  }
  throw new Error(`Legacy comments are not available for ${contentType}.`);
}

async function listLegacyReplies(target, parentId, limit) {
  const { contentType, contentId } = target;
  if (contentType === 'post') {
    const response = await api.get(`/posts/${encodeURIComponent(contentId)}/comments/${encodeURIComponent(parentId)}/replies`, { params: { limit } });
    return normalizeCommentPage(response.data);
  }
  if (contentType === 'video' || contentType === 'short') {
    const response = await api.get(`/videos/${encodeURIComponent(contentId)}/comments/${encodeURIComponent(parentId)}/replies`, { params: { limit } });
    return normalizeCommentPage(response.data);
  }
  throw new Error(`Legacy replies are not available for ${contentType}.`);
}

async function createLegacyComment(target, text, parentId, { allowRestFallback = true } = {}) {
  const { contentType, contentId } = target;
  if (contentType === 'post') {
    try {
      return await addGraphQLPostComment(contentId, { body: text, parentId });
    } catch (error) {
      if (!allowRestFallback || error?.response?.status === 426) throw error;
      const response = await api.post(`/posts/${encodeURIComponent(contentId)}/comments`, {
        body: text,
        ...(parentId ? { parent_id: parentId } : {}),
      });
      return response.data?.comment ?? response.data;
    }
  }
  if (contentType === 'video' || contentType === 'short') {
    try {
      return await addGraphQLVideoComment(contentId, { text, parentId });
    } catch (error) {
      if (!allowRestFallback || error?.response?.status === 426) throw error;
      const response = await api.post(`/videos/${encodeURIComponent(contentId)}/comments`, {
        text,
        ...(parentId ? { parent_id: parentId } : {}),
      });
      return response.data?.comment ?? response.data;
    }
  }
  if (contentType === 'article' && !parentId) {
    const response = await api.post(`/articles/${encodeURIComponent(contentId)}/comments`, { content: text });
    return response.data?.comment ?? response.data;
  }
  throw new Error(`Legacy comments are not available for ${contentType}.`);
}

async function deleteLegacyComment(target, commentId, { allowRestFallback = true } = {}) {
  const { contentType, contentId } = target;
  if (contentType === 'post') {
    try {
      return await deleteGraphQLPostComment(contentId, commentId);
    } catch (error) {
      if (!allowRestFallback || error?.response?.status === 426) throw error;
      const response = await api.delete(`/posts/${encodeURIComponent(contentId)}/comments/${encodeURIComponent(commentId)}`);
      return response.data;
    }
  }
  throw new Error(`Legacy comment deletion is not available for ${contentType}.`);
}

function stableDraftHash(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function createCommentUlid() {
  const now = BigInt(Date.now());
  let randomValue = 0n;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = crypto.getRandomValues(new Uint8Array(10));
    for (const byte of bytes) randomValue = (randomValue << 8n) | BigInt(byte);
  } else {
    randomValue = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
  }

  let timePart = now;
  let randomPart = randomValue;
  let output = '';
  for (let index = 0; index < 10; index += 1) {
    output = ULID_ALPHABET[Number(timePart & 31n)] + output;
    timePart >>= 5n;
  }
  for (let index = 0; index < 16; index += 1) {
    output += ULID_ALPHABET[Number(randomPart & 31n)];
    randomPart >>= 5n;
  }
  return output;
}

function pendingKey(target, userId, parentId) {
  const { contentType, contentId } = normalizeTarget(target);
  return `comments:v2:pending:${encodeURIComponent(String(userId || 'anonymous'))}:${contentType}:${encodeURIComponent(contentId)}:${encodeURIComponent(String(parentId || 'root'))}`;
}

export function getPendingCommentUlid(target, userId, text, parentId = null) {
  const id = createCommentUlid();
  if (typeof window === 'undefined') return id;

  const key = pendingKey(target, userId, parentId);
  const draftHash = stableDraftHash(String(text || '').trim());
  try {
    const current = JSON.parse(window.localStorage.getItem(key) || 'null');
    if (current?.ulid && current.draftHash === draftHash) return current.ulid;
    window.localStorage.setItem(key, JSON.stringify({ ulid: id, draftHash }));
  } catch {
    return id;
  }
  return id;
}

export function clearPendingCommentUlid(target, userId, parentId, ulid) {
  if (typeof window === 'undefined') return;
  const key = pendingKey(target, userId, parentId);
  try {
    const current = JSON.parse(window.localStorage.getItem(key) || 'null');
    if (!ulid || current?.ulid === ulid) window.localStorage.removeItem(key);
  } catch {
    // Storage can be disabled; the server remains the source of truth.
  }
}

export async function listComments(target, { limit = 20, cursor = null } = {}) {
  const normalized = normalizeTarget(target);
  if (isCommentsV2Enabled()) {
    try {
      const response = await api.get(`${targetPath(normalized)}/comments`, {
        params: { limit, ...(cursor ? { cursor } : {}) },
      });
      return normalizeCommentPage(response.data);
    } catch (error) {
      if (isV2DisabledResponse(error)) return listLegacyComments(normalized, limit, cursor, { allowRestFallback: false });
      throw error;
    }
  }
  return listLegacyComments(normalized, limit, cursor);
}

export async function listCommentReplies(target, parentId, { limit = 20, cursor = null } = {}) {
  const normalized = normalizeTarget(target);
  if (!parentId) throw new TypeError('A parent comment ID is required');
  if (isCommentsV2Enabled()) {
    try {
      const response = await api.get(
        `${targetPath(normalized)}/comments/${encodeURIComponent(parentId)}/replies`,
        { params: { limit, ...(cursor ? { cursor } : {}) } },
      );
      return normalizeCommentPage(response.data);
    } catch (error) {
      if (isV2DisabledResponse(error)) return listLegacyReplies(normalized, parentId, limit);
      throw error;
    }
  }
  return listLegacyReplies(normalized, parentId, limit);
}

export async function createComment(target, { text, parentId = null, ulid, files = [], attachmentKinds = [] }) {
  const normalized = normalizeTarget(target);
  if (isCommentsV2Enabled()) {
    const path = `${targetPath(normalized)}/comments`;
    try {
      const payload = files.length ? new FormData() : { ulid, text };
      if (files.length) {
        payload.append('ulid', ulid || '');
        payload.append('text', text || '');
        payload.append('attachment_kinds', JSON.stringify(attachmentKinds));
        files.forEach((file) => payload.append('attachments', file, file.name));
      }
      const response = parentId
        ? await api.post(`${path}/${encodeURIComponent(parentId)}/replies`, payload, files.length ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined)
        : await api.post(path, payload, files.length ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
      return response.data?.item ?? response.data?.comment ?? response.data;
    } catch (error) {
      if (files.length) throw error;
      if (isV2DisabledResponse(error)) return createLegacyComment(normalized, text, parentId, { allowRestFallback: false });
      throw error;
    }
  }
  if (files.length) throw new Error('Photo and GIF comments are available when comments V2 is enabled.');
  return createLegacyComment(normalized, text, parentId);
}

export async function editComment(target, commentId, { text, parentId = null }) {
  if (!isCommentsV2Enabled()) throw new Error('Comment editing will be available after comments V2 is enabled.');
  const response = await api.patch(
    `${targetPath(target)}/comments/${encodeURIComponent(commentId)}`,
    { text, ...(parentId ? { parent_id: parentId } : {}) },
  );
  return response.data?.item ?? response.data?.comment ?? response.data;
}

export async function deleteComment(target, commentId, { parentId = null } = {}) {
  if (isCommentsV2Enabled()) {
    try {
      const response = await api.delete(`${targetPath(target)}/comments/${encodeURIComponent(commentId)}`, {
        params: parentId ? { parent_id: parentId } : undefined,
      });
      return response.data;
    } catch (error) {
      if (isV2DisabledResponse(error)) return deleteLegacyComment(normalizeTarget(target), commentId, { allowRestFallback: false });
      throw error;
    }
  }
  return deleteLegacyComment(normalizeTarget(target), commentId);
}

export async function getCommentCount(target) {
  if (isCommentsV2Enabled()) {
    try {
      const response = await api.get(`${targetPath(target)}/comments/count`);
      const count = response.data?.count ?? response.data?.comment_count;
      return count === undefined || count === null ? null : Number(count);
    } catch (error) {
      if (!isV2DisabledResponse(error)) throw error;
      const page = await listLegacyComments(normalizeTarget(target), 1, null, { allowRestFallback: false });
      return page.count;
    }
  }
  const page = await listLegacyComments(normalizeTarget(target), 1, null);
  return page.count;
}
