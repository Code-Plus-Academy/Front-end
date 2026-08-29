import { redirect, notFound } from 'next/navigation';
import { getNoteData } from '../resource/[resourceSlug]/page';

// Incremental Static Regeneration (1-hour edge cache with on-demand revalidation)
export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { noteId } = await params;
  const note = await getNoteData(noteId);

  if (!note) {
    return {
      title: 'Resource Not Found | Notes Arena',
    };
  }

  const title = `${note.title} | Notes Arena`;
  const description = note.description || `Download ${note.title} study notes and resources on Notes Arena.`;
  const canonicalUrl = `https://www.codeplusacademy.in/notes/resource/${note.slug || note.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Notes Arena by CPA',
    },
  };
}

export default async function NoteRedirectPage({ params }) {
  const { noteId } = await params;
  const note = await getNoteData(noteId);

  if (!note) {
    notFound();
  }

  const targetSlug = note.slug || note.id;
  redirect(`/notes/resource/${targetSlug}`);
}
