export * from './models';

// Legacy compatibility types mapping to models
import { 
  TabType as ModelTabType, 
  PostType as ModelPostType, 
  DifficultyLevel as ModelDifficultyLevel, 
  SocialPost as ModelSocialPost,
  DeveloperProfile as ModelDeveloperProfile,
  ArticleType as ModelArticleType,
  ArticleTypeInfo as ModelArticleTypeInfo,
  ArticleItem as ModelArticleItem,
  AcademicResourceType as ModelAcademicResourceType,
  FileFormatType as ModelFileFormatType,
  OrganizationalScope as ModelOrganizationalScope,
  AcademicNoteItem as ModelAcademicNoteItem,
  ExploreVideo as ModelExploreVideo,
  ThemeMode as ModelThemeMode
} from './models';

export type TabType = ModelTabType;
export type ThemeMode = ModelThemeMode;
