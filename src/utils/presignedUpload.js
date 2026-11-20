'use client';

/**
 * Presigned direct-to-S3 upload.
 *
 * The Next.js proxy route (/api/upload/media) forwards multipart bodies
 * through a Vercel serverless function, which caps request bodies at
 * ~4.5 MB and adds an extra hop. For notes resources we instead ask the
 * backend (GET /api/upload/presign, authenticated via cpa_token cookie)
 * for a short-lived S3 PUT URL and upload the file bytes directly to S3.
 *
 * Backend contract (Code-Plus-Academy/Back-end backend/routes/upload.js):
 *   GET /api/upload/presign?filename=...&type=<mime>&folder=media&size=<bytes>
 *   -> { uploadUrl, cdnUrl, key }
 *
 * Returns { url, key } where `url` is the permanent CDN URL to store in the
 * notes file_url field.
 */
export async function uploadFileToS3Direct({ file, folder = 'media' }) {
  if (!file) throw new Error('NO_FILE: no file provided');

  const contentType = (file.type || 'application/octet-stream').trim();
  const size = file.size;

  if (!Number.isFinite(size) || size <= 0) {
    throw new Error('FILE_TOO_LARGE_OR_EMPTY: file is empty');
  }

  const params = new URLSearchParams({
    filename: file.name || 'upload',
    type: contentType,
    folder,
    size: String(size),
  });

  // The backend sits behind the same /api origin; the Next rewrite in
  // next.config.mjs forwards /api/* to the production API. Credentials
  // are required: the route is protected by authMiddleware (cpa_token
  // cookie or Authorization: Bearer).
  const presignRes = await fetch(`/api/upload/presign?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(typeof window !== 'undefined' && window.localStorage?.getItem('cpa_access_token')
        ? { Authorization: `Bearer ${window.localStorage.getItem('cpa_access_token')}` }
        : {}),
    },
  });

  if (!presignRes.ok) {
    let message = `Upload service unavailable (status ${presignRes.status}).`;
    try {
      const errJson = await presignRes.json();
      message = errJson.error || errJson.message || message;
    } catch (_) {
      // non-JSON body; keep the default message
    }
    throw new Error(message);
  }

  const { uploadUrl, cdnUrl, key } = await presignRes.json();
  if (!uploadUrl || !cdnUrl) {
    throw new Error('Upload service returned an invalid response. Please try again.');
  }

  // PUT the raw bytes straight to S3. No cookies/credentials: the presigned
  // URL itself authorizes the write.
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error(`Storage rejected the upload (status ${putRes.status}). Please try again.`);
  }

  return { url: cdnUrl, key };
}