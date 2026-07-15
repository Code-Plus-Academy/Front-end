export type NoteType =
  | 'question_paper'
  | 'notes'
  | 'book'
  | 'assignment'
  | 'cheatsheet'
  | 'video_link'
  | 'project_report'
  | 'lab_manual'
  | 'roadmap'
  | 'other';

export type NoteScope = 'college' | 'global' | 'both';

export type NoteStatus = 'pending' | 'approved' | 'rejected';

export interface NoteField {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface NoteTopic {
  id: string;
  name: string;
  slug: string;
  field_id: string;
  parent_topic_id?: string | null;
  created_at: string;
}

export interface NoteCollege {
  id: string;
  name: string;
  slug: string;
  university?: string | null;
  location?: string | null;
  logo_url?: string | null;
  verified: boolean;
  created_at: string;
}

export interface NoteCourse {
  id: string;
  name: string;
  slug: string;
  college_id: string;
  field_id?: string | null;
  duration_years?: number | null;
  created_at: string;
}

export interface NoteSubject {
  id: string;
  name: string;
  slug: string;
  course_id: string;
  topic_id?: string | null;
  semester: number;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  type: NoteType;
  subject_id?: string | null;
  topic_id?: string | null;
  college_id?: string | null;
  uploaded_by: string;
  scope: NoteScope;
  status: NoteStatus;
  downloads: number;
  views: number;
  upvote_count: number;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  uploader_name?: string;
  uploader_username?: string;
  uploader_avatar_url?: string;
  college_name?: string;
  course_name?: string;
  subject_name?: string;
  topic_name?: string;
  field_name?: string;
  is_upvoted?: boolean;
  is_bookmarked?: boolean;
}
