import { NextResponse } from 'next/server';
import { fetchApi } from '../../../../../src/utils/notesApi';
import { SPPU_BSC_CS_NEP_SUBJECTS } from '../../../../../src/data/sppuSyllabus';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId') || '';
  const semester = searchParams.get('semester') || '';
  const semNum = parseInt(String(semester).replace(/[^0-9]/g, ''), 10) || 1;

  try {
    const res = await fetchApi(`/notes/courses/${courseId}/semesters/${semNum}/subjects`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.subjects && data.subjects.length > 0) {
        return NextResponse.json({ subjects: data.subjects });
      }
    }
  } catch (err) {
    console.error('Error fetching subjects autosuggest from backend:', err);
  }

  // Fallback: Synchronized SPPU NEP 2024-2025 subjects for the selected semester
  const fallbackSubjects = SPPU_BSC_CS_NEP_SUBJECTS[semNum] || SPPU_BSC_CS_NEP_SUBJECTS[1];
  return NextResponse.json({ subjects: fallbackSubjects });
}
