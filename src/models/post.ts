import { UserAuthor } from './user';

export type PostType = 
  | 'general' 
  | 'project' 
  | 'snippet' 
  | 'achievement' 
  | 'question' 
  | 'article' 
  | 'note'
  | 'discussion'
  | 'project_update'
  | 'announcement';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface SocialPost {
  id: string;
  type: PostType;
  author: UserAuthor;
  content: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
  difficulty?: DifficultyLevel;
  languageTags?: string[];
  tags?: string[];
  upvotes: number;
  likes?: number;
  commentsCount: number;
  comments?: number;
  shares?: number;
  timeAgo: string;
  timestamp?: string;
  isUpvoted?: boolean;
  isLiked?: boolean;
  projectUrl?: string;
  githubUrl?: string;
}

export interface CommunityStory {
  id: string;
  authorName: string;
  avatar: string;
  hasUnseen: boolean;
  title: string;
  mediaType?: 'image' | 'code' | 'milestone';
  previewUrl?: string;
  updatedAt?: string;
}

export type Story = CommunityStory;
