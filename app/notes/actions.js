'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fetchApi, getCurrentUser } from '../../src/utils/notesApi';

const isValidUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

async function resolveSubjectUuid(subjectId, courseId, semester) {
  if (!subjectId || subjectId === 'other') return null;
  if (isValidUuid(subjectId)) return subjectId;

  // Search local SPPU NEP syllabus data first for instant matching UUID
  try {
    const semNum = parseInt(String(semester).replace(/[^0-9]/g, ''), 10) || 1;
    const { SPPU_BSC_CS_NEP_SUBJECTS } = await import('../../src/data/sppuSyllabus');
    const semSubjects = SPPU_BSC_CS_NEP_SUBJECTS[semNum] || [];
    const localMatch = semSubjects.find(s => 
      s.code === subjectId || 
      s.slug === subjectId || 
      s.id === subjectId
    );
    if (localMatch && isValidUuid(localMatch.id)) {
      return localMatch.id;
    }
  } catch (err) {
    console.warn('[UUID Resolver] Local syllabus lookup failed:', err.message);
  }

  // Fallback: Attempt to resolve subject UUID from live DB API by slug / code
  try {
    const semNum = parseInt(String(semester).replace(/[^0-9]/g, ''), 10) || 1;
    const targetCourse = courseId || 'bachelor-of-computer-science-nep';
    const res = await fetchApi(`/notes/courses/${targetCourse}/semesters/${semNum}/subjects`);
    if (res.ok) {
      const data = await res.json();
      const list = data.subjects || [];
      const match = list.find(s => 
        (s.id && isValidUuid(s.id)) ||
        (s.slug && s.slug === subjectId) ||
        (s.code && s.code.toLowerCase() === subjectId.toLowerCase())
      );
      if (match && isValidUuid(match.id)) {
        return match.id;
      }
    }
  } catch (err) {
    console.warn('[UUID Resolver] Live API subject UUID lookup failed:', err.message);
  }

  return null;
}

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
  const customCourseName = formData.get('customCourseName');
  const customSubjectName = formData.get('customSubjectName');
  const customTopicName = formData.get('customTopicName');

  // Manual Validation
  if (!title || title.trim().length < 3) return { error: 'Title must be at least 3 characters.' };
  if (!type) return { error: 'Please select a resource type.' };
  if (!fileUrl) return { error: 'Please upload a file or provide a valid link.' };
  if (!copyrightConsent) return { error: 'Copyright compliance declaration is required.' };

  // Sanitize UUID fields so non-UUID strings NEVER reach PostgreSQL UUID columns
  const college_id = (pathType !== 'department' && isValidUuid(collegeId)) ? collegeId : null;
  const course_id = (pathType !== 'department' && isValidUuid(courseId)) ? courseId : null;
  const field_id = (pathType !== 'college' && isValidUuid(fieldId)) ? fieldId : null;
  const topic_id = (pathType !== 'college' && isValidUuid(topicId)) ? topicId : null;

  let subject_id = null;
  let finalCustomSubjectName = customSubjectName || null;

  if (pathType !== 'department' && subjectId && subjectId !== 'other') {
    if (isValidUuid(subjectId)) {
      subject_id = subjectId;
    } else {
      // Resolve string code/slug (e.g. 'cs-241-mn-t') to valid PostgreSQL UUID
      const resolvedUuid = await resolveSubjectUuid(subjectId, courseId, semester);
      if (resolvedUuid) {
        subject_id = resolvedUuid;
      } else {
        // Fallback: If no UUID exists, set subject_id to NULL and populate custom_subject_name
        // This guarantees NO PostgreSQL 500 UUID syntax error occurs!
        subject_id = null;
        if (!finalCustomSubjectName) {
          finalCustomSubjectName = subjectId;
        }
      }
    }
  }

  const payload = {
    title: title.trim(),
    description: description?.trim() || '',
    type,
    file_url: fileUrl,
    file_type: fileType || 'pdf',
    scope: pathType === 'both' ? 'both' : (pathType === 'college' ? 'college' : 'global'),
    college_id,
    course_id,
    semester: pathType !== 'department' ? (semester ? parseInt(semester, 10) : null) : null,
    subject_id,
    field_id,
    topic_id,
    custom_course_name: customCourseName || null,
    custom_subject_name: finalCustomSubjectName,
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
  const website = formData.get('website');
  const phone = formData.get('phone');
  const email = formData.get('email');
  const address = formData.get('address');
  const description = formData.get('description');

  if (!name || name.trim().length < 3) return { error: 'College name is too short.' };
  if (!location) return { error: 'Location is required.' };

  const payload = {
    name: name.trim(),
    university: university?.trim() || '',
    location: location.trim(),
    website: website?.trim() || '',
    phone: phone?.trim() || '',
    email: email?.trim() || '',
    address: address?.trim() || '',
    description: description?.trim() || '',
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
  const customCourseName = formData.get('customCourseName');
  const customSubjectName = formData.get('customSubjectName');
  const customTopicName = formData.get('customTopicName');

  // Manual Validation
  if (!title || title.trim().length < 3) return { error: 'Title must be at least 3 characters.' };
  if (!type) return { error: 'Please select a resource type.' };
  if (!fileUrl) return { error: 'Please upload a file or provide a valid link.' };

  // Sanitize UUID fields so non-UUID strings NEVER reach PostgreSQL UUID columns
  const college_id = (pathType !== 'department' && isValidUuid(collegeId)) ? collegeId : null;
  const course_id = (pathType !== 'department' && isValidUuid(courseId)) ? courseId : null;
  const field_id = (pathType !== 'college' && isValidUuid(fieldId)) ? fieldId : null;
  const topic_id = (pathType !== 'college' && isValidUuid(topicId)) ? topicId : null;

  let subject_id = null;
  let finalCustomSubjectName = customSubjectName || null;

  if (pathType !== 'department' && subjectId && subjectId !== 'other') {
    if (isValidUuid(subjectId)) {
      subject_id = subjectId;
    } else {
      const resolvedUuid = await resolveSubjectUuid(subjectId, courseId, semester);
      if (resolvedUuid) {
        subject_id = resolvedUuid;
      } else {
        subject_id = null;
        if (!finalCustomSubjectName) {
          finalCustomSubjectName = subjectId;
        }
      }
    }
  }

  const payload = {
    title: title.trim(),
    description: description?.trim() || '',
    type,
    file_url: fileUrl,
    file_type: fileType || 'pdf',
    scope: pathType === 'both' ? 'both' : (pathType === 'college' ? 'college' : 'global'),
    college_id,
    course_id,
    semester: pathType !== 'department' ? (semester ? parseInt(semester, 10) : null) : null,
    subject_id,
    field_id,
    topic_id,
    custom_course_name: customCourseName || null,
    custom_subject_name: finalCustomSubjectName,
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
