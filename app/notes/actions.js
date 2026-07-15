'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fetchApi, getCurrentUser } from '../../src/utils/notesApi';

export async function createNote(formData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in to upload notes.' };
  }

  const title = formData.get('title');
  const description = formData.get('description');
  const type = formData.get('type');
  const fileUrl = formData.get('fileUrl');
  const fileType = formData.get('fileType');
  const pathType = formData.get('pathType'); // 'college' or 'department'
  
  // Classification fields
  const collegeId = formData.get('collegeId');
  const courseId = formData.get('courseId');
  const semester = formData.get('semester');
  const subjectId = formData.get('subjectId');
  const fieldId = formData.get('fieldId');
  const topicId = formData.get('topicId');

  // Manual Validation
  if (!title || title.trim().length < 3) return { error: 'Title must be at least 3 characters.' };
  if (!type) return { error: 'Please select a resource type.' };
  if (!fileUrl) return { error: 'Please upload a file or provide a valid link.' };

  const payload = {
    title: title.trim(),
    description: description?.trim() || '',
    type,
    file_url: fileUrl,
    file_type: fileType || 'pdf',
    scope: pathType === 'both' ? 'both' : (pathType === 'college' ? 'college' : 'global'),
    college_id: pathType !== 'department' ? (collegeId || null) : null,
    course_id: pathType !== 'department' ? (courseId || null) : null,
    semester: pathType !== 'department' ? (semester ? parseInt(semester, 10) : null) : null,
    subject_id: pathType !== 'department' ? (subjectId || null) : null,
    field_id: pathType !== 'college' ? (fieldId || null) : null,
    topic_id: pathType !== 'college' ? (topicId || null) : null,
  };

  try {
    const res = await fetchApi('/notes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json();
      return { error: errData.message || 'Failed to submit resource.' };
    }

    const resData = await res.json();
    
    // Trigger on-demand revalidation
    revalidatePath('/notes');
    if (payload.college_id) {
      revalidatePath(`/notes/colleges/${formData.get('collegeSlug')}`);
    }

    return { success: true, slug: resData.note?.slug };
  } catch (err) {
    console.error('Error in createNote Server Action:', err);
    return { error: 'Something went wrong. Please try again.' };
  }
}

export async function requestNewCollege(formData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in to submit this request.' };
  }

  const name = formData.get('name');
  const university = formData.get('university');
  const location = formData.get('location');

  if (!name || name.trim().length < 3) return { error: 'College name is too short.' };
  if (!location) return { error: 'Location is required.' };

  const payload = {
    name: name.trim(),
    university: university?.trim() || '',
    location: location.trim(),
  };

  try {
    const res = await fetchApi('/notes/colleges/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json();
      return { error: errData.message || 'Failed to submit college request.' };
    }

    revalidatePath('/notes/colleges');
    return { success: true };
  } catch (err) {
    console.error('Error in requestNewCollege Server Action:', err);
    return { error: 'Something went wrong. Please try again.' };
  }
}
