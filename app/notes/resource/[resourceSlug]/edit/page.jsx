import React from 'react';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { queryTable, getSocialUsers } from '../../../../../src/lib/supabaseContent';
import { fetchApi, getCurrentUser } from '../../../../../src/utils/notesApi';
import UploadForm from '../../../../../src/components/notes/UploadForm';
import { updateNoteAction } from '../../../actions';
import DeleteButton from './DeleteButton';

export const metadata = {
  title: 'Edit Study Material | Notes Arena',
  description: 'Manage and update your uploaded study resources on Notes Arena.',
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = 'force-dynamic';

async function getNoteData(slug) {
  if (!slug) return null;
  const decodedSlug = decodeURIComponent(slug).trim();

  // 1. Query Supabase notes table by slug or id
  try {
    let notes = await queryTable('notes', '*', {
      slug: `ilike.${decodedSlug}`,
      limit: '1',
    }).catch(() => []);

    if (!notes || notes.length === 0) {
      notes = await queryTable('notes', '*', {
        id: `eq.${decodedSlug}`,
        limit: '1',
      }).catch(() => []);
    }

    if (notes && notes.length > 0) {
      const n = notes[0];
      let uploaderObj = n.uploader || null;
      if (!uploaderObj && n.uploader_id) {
        const uMap = await getSocialUsers([n.uploader_id]).catch(() => ({}));
        uploaderObj = uMap[n.uploader_id] || null;
      }
      return {
        ...n,
        uploader: uploaderObj || { id: n.uploader_id || null },
      };
    }
  } catch (err) {
    console.error(`Error querying Supabase for note ${decodedSlug}:`, err);
  }

  // 2. Fallback to API backend
  try {
    const res = await fetchApi(`/notes/resources/${decodedSlug}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error(`Error loading note ${decodedSlug} from API backend:`, err);
  }
  return null;
}

export default async function EditPage({ params }) {
  const { resourceSlug } = await params;
  const note = await getNoteData(resourceSlug);

  if (!note) {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/notes/resource/${resourceSlug}/edit`);
  }

  const targetOwnerId = note.uploader_id || note.uploader?.id;
  const targetCreatorUsername = note.uploader_username || note.uploader?.username;

  const isOwner = Boolean(
    user && (
      (user.id && targetOwnerId && String(user.id).trim() === String(targetOwnerId).trim()) ||
      (user.user_id && targetOwnerId && String(user.user_id).trim() === String(targetOwnerId).trim()) ||
      (user.username && targetCreatorUsername && String(user.username).trim().toLowerCase() === String(targetCreatorUsername).trim().toLowerCase())
    )
  );
  const isAdmin = Boolean(user && user.role === 'admin');
  const canEdit = Boolean(isOwner || isAdmin);

  if (!canEdit) {
    redirect(`/notes/resource/${resourceSlug}`);
  }

  // Bind note.id to the update action
  const boundUpdateAction = updateNoteAction.bind(null, note.id);

  return (
    <>
      <style>{`
        .upload-container {
          max-width: 600px;
          margin: 0 auto;
          background: var(--surface);
          border: 1px solid var(--border-bright);
          border-radius: var(--r-lg);
          padding: 32px;
          box-shadow: var(--shadow-modal);
        }
        .upload-header {
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .upload-title {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
        }
        .danger-zone {
          margin-top: 32px;
          padding: 20px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          background: rgba(239, 68, 68, 0.04);
          border-radius: var(--r-md);
        }
      `}</style>

      <div style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 20 }}>
        <Link href="/notes">Notes</Link>
        <span>/</span>
        <Link href={`/notes/resource/${note.slug}`}>{note.title}</Link>
        <span>/</span>
        <span style={{ color: 'var(--green)' }}>Edit</span>
      </div>

      <div className="upload-container">
        <header className="upload-header">
          <div>
            <h1 className="upload-title">Edit Study Material</h1>
            <p style={{ color: 'var(--sub)', fontSize: 14 }}>
              Update details or file classification for your contributed study resource.
            </p>
          </div>
        </header>

        <UploadForm action={boundUpdateAction} initialNote={note} />

        <div className="danger-zone">
          <h3 style={{ color: '#ef4444', fontSize: 15, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-display)' }}>Danger Zone</h3>
          <p style={{ color: 'var(--sub)', fontSize: 13, marginBottom: 16, lineHeight: 1.4 }}>
            Once you delete this resource, it will be permanently removed from Notes Arena. This action cannot be undone.
          </p>
          <DeleteButton noteId={note.id} />
        </div>
      </div>
    </>
  );
}
