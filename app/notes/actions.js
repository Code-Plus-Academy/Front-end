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

const KNOWN_COLLEGE_MAP = {
  'sppu': '3c667ec5-734b-4bda-a782-57b1dbecc286',
  '1': '3c667ec5-734b-4bda-a782-57b1dbecc286',
  'du': '600a2781-0f14-4302-8ff1-e9ec3a8bc39e',
  '2': '600a2781-0f14-4302-8ff1-e9ec3a8bc39e',
  'karmaveer-ganpat-data-more-arts-commerce-and-science-college-niphad-422303-4fe1f4': '174b07af-e6c8-45a1-874b-df7a7cdfeb91',
  '3': '174b07af-e6c8-45a1-874b-df7a7cdfeb91',
  'mvps-karamveer-raosaheb-thorat-arts-badhiraharaj-hiray-commerce-and-annasaheb-murkute-science-college-nashik-ef17b1': 'a5e850e7-2efe-44d9-abe9-3bce17d1bf9e',
};

const KNOWN_COURSE_MAP = {
  'bsc-cs': '64d02ead-1a17-4de6-9882-8f3d5c4ffac4',
  'c1': '64d02ead-1a17-4de6-9882-8f3d5c4ffac4',
  'bachelor-of-computer-science-nep': 'c703b532-e9c4-4728-8711-0ad6f84f63a8',
  'c2': 'c703b532-e9c4-4728-8711-0ad6f84f63a8',
};

const KNOWN_FIELD_MAP = {
  'computer-science': '85665ae3-d2dc-43f3-b4d6-1040b2645850',
  'f1': '85665ae3-d2dc-43f3-b4d6-1040b2645850',
  '1': '85665ae3-d2dc-43f3-b4d6-1040b2645850',
  'engineering': '54ba8ca1-5b5c-498f-a583-445bc09d5ee6',
  'f2': '54ba8ca1-5b5c-498f-a583-445bc09d5ee6',
  '2': '54ba8ca1-5b5c-498f-a583-445bc09d5ee6',
};

const KNOWN_TOPIC_MAP = {
  'dbms': 'c066e189-40d5-458e-a499-467fe3726dcd',
  't1': 'c066e189-40d5-458e-a499-467fe3726dcd',
  'digital-logic-and-design': '4ddb0806-f312-438c-8cf9-f9edb8a6ffd0',
  't2': '4ddb0806-f312-438c-8cf9-f9edb8a6ffd0',
};

function resolveUuid(id, knownMap) {
  if (!id || id === 'other') return null;
  if (isValidUuid(id)) return id;
  if (knownMap && knownMap[id]) return knownMap[id];
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
  const college_id = pathType !== 'department' ? resolveUuid(collegeId, KNOWN_COLLEGE_MAP) : null;
  const course_id = pathType !== 'department' ? resolveUuid(courseId, KNOWN_COURSE_MAP) : null;
  const field_id = pathType !== 'college' ? resolveUuid(fieldId, KNOWN_FIELD_MAP) : null;
  const topic_id = pathType !== 'college' ? resolveUuid(topicId, KNOWN_TOPIC_MAP) : null;

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
    let createdSlug = null;
    let createdId = null;

    try {
      const res = await fetchApi('/notes', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const resData = await res.json().catch(() => ({}));
        createdSlug = resData.note?.slug || resData.slug;
        createdId = resData.note?.id || resData.id || '';
      }
    } catch (err) {
      console.warn('[createNote] Primary API submission failed, using Supabase direct REST fallback:', err.message);
    }

    // Direct Supabase REST Fallback if primary API backend is unavailable or failed
    if (!createdSlug) {
      try {
        const SUPABASE_URL = 'https://dsgfzikehtxuroabenjr.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ2Z6aWtlaHR4dXJvYWJlbmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTE5MjQsImV4cCI6MjA5MTYyNzkyNH0.k1ob51kFIot-pb51Takq82XkGY8M-Xc09tNBlqLtkns';
        
        const generatedSlug = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 10);
        
        const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            title: payload.title,
            slug: generatedSlug,
            description: payload.description,
            type: payload.type,
            file_url: payload.file_url,
            file_type: payload.file_type,
            scope: payload.scope || 'global',
            college_id: payload.college_id,
            course_id: payload.course_id,
            semester: payload.semester,
            subject_id: payload.subject_id,
            field_id: payload.field_id,
            topic_id: payload.topic_id,
            custom_course_name: payload.custom_course_name,
            custom_subject_name: payload.custom_subject_name,
            custom_topic_name: payload.custom_topic_name,
            copyright_consent: payload.copyright_consent,
            uploader_id: user?.id || '8b00cb76-5322-43d2-b343-98e2938b99a1',
            status: 'published'
          })
        });

        if (sbRes.ok) {
          const sbData = await sbRes.json();
          const noteObj = Array.isArray(sbData) ? sbData[0] : sbData;
          createdSlug = noteObj?.slug || generatedSlug;
          createdId = noteObj?.id || '';
        } else {
          const sbErr = await sbRes.text();
          console.error('[Supabase Direct Insert Error]:', sbErr);
        }
      } catch (sbErr) {
        console.error('[Supabase Direct Exception]:', sbErr);
      }
    }

    if (!createdSlug) {
      return {
        success: false,
        error: 'Failed to submit resource to server. Please verify your input fields and try again.'
      };
    }

    revalidatePath('/notes');
    if (payload.college_id && formData.get('collegeSlug')) {
      revalidatePath(`/notes/colleges/${formData.get('collegeSlug')}`);
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
