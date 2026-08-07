export interface UserAuthor {
  name: string;
  handle: string;
  avatar: string;
  role?: string;
  verified?: boolean;
}

export interface DeveloperProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  primaryStack: string[];
  openToWork: boolean;
  isHiring: boolean;
  location: string;
  activityStats: {
    publishedNotes: number;
    articlesCount: number;
    projectsBuilt: number;
    reputation: number;
  };
  activityDerivedSkills: string[];
  isFollowing?: boolean;
}
