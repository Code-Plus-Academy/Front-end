/**
 * Supabase client for the CPA Content DB (notes, colleges, courses, subjects, fields, topics)
 * Uses the anon key — all queries go through Supabase RPC / REST with RLS enforced.
 * This file is safe to import in both Server Components and API Route Handlers.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_CONTENT_URL || 'https://dsgfzikehtxuroabenjr.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_CONTENT_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ2Z6aWtlaHR4dXJvYWJlbmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTE5MjQsImV4cCI6MjA5MTYyNzkyNH0.k1ob51kFIot-pb51Takq82XkGY8M-Xc09tNBlqLtkns';

const BASE_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
};

/**
 * Call a Supabase Postgres RPC function.
 * @param {string} fn  - Function name
 * @param {object} args - JSON-serialisable argument object
 * @returns {Promise<Array>} rows — throws on HTTP error
 */
export async function rpc(fn, args = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: BASE_HEADERS,
    body: JSON.stringify(args),
    cache: 'no-store',
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Supabase RPC ${fn} failed (${res.status}): ${errText}`);
  }
  return res.json();
}

/**
 * REST query against a Supabase table.
 * @param {string} table   - Table name
 * @param {string} select  - PostgREST select string, default '*'
 * @param {object} filters - PostgREST filter params as key/value pairs
 */
export async function queryTable(table, select = '*', filters = {}) {
  const params = new URLSearchParams({ select, ...filters });
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: BASE_HEADERS,
    cache: 'no-store',
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Supabase REST ${table} failed (${res.status}): ${errText}`);
  }
  return res.json();
}

// ─── Taxonomy helpers ─────────────────────────────────────────────────────────

/** Search colleges (trigram ILIKE on name/university/slug) */
export async function searchColleges(q = '') {
  return rpc('search_colleges', { q });
}

/** Get all courses for a college UUID */
export async function getCollegeCourses(collegeId) {
  return rpc('get_college_courses', { p_college_id: collegeId });
}

/** Get subjects for a course UUID, optionally filtered by semester */
export async function getCourseSubjects(courseId, semester = null, q = '') {
  return rpc('get_course_subjects', {
    p_course_id: courseId,
    p_semester: semester,
    q,
  });
}

/** Get all department fields */
export async function getNotesFields(q = '') {
  return rpc('get_notes_fields', { q });
}

/** Get topics for a field UUID */
export async function getFieldTopics(fieldId, q = '') {
  return rpc('get_field_topics', { p_field_id: fieldId, q });
}

/** Resolve a college slug → full college row (with courses) */
export async function getCollegeBySlug(rawSlug) {
  if (!rawSlug) return null;
  const decodedSlug = decodeURIComponent(rawSlug).trim();

  // 1. Try exact case-insensitive match on slug
  let rows = await queryTable('colleges', 'id,name,slug,university,location,verified,logo_url', {
    slug: `ilike.${decodedSlug}`,
    limit: '1',
  }).catch(() => []);

  // 2. Fallback search via searchColleges RPC if exact slug string differs slightly
  if (!rows || rows.length === 0) {
    const searchResults = await searchColleges(decodedSlug).catch(() => []);
    if (searchResults && searchResults.length > 0) {
      const match = searchResults.find(
        c => c.slug?.toLowerCase() === decodedSlug.toLowerCase() ||
             decodedSlug.toLowerCase().startsWith(c.slug?.toLowerCase()) ||
             c.slug?.toLowerCase().startsWith(decodedSlug.toLowerCase())
      ) || searchResults[0];
      rows = [match];
    }
  }

  if (!rows || rows.length === 0) return null;
  const college = rows[0];

  // Attach courses
  college.courses = await getCollegeCourses(college.id).catch(() => []);
  return college;
}

/** Resolve college slug + course slug → { college, course } */
export async function getCollegeCourse(collegeSlug, courseSlug) {
  const college = await getCollegeBySlug(collegeSlug);
  if (!college) return null;

  const decodedCourseSlug = decodeURIComponent(courseSlug).trim().toLowerCase();
  const course = (college.courses || []).find(
    c => c.slug?.toLowerCase() === decodedCourseSlug || c.slug?.toLowerCase().startsWith(decodedCourseSlug)
  );

  if (!course) return null;
  return { college, course };
}
