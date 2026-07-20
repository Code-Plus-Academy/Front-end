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
  const copyrightConsent = formData.get('copyright_consent') === 'true';
  
  // Classification fields
  const collegeId = formData.get('collegeId');
  const courseId = formData.get('courseId');
  const semester = formData.get('semester');
  const subjectId = formData.get('subjectId');
  const fieldId = formData.get('fieldId');
  const topicId = formData.get('topicId');
  const customSubjectName = formData.get('customSubjectName');
  const customTopicName = formData.get('customTopicName');

  // Manual Validation
  if (!title || title.trim().length < 3) return { error: 'Title must be at least 3 characters.' };
  if (!type) return { error: 'Please select a resource type.' };
  if (!fileUrl) return { error: 'Please upload a file or provide a valid link.' };
  if (!copyrightConsent) return { error: 'Copyright compliance declaration is required.' };

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
    subject_id: pathType !== 'department' ? (subjectId !== 'other' ? (subjectId || null) : null) : null,
    field_id: pathType !== 'college' ? (fieldId || null) : null,
    topic_id: pathType !== 'college' ? (topicId !== 'other' ? (topicId || null) : null) : null,
    custom_subject_name: customSubjectName || null,
    custom_topic_name: customTopicName || null,
    copyright_consent: copyrightConsent
  };

  try {
    const res = await fetchApi('/notes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const resData = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: resData.message || resData.error || 'Failed to submit resource to server.'
      };
    }

    // Trigger on-demand revalidation
    revalidatePath('/notes');
    if (payload.college_id && formData.get('collegeSlug')) {
      revalidatePath(`/notes/colleges/${formData.get('collegeSlug')}`);
    }

    const createdSlug = resData.note?.slug || resData.slug;
    const createdId = resData.note?.id || resData.id || '';

    if (!createdSlug) {
      return {
        success: false,
        error: 'Resource created, but no valid slug was returned from backend server.'
      };
    }

    return {
      success: true,
      data: {
        noteId: String(createdId),
        slug: createdSlug,
      }
    };
  } catch (err) {
    console.error('Error in createNote Server Action:', err);
    return {
      success: false,
      error: err.message || 'Server action execution failed. Please try again.'
    };
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

export async function updateNoteAction(noteId, formData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in to update notes.' };
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
  const customSubjectName = formData.get('customSubjectName');
  const customTopicName = formData.get('customTopicName');

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
    subject_id: pathType !== 'department' ? (subjectId !== 'other' ? (subjectId || null) : null) : null,
    field_id: pathType !== 'college' ? (fieldId || null) : null,
    topic_id: pathType !== 'college' ? (topicId !== 'other' ? (topicId || null) : null) : null,
    custom_subject_name: customSubjectName || null,
    custom_topic_name: customTopicName || null,
  };

  try {
    const res = await fetchApi(`/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    const resData = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: resData.message || resData.error || 'Failed to update resource on server.'
      };
    }

    // Trigger on-demand revalidation
    revalidatePath('/notes');
    revalidatePath(`/notes/resource/${resData.note?.slug || resData.slug}`);
    
    return {
      success: true,
      data: {
        noteId: String(resData.note?.id || resData.id || noteId),
        slug: resData.note?.slug || resData.slug,
      }
    };
  } catch (err) {
    console.error('Error in updateNoteAction:', err);
    return {
      success: false,
      error: err.message || 'Server action execution failed. Please try again.'
    };
  }
}

export async function deleteNoteAction(noteId) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in to delete notes.' };
  }

  try {
    const res = await fetchApi(`/notes/${noteId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const resData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: resData.message || resData.error || 'Failed to delete resource from server.'
      };
    }

    revalidatePath('/notes');
    return { success: true };
  } catch (err) {
    console.error('Error in deleteNoteAction:', err);
    return {
      success: false,
      error: err.message || 'Server action execution failed. Please try again.'
    };
  }
}
