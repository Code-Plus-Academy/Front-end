import { UserAuthor } from './user';

export type VideoCategory = 'tech_breakdown' | 'podcast' | 'coding_livestream' | 'conference_talk' | 'system_design' | 'Web Dev' | 'Shorts' | 'AI & ML' | string;

export interface ExploreVideo {
  id: string;
  title: string;
  channel?: string;
  creator?: UserAuthor;
  views: string | number;
  duration: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  isShort?: boolean;
  category: VideoCategory;
  tags?: string[];
  uploadedAt?: string;
}
