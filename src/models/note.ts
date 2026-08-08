import { UserAuthor } from './user';
import { DifficultyLevel } from './post';

export type AcademicResourceType = 
  | 'notes' 
  | 'question_paper' 
  | 'book' 
  | 'assignment' 
  | 'cheatsheet' 
  | 'lab_manual' 
  | 'roadmap' 
  | 'other'
  | 'lecture_notes'
  | 'handwritten_notes'
  | 'pyq_solutions'
  | 'syllabus_guide'
  | 'textbook_summary'
  | 'formula_sheet'
  | 'viva_questions';

export type FileFormatType = 'pdf' | 'image' | 'link' | 'markdown' | 'image_scans' | 'interactive_notebook';
export type OrganizationalScope = 'college' | 'department' | 'Global' | 'College-Wide' | 'Department' | 'Course-Specific';

export interface AcademicNoteItem {
  id: string;
  title: string;
  resourceType?: AcademicResourceType;
  resourceTypeLabel?: string;
  type?: AcademicResourceType;
  fileFormat: FileFormatType;
  scope: OrganizationalScope;
  institution?: string;
  collegeName?: string;
  course?: string;
  courseName?: string;
  courseCode?: string;
  semester?: string;
  subject?: string;
  department?: string;
  field?: string;
  topic?: string;
  contributor?: {
    name: string;
    role: string;
    avatar: string;
  };
  author?: UserAuthor;
  downloadsCount: number;
  rating?: number;
  upvotesCount?: number;
  isVerifiedPR?: boolean;
  verifiedByFaculty?: boolean;
  fileSize?: string;
  uploadedAt?: string;
  previewPagesCount?: number;
  difficulty?: DifficultyLevel;
  slug?: string;
  fileUrl?: string;
}
