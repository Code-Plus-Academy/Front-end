import { UserAuthor } from './user';
import { DifficultyLevel } from './post';

export type ArticleType = 
  | 'article'
  | 'deep-dive'
  | 'deep_dive'
  | 'doc'
  | 'compare'
  | 'course'
  | 'learning'
  | 'project'
  | 'repo'
  | 'resource'
  | 'toolkit'
  | 'playground'
  | 'system_architecture'
  | 'tutorial'
  | 'post_mortem'
  | 'benchmarks'
  | 'opinion_manifesto'
  | 'case_study'
  | 'roadmap'
  | 'cheatsheet'
  | 'research_summary'
  | 'weekly_newsletter';

export type ArticleTypeCategory = 
  | 'standard' 
  | 'learning' 
  | 'projects' 
  | 'resources'
  | 'Engineering' 
  | 'Architecture' 
  | 'Tutorials' 
  | 'Career & Culture' 
  | 'Research';

export interface ArticleTypeInfo {
  id: ArticleType;
  title: string;
  category: ArticleTypeCategory;
  categoryLabel?: string;
  description: string;
  iconName: string;
  exampleTitle?: string;
  badgeColor?: string;
}

export interface ArticleItem {
  id: string;
  type: ArticleType;
  title: string;
  categoryLabel?: string;
  author: UserAuthor;
  readTime: string;
  viewCount?: number;
  clapCount?: number;
  upvotes?: number;
  commentsCount?: number;
  coverImage?: string;
  inlineImage?: string;
  gradientBg?: string;
  isQuickRead?: boolean;
  hasPlayground?: boolean;
  publishedAt: string;
  tags: string[];
  snippet?: string;
  summary?: string;
  difficulty?: DifficultyLevel;
  featured?: boolean;
  contentMarkdown?: string;
}
