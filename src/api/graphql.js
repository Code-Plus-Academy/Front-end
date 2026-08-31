'use client';
/**
 * Frontend GraphQL Client & Feed Operations — Code Plus Academy
 *
 * Lightweight typed GraphQL client built on top of the existing Axios instance (`src/api/axios.js`).
 * - Reuses existing cookie-based session authentication (`withCredentials: true`)
 * - Reuses Authorization Bearer token header interceptor
 * - Reuses 401 automatic token refresh queue (`/auth/refresh`)
 * - Reuses base URL configuration
 * - Zero external client bundle overhead (no Apollo Client library required)
 */

import api from './axios';

/**
 * Check if GraphQL is globally enabled via environment variable
 * Defaults to true. Set NEXT_PUBLIC_ENABLE_GRAPHQL=false to rollback to REST instantly.
 */
export function isGraphQLEnabled() {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NEXT_PUBLIC_ENABLE_GRAPHQL === 'false' || process.env.NEXT_PUBLIC_ENABLE_GRAPHQL === '0') {
      return false;
    }
  }
  return true;
}

/**
 * Core GraphQL fetch function
 * @param {string} query GraphQL document string
 * @param {object} variables Query variables
 * @returns {Promise<any>} data payload
 */
export async function fetchGraphQL(query, variables = {}) {
  if (!isGraphQLEnabled()) {
    const disabledErr = new Error('GraphQL is disabled via NEXT_PUBLIC_ENABLE_GRAPHQL');
    disabledErr.code = 'GRAPHQL_DISABLED';
    throw disabledErr;
  }

  const res = await api.post('/graphql', { query, variables });
  if (res.data?.errors && res.data.errors.length > 0) {
    const primaryError = res.data.errors[0];
    const err = new Error(primaryError.message || 'GraphQL Operation Failed');
    err.extensions = primaryError.extensions || {};
    err.errors = res.data.errors;
    err.code = primaryError.extensions?.code;
    throw err;
  }
  return res.data?.data;
}

/**
 * Structured GraphQL Fallback Logger
 * Emits sanitized diagnostic telemetry when GraphQL falls back to REST.
 * Never logs credentials, tokens, or PII.
 *
 * @param {object} meta
 * @param {string} meta.feature - e.g., 'Feed', 'Explore', 'Shorts', 'DM'
 * @param {string} meta.operation - e.g., 'getFeed', 'search', 'getShorts', 'getInbox'
 * @param {Error|any} meta.error - Original caught error
 * @param {string} meta.fallbackEndpoint - REST endpoint used as fallback (e.g. '/api/posts')
 */
export function logGraphQLFallback({ feature, operation, error, fallbackEndpoint }) {
  let errorCategory = 'UNKNOWN_ERROR';
  const status = error?.response?.status || error?.status;
  const message = error?.message || 'Unknown GraphQL error';

  if (error?.code === 'GRAPHQL_DISABLED' || message.includes('disabled via NEXT_PUBLIC_ENABLE_GRAPHQL')) {
    errorCategory = 'GRAPHQL_DISABLED_FLAG';
  } else if (!error?.response && (error?.code === 'ECONNABORTED' || message.includes('Network Error') || message.includes('fetch'))) {
    errorCategory = 'NETWORK_ERROR';
  } else if (status === 401 || status === 403 || error?.code === 'UNAUTHENTICATED' || error?.code === 'FORBIDDEN') {
    errorCategory = 'AUTH_ERROR';
  } else if (error?.code === 'GRAPHQL_PARSE_FAILED' || error?.code === 'GRAPHQL_VALIDATION_FAILED' || error?.errors?.length > 0) {
    errorCategory = 'GRAPHQL_ERROR';
  } else if (status >= 500) {
    errorCategory = 'SERVER_ERROR';
  } else if (message.includes('Cannot read properties') || message.includes('undefined')) {
    errorCategory = 'SCHEMA_ERROR';
  }


  const payload = {
    timestamp: new Date().toISOString(),
    feature: feature || 'General',
    operation: operation || 'unknown',
    errorCategory,
    status: status || null,
    errorMessage: message.substring(0, 150),
    fallbackEndpoint: fallbackEndpoint || 'REST',
  };

  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[GraphQL Fallback][${payload.feature}][${payload.operation}] → Falling back to ${payload.fallbackEndpoint}`, payload);
  }
  return payload;
}

/* ─────────────────────────────────────────────────────────────────────────────

   NORMALIZERS / ADAPTERS (Zero UI rewrite — Maps GraphQL to component shapes)
───────────────────────────────────────────────────────────────────────────── */

export function normalizeGraphQLUser(user) {
  if (!user) return null;
  const name = user.name || user.displayName || user.username || '';
  const avatar = user.avatarUrl || user.profilePicture || user.avatar_url || null;
  const rawAccountType = String(user.accountType || user.account_type || 'student').toLowerCase();

  return {
    id: user.id,
    name,
    displayName: user.displayName || name,
    username: user.username || '',
    avatar_url: avatar,
    avatarUrl: avatar,
    profile_picture: avatar,
    profilePicture: avatar,
    bio: user.bio || '',
    account_type: rawAccountType,
    accountType: rawAccountType,
    is_private: Boolean(user.isPrivate ?? user.is_private),
    isPrivate: Boolean(user.isPrivate ?? user.is_private),
    is_verified: Boolean(user.isVerified ?? user.is_verified),
    isVerified: Boolean(user.isVerified ?? user.is_verified),
    is_active: Boolean(user.isActive ?? user.is_active ?? true),
    isActive: Boolean(user.isActive ?? user.is_active ?? true),
    is_following: Boolean(user.isFollowing ?? user.is_following),
    isFollowing: Boolean(user.isFollowing ?? user.is_following),
    followers_count: Number(user.followersCount ?? user.followers_count ?? 0),
    followersCount: Number(user.followersCount ?? user.followers_count ?? 0),
    following_count: Number(user.followingCount ?? user.following_count ?? 0),
    followingCount: Number(user.followingCount ?? user.following_count ?? 0),
    post_count: Number(user.postCount ?? user.post_count ?? 0),
    postCount: Number(user.postCount ?? user.post_count ?? 0),
  };
}

export function normalizeGraphQLVideo(node) {
  if (!node) return null;
  const creator = node.creator ? normalizeGraphQLUser(node.creator) : null;
  const isLiked = Boolean(node.viewerContext?.isLiked);
  const isSaved = Boolean(node.viewerContext?.isSaved);
  const creatorIsFollowing = Boolean(node.creator?.isFollowing || node.viewerContext?.creatorIsFollowing);
  const videoUrl = node.videoUrl || node.video_url || node.sourceUrl || node.source_url || '';
  const thumbnailUrl = node.thumbnailUrl || node.thumbnail_url || null;

  return {
    id: node.id,
    title: node.title || '',
    description: node.description || '',
    video_url: videoUrl,
    videoUrl: videoUrl,
    thumbnail_url: thumbnailUrl,
    thumbnailUrl: thumbnailUrl,
    duration: Number(node.duration || 0),
    duration_formatted: node.durationFormatted || node.duration_formatted || '0:00',
    durationFormatted: node.durationFormatted || node.duration_formatted || '0:00',
    views: Number(node.views || 0),
    views_formatted: node.viewsFormatted || node.views_formatted || '0',
    viewsFormatted: node.viewsFormatted || node.views_formatted || '0',
    likes_count: Number(node.likesCount ?? node.likes_count ?? 0),
    likesCount: Number(node.likesCount ?? node.likes_count ?? 0),
    likes_formatted: node.likesFormatted || node.likes_formatted || '0',
    likesFormatted: node.likesFormatted || node.likes_formatted || '0',
    comments_count: Number(node.commentsCount ?? node.comments_count ?? 0),
    commentsCount: Number(node.commentsCount ?? node.comments_count ?? 0),
    content_type: node.contentType || node.content_type || 'long',
    contentType: node.contentType || node.content_type || 'long',
    category: node.category || null,
    tags: node.tags || [],
    difficulty: node.difficulty || null,
    learning_outcomes: node.learningOutcomes || node.learning_outcomes || [],
    learningOutcomes: node.learningOutcomes || node.learning_outcomes || [],
    resource_links: node.resourceLinks || node.resource_links || [],
    resourceLinks: node.resourceLinks || node.resource_links || [],
    source_platform: node.sourcePlatform || node.source_platform || null,
    sourcePlatform: node.sourcePlatform || node.source_platform || null,
    source_url: node.sourceUrl || node.source_url || null,
    sourceUrl: node.sourceUrl || node.source_url || null,
    original_creator_name: node.originalCreatorName || node.original_creator_name || null,
    originalCreatorName: node.originalCreatorName || node.original_creator_name || null,
    original_creator_handle: node.originalCreatorHandle || node.original_creator_handle || null,
    originalCreatorHandle: node.originalCreatorHandle || node.original_creator_handle || null,
    original_creator_url: node.originalCreatorUrl || node.original_creator_url || null,
    originalCreatorUrl: node.originalCreatorUrl || node.original_creator_url || null,
    created_at: node.createdAt || node.created_at,
    createdAt: node.createdAt || node.created_at,
    user_id: creator?.id || node.creator_id,
    creator_id: creator?.id || node.creator_id,
    creator_name: creator?.name || node.creator_name,
    creator_username: creator?.username || node.creator_username,
    creator_avatar: creator?.avatar_url || node.creator_avatar,
    creator_avatar_url: creator?.avatar_url || node.creator_avatar,
    creator_verified: Boolean(creator?.is_verified),
    creator_is_following: creatorIsFollowing,
    viewer_liked: isLiked,
    viewer_saved: isSaved,
    status: node.status || 'published',
    moderation_status: node.moderation_status || 'approved',
    creator,
    viewerContext: {
      isLiked,
      isSaved,
      creatorIsFollowing,
    },
  };
}

export function normalizeGraphQLVideoComment(c) {
  if (!c) return null;
  const author = c.author ? normalizeGraphQLUser(c.author) : null;
  return {
    id: c.id,
    video_id: c.videoId || c.video_id,
    videoId: c.videoId || c.video_id,
    parent_id: c.parentId || c.parent_id || null,
    parentId: c.parentId || c.parent_id || null,
    text: c.text || c.body || '',
    body: c.text || c.body || '',
    likes_count: Number(c.likesCount ?? c.likes_count ?? 0),
    likesCount: Number(c.likesCount ?? c.likes_count ?? 0),
    reply_count: Number(c.replyCount ?? c.reply_count ?? 0),
    replyCount: Number(c.replyCount ?? c.reply_count ?? 0),
    viewer_liked: Boolean(c.isLiked ?? c.viewer_liked),
    is_liked: Boolean(c.isLiked ?? c.viewer_liked),
    isLiked: Boolean(c.isLiked ?? c.viewer_liked),
    created_at: c.createdAt || c.created_at,
    createdAt: c.createdAt || c.created_at,
    user_id: author?.id || c.user_id,
    author_name: author?.name || 'Anonymous',
    author_username: author?.username || 'anonymous',
    author_avatar: author?.avatar_url || null,
    user: author,
    replies: (c.replies || []).filter(Boolean).map(normalizeGraphQLVideoComment).filter(Boolean),
  };
}

export function normalizeGraphQLMessage(m) {
  if (!m) return null;
  let attachment = m.contentAttachment || m.content_attachment;
  if (typeof attachment === 'string') {
    try { attachment = JSON.parse(attachment); } catch (_) {}
  }
  const sender = m.sender ? normalizeGraphQLUser(m.sender) : null;
  return {
    id: m.id,
    conversation_id: m.conversationId || m.conversation_id,
    conversationId: m.conversationId || m.conversation_id,
    sender_id: m.senderId || m.sender_id || sender?.id,
    senderId: m.senderId || m.sender_id || sender?.id,
    body: m.body || '',
    type: m.type || 'text',
    content_attachment: attachment,
    contentAttachment: attachment,
    is_read: Boolean(m.isRead ?? m.is_read),
    isRead: Boolean(m.isRead ?? m.is_read),
    created_at: m.createdAt || m.created_at,
    createdAt: m.createdAt || m.created_at,
    sender: sender ? {
      id: sender.id,
      username: sender.username,
      name: sender.name || sender.displayName,
      avatar_url: sender.avatar_url || sender.avatarUrl,
    } : null,
  };
}

export function normalizeGraphQLConversation(c) {
  if (!c) return null;
  const other = c.otherUser ? normalizeGraphQLUser(c.otherUser) : (c.other_user ? normalizeGraphQLUser(c.other_user) : null);
  const otherId = other?.id || c.other_user_id;
  const otherUsername = other?.username || c.other_username || '';
  const otherName = other?.name || other?.displayName || c.other_name || otherUsername;
  const otherAvatar = other?.avatar_url || other?.avatarUrl || c.other_avatar || null;
  const isVerified = Boolean(other?.is_verified ?? other?.isVerified ?? c.is_verified);
  const isActive = Boolean(other?.is_active ?? other?.isActive ?? c.is_active);

  const lastMsg = c.lastMessage ? normalizeGraphQLMessage(c.lastMessage) : null;

  return {
    id: c.id,
    conversation_id: c.id,
    other_user_id: otherId,
    other_username: otherUsername,
    other_name: otherName,
    other_avatar: otherAvatar,
    is_verified: isVerified,
    is_active: isActive,
    other_user: other ? {
      id: other.id,
      username: other.username,
      name: otherName,
      displayName: otherName,
      avatar_url: otherAvatar,
      avatarUrl: otherAvatar,
      is_verified: isVerified,
      isVerified: isVerified,
      is_active: isActive,
      isActive: isActive,
      bio: other.bio || '',
    } : null,
    last_message: lastMsg?.body || c.last_message || '',
    last_message_type: lastMsg?.type || c.last_message_type || 'text',
    last_message_at: lastMsg?.created_at || c.last_message_at || c.updatedAt || c.updated_at || c.createdAt || c.created_at,
    last_sender_id: lastMsg?.sender_id || c.last_sender_id,
    unread_count: Number(c.unreadCount ?? c.unread_count ?? 0),
    is_blocked: Boolean(c.isBlocked ?? c.is_blocked),
    created_at: c.createdAt || c.created_at,
    updated_at: c.updatedAt || c.updated_at,
  };
}

export function normalizeGraphQLMessageRequest(mr) {
  if (!mr) return null;
  const fromUser = mr.fromUser ? normalizeGraphQLUser(mr.fromUser) : null;
  return {
    id: mr.id,
    from_user_id: fromUser?.id || mr.from_user_id,
    fromUserId: fromUser?.id || mr.from_user_id,
    body: mr.body || '',
    status: mr.status || 'pending',
    created_at: mr.createdAt || mr.created_at,
    createdAt: mr.createdAt || mr.created_at,
    from_user: fromUser ? {
      id: fromUser.id,
      username: fromUser.username,
      name: fromUser.name || fromUser.displayName,
      displayName: fromUser.displayName || fromUser.name,
      avatar_url: fromUser.avatar_url || fromUser.avatarUrl,
      avatarUrl: fromUser.avatarUrl || fromUser.avatar_url,
      bio: fromUser.bio || '',
      is_verified: fromUser.is_verified || false,
    } : null,
  };
}

export function normalizeGraphQLPost(node) {
  if (!node) return null;
  const creator = node.creator ? normalizeGraphQLUser(node.creator) : null;
  return {
    id: node.id,
    title: node.title || '',
    slug: node.slug || '',
    type: node.type || 'post',
    description: node.description || '',
    caption: node.description || '',
    content: node.description || '',
    thumbnail_url: node.thumbnailUrl || null,
    aspect_ratio: node.aspectRatio || null,
    dominant_color: node.dominantColor || '#0e0e0e',
    clap_count: Number(node.clapCount ?? 0),
    view_count: Number(node.viewCount ?? 0),
    comment_count: Number(node.commentCount ?? 0),
    created_at: node.createdAt,
    updated_at: node.updatedAt,
    difficulty: node.difficulty || null,
    language: node.language || null,
    price: node.price || null,
    price_amount: node.priceAmount != null ? Number(node.priceAmount) : null,
    tags: node.tags || [],
    source_link: node.sourceLink || null,
    github_repo_url: node.githubRepoUrl || null,
    source_platform: node.sourcePlatform || null,
    original_creator_handle: node.originalCreatorHandle || null,
    original_creator_name: node.originalCreatorName || null,
    creator_id: creator?.id || node.creator_id,
    creator_name: creator?.name || node.creator_name,
    creator_username: creator?.username || node.creator_username,
    creator_avatar: creator?.avatar_url || node.creator_avatar,
    is_following: Boolean(creator?.is_following || node.is_following),
    is_clapped: Boolean(node.viewerContext?.isClapped ?? node.is_clapped),
    is_saved: Boolean(node.viewerContext?.isSaved ?? node.is_saved),
    creator,
    media: (node.media || []).filter(Boolean).map(m => ({
      id: m.id,
      media_url: m.mediaUrl || m.media_url,
      media_type: m.mediaType || m.media_type || 'image',
      aspect_ratio: m.aspectRatio || m.aspect_ratio || null,
      sort_order: Number(m.sortOrder ?? m.sort_order ?? 0),
      width: m.width || null,
      height: m.height || null,
    })),
    files: (node.files || []).filter(Boolean).map(f => ({
      id: f.id,
      file_name: f.fileName || f.file_name || '',
      file_size: Number(f.fileSize ?? f.file_size ?? 0),
      file_type: f.fileType || f.file_type || '',
      storage_url: f.storageUrl || f.storage_url || '',
      url: f.storageUrl || f.storage_url || '',
    })),
  };
}

export function normalizeGraphQLStoryGroup(group) {
  if (!group) return null;
  return {
    id: group.id,
    name: group.name || '',
    username: group.username || '',
    avatar_url: group.avatarUrl || null,
    user_avatar: group.avatarUrl || null,
    is_own: Boolean(group.isOwn),
    stories: (group.stories || []).filter(Boolean).map(s => ({
      id: s.id,
      media_url: s.mediaUrl || s.media_url || '',
      content_url: s.mediaUrl || s.media_url || '',
      url: s.mediaUrl || s.media_url || '',
      type: s.type || 'image',
      caption: s.caption || '',
      created_at: s.createdAt || s.created_at,
      expires_at: s.expiresAt || s.expires_at,
      shared_content_type: s.sharedContentType || s.shared_content_type || null,
      shared_content_id: s.sharedContentId || s.shared_content_id || null,
    })),
  };
}

export function normalizeGraphQLComment(c) {
  if (!c) return null;
  return {
    id: c.id,
    post_id: c.postId,
    parent_id: c.parentId,
    body: c.body,
    text: c.body,
    likes_count: c.likesCount,
    reply_count: c.replyCount,
    created_at: c.createdAt,
    user: c.user ? normalizeGraphQLUser(c.user) : null,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   GRAPHQL QUERY & MUTATION DOCUMENTS
───────────────────────────────────────────────────────────────────────────── */

export const FEED_QUERY = `#graphql
  query GetFeed($first: Int, $after: String, $filter: PostFilterInput) {
    feed(first: $first, after: $after, filter: $filter) {
      edges {
        cursor
        node {
          id
          title
          slug
          type
          difficulty
          language
          description
          price
          priceAmount
          tags
          thumbnailUrl
          dominantColor
          aspectRatio
          githubRepoUrl
          sourceLink
          sourcePlatform
          originalCreatorHandle
          originalCreatorName
          clapCount
          viewCount
          commentCount
          createdAt
          updatedAt
          creator {
            id
            name
            username
            avatarUrl
            isFollowing
          }
          viewerContext {
            isClapped
            isSaved
          }
          media {
            id
            mediaUrl
            mediaType
            aspectRatio
            sortOrder
            width
            height
          }
          files {
            id
            fileName
            fileSize
            fileType
            storageUrl
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const GET_POST_BY_ID_QUERY = `#graphql
  query GetPostById($id: ID!) {
    post(id: $id) {
      id
      title
      slug
      type
      difficulty
      language
      description
      price
      priceAmount
      tags
      thumbnailUrl
      dominantColor
      aspectRatio
      githubRepoUrl
      sourceLink
      sourcePlatform
      originalCreatorHandle
      originalCreatorName
      clapCount
      viewCount
      commentCount
      createdAt
      updatedAt
      creator {
        id
        name
        username
        avatarUrl
        isFollowing
      }
      viewerContext {
        isClapped
        isSaved
      }
      media {
        id
        mediaUrl
        mediaType
        aspectRatio
        sortOrder
      }
      files {
        id
        fileName
        fileSize
        fileType
        storageUrl
      }
    }
  }
`;

export const GET_POST_BY_SLUG_QUERY = `#graphql
  query GetPostBySlug($slug: String!) {
    postBySlug(slug: $slug) {
      id
      title
      slug
      type
      difficulty
      language
      description
      price
      priceAmount
      tags
      thumbnailUrl
      dominantColor
      aspectRatio
      githubRepoUrl
      sourceLink
      sourcePlatform
      originalCreatorHandle
      originalCreatorName
      clapCount
      viewCount
      commentCount
      createdAt
      updatedAt
      creator {
        id
        name
        username
        avatarUrl
        isFollowing
      }
      viewerContext {
        isClapped
        isSaved
      }
      media {
        id
        mediaUrl
        mediaType
        aspectRatio
        sortOrder
      }
      files {
        id
        fileName
        fileSize
        fileType
        storageUrl
      }
    }
  }
`;

export const DIRECT_POST_QUERY = GET_POST_BY_ID_QUERY;


export const STORIES_QUERY = `#graphql
  query GetStories {
    stories {
      id
      name
      username
      avatarUrl
      isOwn
      stories {
        id
        mediaUrl
        type
        caption
        sharedContentType
        sharedContentId
        createdAt
        expiresAt
      }
    }
  }
`;

export const SEARCH_QUERY = `#graphql
  query SearchExplore($query: String!, $limit: Int, $offset: Int) {
    search(query: $query, limit: $limit, offset: $offset) {
      topProfileCard {
        user {
          id
          name
          username
          avatarUrl
          bio
          accountType
          isPrivate
          isFollowing
          followersCount
          followingCount
          isVerified
          postCount
        }
        mutualFollowers {
          id
          name
          username
          avatarUrl
        }
        recentPosts {
          id
          title
          slug
          type
          thumbnailUrl
          viewCount
          clapCount
          createdAt
        }
      }
      sections {
        type
        items
        hasMore
        total
        maxScore
      }
    }
  }
`;

export const SEARCH_SECTION_QUERY = `#graphql
  query SearchSection($query: String!, $type: SearchSectionType!, $limit: Int, $offset: Int) {
    searchSection(query: $query, type: $type, limit: $limit, offset: $offset) {
      type
      items
      hasMore
      total
      maxScore
    }
  }
`;

export const SEARCH_SUGGESTIONS_QUERY = `#graphql
  query SearchSuggestions($query: String!) {
    searchSuggestions(query: $query) {
      value
      label
      logo
    }
  }
`;

export const SEARCH_CREATORS_QUERY = `#graphql
  query SearchCreators($query: String, $accountType: AccountType, $limit: Int) {
    searchCreators(query: $query, accountType: $accountType, limit: $limit) {
      id
      name
      username
      avatarUrl
      bio
      accountType
      isPrivate
      isFollowing
      followersCount
      followingCount
      isVerified
      postCount
    }
  }
`;

export const SUGGESTED_CREATORS_QUERY = SEARCH_CREATORS_QUERY;

export const SHORTS_QUERY = `#graphql
  query GetShorts($category: String, $first: Int, $after: String) {
    shorts(category: $category, first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          title
          description
          videoUrl
          thumbnailUrl
          duration
          durationFormatted
          views
          viewsFormatted
          likesCount
          likesFormatted
          commentsCount
          contentType
          category
          tags
          difficulty
          learningOutcomes
          resourceLinks
          sourcePlatform
          sourceUrl
          originalCreatorName
          originalCreatorHandle
          originalCreatorUrl
          createdAt
          creator {
            id
            name
            username
            avatarUrl
            isFollowing
            isVerified
          }
          viewerContext {
            isLiked
            isSaved
            creatorIsFollowing
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const VIDEOS_QUERY = `#graphql
  query GetVideos($filter: VideoFilterInput, $first: Int, $after: String) {
    videos(filter: $filter, first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          title
          description
          videoUrl
          thumbnailUrl
          duration
          durationFormatted
          views
          viewsFormatted
          likesCount
          likesFormatted
          commentsCount
          contentType
          category
          tags
          difficulty
          learningOutcomes
          resourceLinks
          sourcePlatform
          sourceUrl
          originalCreatorName
          originalCreatorHandle
          originalCreatorUrl
          createdAt
          creator {
            id
            name
            username
            avatarUrl
            isFollowing
            isVerified
          }
          viewerContext {
            isLiked
            isSaved
            creatorIsFollowing
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const VIDEO_QUERY = `#graphql
  query GetVideo($id: ID!) {
    video(id: $id) {
      id
      title
      description
      videoUrl
      thumbnailUrl
      duration
      durationFormatted
      views
      viewsFormatted
      likesCount
      likesFormatted
      commentsCount
      contentType
      category
      tags
      difficulty
      learningOutcomes
      resourceLinks
      sourcePlatform
      sourceUrl
      originalCreatorName
      originalCreatorHandle
      originalCreatorUrl
      createdAt
      creator {
        id
        name
        username
        avatarUrl
        isFollowing
        isVerified
      }
      viewerContext {
        isLiked
        isSaved
        creatorIsFollowing
      }
    }
  }
`;

export const RECOMMENDED_VIDEOS_QUERY = `#graphql
  query GetRecommendedVideos($videoId: ID, $category: String, $limit: Int) {
    recommendedVideos(videoId: $videoId, category: $category, limit: $limit) {
      id
      title
      description
      videoUrl
      thumbnailUrl
      duration
      durationFormatted
      views
      viewsFormatted
      likesCount
      likesFormatted
      commentsCount
      contentType
      category
      tags
      difficulty
      sourcePlatform
      sourceUrl
      originalCreatorName
      originalCreatorHandle
      originalCreatorUrl
      createdAt
      creator {
        id
        name
        username
        avatarUrl
        isFollowing
        isVerified
      }
      viewerContext {
        isLiked
        isSaved
        creatorIsFollowing
      }
    }
  }
`;

export const VIDEO_COMMENTS_QUERY = `#graphql
  query GetVideoComments($videoId: ID!, $limit: Int, $offset: Int) {
    videoComments(videoId: $videoId, limit: $limit, offset: $offset) {
      id
      videoId
      parentId
      text
      likesCount
      replyCount
      isLiked
      createdAt
      author {
        id
        name
        username
        avatarUrl
      }
      replies {
        id
        videoId
        parentId
        text
        likesCount
        replyCount
        isLiked
        createdAt
        author {
          id
          name
          username
          avatarUrl
        }
      }
    }
  }
`;

export const TOGGLE_VIDEO_LIKE_MUTATION = `#graphql
  mutation ToggleVideoLike($id: ID!) {
    toggleVideoLike(id: $id)
  }
`;

export const TOGGLE_VIDEO_SAVE_MUTATION = `#graphql
  mutation ToggleVideoSave($id: ID!) {
    toggleVideoSave(id: $id)
  }
`;

export const ADD_VIDEO_COMMENT_MUTATION = `#graphql
  mutation AddVideoComment($videoId: ID!, $input: VideoCommentInput!) {
    addVideoComment(videoId: $videoId, input: $input) {
      id
      videoId
      parentId
      text
      likesCount
      replyCount
      isLiked
      createdAt
      author {
        id
        name
        username
        avatarUrl
      }
    }
  }
`;

export const TOGGLE_VIDEO_COMMENT_LIKE_MUTATION = `#graphql
  mutation ToggleVideoCommentLike($commentId: ID!) {
    toggleVideoCommentLike(commentId: $commentId)
  }
`;

export const CLAP_POST_MUTATION = `#graphql
  mutation ClapPost($id: ID!) {
    clapPost(id: $id) {
      id
      clapCount
      viewerContext {
        isClapped
      }
    }
  }
`;

export const UNCLAP_POST_MUTATION = `#graphql
  mutation UnclapPost($id: ID!) {
    unclapPost(id: $id) {
      id
      clapCount
      viewerContext {
        isClapped
      }
    }
  }
`;

export const POST_COMMENTS_QUERY = `#graphql
  query GetPostComments($postId: ID!, $first: Int, $after: String) {
    postComments(postId: $postId, first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          postId
          parentId
          body
          likesCount
          replyCount
          createdAt
          user {
            id
            name
            username
            avatarUrl
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const ADD_POST_COMMENT_MUTATION = `#graphql
  mutation AddPostComment($postId: ID!, $input: CommentInput!) {
    addPostComment(postId: $postId, input: $input) {
      id
      postId
      parentId
      body
      likesCount
      replyCount
      createdAt
      user {
        id
        name
        username
        avatarUrl
      }
    }
  }
`;

export const DELETE_POST_COMMENT_MUTATION = `#graphql
  mutation DeletePostComment($postId: ID!, $commentId: ID!) {
    deletePostComment(postId: $postId, commentId: $commentId) {
      success
      message
    }
  }
`;

export const CREATE_STORY_MUTATION = `#graphql
  mutation CreateStory($input: CreateStoryInput!) {
    createStory(input: $input) {
      id
      mediaUrl
      type
      caption
      createdAt
      expiresAt
    }
  }
`;

export const DELETE_STORY_MUTATION = `#graphql
  mutation DeleteStory($id: ID!) {
    deleteStory(id: $id) {
      success
      message
    }
  }
`;

export const DIRECT_INBOX_QUERY = `#graphql
  query DirectInbox($since: String) {
    directInbox(since: $since) {
      id
      createdAt
      updatedAt
      unreadCount
      isBlocked
      otherUser {
        id
        username
        displayName
        name
        avatarUrl
        profilePicture
        isVerified
        isActive
      }
      lastMessage {
        id
        conversationId
        senderId
        body
        type
        contentAttachment
        isRead
        createdAt
      }
    }
  }
`;

export const DIRECT_REQUESTS_QUERY = `#graphql
  query DirectRequests {
    directRequests {
      id
      body
      status
      createdAt
      fromUser {
        id
        username
        displayName
        name
        avatarUrl
        profilePicture
        isVerified
        bio
      }
    }
  }
`;

export const DIRECT_CONVERSATION_QUERY = `#graphql
  query DirectConversation($id: ID!, $after: String, $before: String, $limit: Int) {
    conversation(id: $id, after: $after, before: $before, limit: $limit) {
      isBlocked
      conversation {
        id
        createdAt
        updatedAt
        unreadCount
        isBlocked
      }
      otherUser {
        id
        username
        displayName
        name
        avatarUrl
        profilePicture
        isVerified
        isActive
        bio
      }
      messages {
        id
        conversationId
        senderId
        body
        type
        contentAttachment
        isRead
        createdAt
        sender {
          id
          username
          displayName
          name
          avatarUrl
          profilePicture
        }
      }
    }
  }
`;

export const SEND_DIRECT_MESSAGE_MUTATION = `#graphql
  mutation SendDirectMessage($conversationId: ID!, $input: SendMessageInput!) {
    sendMessage(conversationId: $conversationId, input: $input) {
      id
      conversationId
      senderId
      body
      type
      contentAttachment
      isRead
      createdAt
      sender {
        id
        username
        displayName
        name
        avatarUrl
        profilePicture
      }
    }
  }
`;

export const START_DIRECT_MESSAGE_MUTATION = `#graphql
  mutation StartDirectMessage($input: StartDirectMessageInput!) {
    startDirectMessage(input: $input)
  }
`;

export const RESPOND_MESSAGE_REQUEST_MUTATION = `#graphql
  mutation RespondMessageRequest($requestId: ID!, $status: RequestStatus!) {
    respondMessageRequest(requestId: $requestId, status: $status) {
      success
      message
    }
  }
`;

export const DELETE_DIRECT_CONVERSATION_MUTATION = `#graphql
  mutation DeleteDirectConversation($conversationId: ID!) {
    deleteConversation(conversationId: $conversationId) {
      success
      message
    }
  }
`;


/* ─────────────────────────────────────────────────────────────────────────────
   TYPED FEED API FUNCTIONS (Exported for view components)
───────────────────────────────────────────────────────────────────────────── */

/**
 * Fetch feed posts with keyset cursor pagination & filter
 */
export async function getGraphQLFeed({ first = 5, after = null, filter = {} } = {}) {
  const cleanFilter = {};
  const safeFilter = filter || {};
  if (safeFilter.type && safeFilter.type !== 'all') cleanFilter.type = safeFilter.type;
  if (safeFilter.difficulty && safeFilter.difficulty !== 'all') cleanFilter.difficulty = safeFilter.difficulty;
  if (safeFilter.language && safeFilter.language !== 'all') cleanFilter.language = safeFilter.language;

  const data = await fetchGraphQL(FEED_QUERY, {
    first: Number(first) || 5,
    after: after || null,
    filter: Object.keys(cleanFilter).length > 0 ? cleanFilter : null,
  });

  const connection = data?.feed;
  const rawEdges = connection?.edges || [];
  const posts = rawEdges.map(edge => normalizeGraphQLPost(edge.node)).filter(Boolean);
  const pageInfo = connection?.pageInfo || { hasNextPage: false, endCursor: null };

  return {
    posts,
    next_cursor: pageInfo.hasNextPage ? pageInfo.endCursor : null,
    has_more: pageInfo.hasNextPage,
    end_cursor: pageInfo.endCursor,
    page_info: pageInfo,
  };
}

/**
 * Deep-fetch a single post by slug or ID
 */
export async function getGraphQLPostBySlugOrId(slugOrId) {
  if (!slugOrId) return null;
  let clean = String(slugOrId).trim();
  try { clean = decodeURIComponent(clean); } catch (_) {}
  clean = clean.replace(/^["']+|["']+$/g, '').trim();
  if (!clean) return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

  if (isUuid) {
    const data = await fetchGraphQL(GET_POST_BY_ID_QUERY, { id: clean });
    return normalizeGraphQLPost(data?.post);
  } else {
    const data = await fetchGraphQL(GET_POST_BY_SLUG_QUERY, { slug: clean });
    return normalizeGraphQLPost(data?.postBySlug);
  }
}

/**
 * Fetch active stories grouped by creator
 */
export async function getGraphQLStories() {
  const data = await fetchGraphQL(STORIES_QUERY);
  const rawGroups = data?.stories || [];
  return rawGroups.map(normalizeGraphQLStoryGroup).filter(Boolean);
}

export function normalizeGraphQLTopProfile(topProfileCard) {
  if (!topProfileCard || !topProfileCard.user) return null;
  const normalizedUser = normalizeGraphQLUser(topProfileCard.user);
  return {
    ...normalizedUser,
    user: normalizedUser,
    mutual_followers: (topProfileCard.mutualFollowers || []).map(normalizeGraphQLUser).filter(Boolean),
    recent_posts: (topProfileCard.recentPosts || []).map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      type: p.type,
      thumbnail_url: p.thumbnailUrl,
      view_count: p.viewCount,
      clap_count: p.clapCount,
      created_at: p.createdAt,
    })),
  };
}

export function normalizeGraphQLSearchSection(section) {
  if (!section) return null;
  const items = (section.items || []).map(item => {
    if (!item) return null;
    if (section.type === 'people' || item.accountType !== undefined || item.account_type !== undefined) {
      return {
        ...item,
        avatar_url: item.avatar_url || item.avatarUrl,
        followers_count: item.followers_count || item.followersCount || 0,
        following_count: item.following_count || item.followingCount || 0,
        is_verified: item.is_verified !== undefined ? item.is_verified : (item.isVerified || false),
        post_count: item.post_count || item.postCount || 0,
      };
    }
    if (section.type === 'videos' || section.type === 'shorts') {
      return {
        ...item,
        thumbnail_url: item.thumbnail_url || item.thumbnailUrl,
        playback_url: item.playback_url || item.playbackUrl,
        creator_avatar_url: item.creator_avatar_url || item.creatorAvatarUrl,
        creator_username: item.creator_username || item.creatorUsername,
        creator_name: item.creator_name || item.creatorName,
        duration_secs: item.duration_secs || item.durationSecs,
      };
    }
    if (section.type === 'articles') {
      return {
        ...item,
        og_image_url: item.og_image_url || item.ogImageUrl,
        creator_username: item.creator_username || item.creatorUsername,
        creator_display_name: item.creator_display_name || item.creatorDisplayName,
        creator_avatar_url: item.creator_avatar_url || item.creatorAvatarUrl,
        creator_verified: item.creator_verified !== undefined ? item.creator_verified : item.creatorVerified,
        clap_count: item.clap_count !== undefined ? item.clap_count : (item.clapCount || 0),
        view_count: item.view_count !== undefined ? item.view_count : (item.viewCount || 0),
        read_time_mins: item.read_time_mins || item.readTimeMins,
        page_type: item.page_type || item.pageType || 'standard-article',
        meta: item.meta || {},
        content_blocks: item.content_blocks || item.contentBlocks || [],
      };
    }
    return item;
  }).filter(Boolean);

  return {
    type: section.type,
    items,
    hasMore: Boolean(section.hasMore),
    total: section.total || items.length,
    maxScore: section.maxScore || 0,
  };
}

export function normalizeGraphQLSearchResults(results) {
  if (!results) return { topProfileCard: null, sections: [] };
  return {
    topProfileCard: normalizeGraphQLTopProfile(results.topProfileCard),
    sections: (results.sections || []).map(normalizeGraphQLSearchSection).filter(Boolean),
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   TYPED FEED & EXPLORE API FUNCTIONS (Exported for view components)
───────────────────────────────────────────────────────────────────────────── */

/**
 * Search multimodal explore index (videos, shorts, articles, people, topProfileCard)
 */
export async function getGraphQLSearch({ query, limit = 12, offset = 0 }) {
  if (!query || !query.trim()) {
    return { topProfileCard: null, sections: [] };
  }
  const data = await fetchGraphQL(SEARCH_QUERY, { query, limit, offset });
  return normalizeGraphQLSearchResults(data?.search);
}

/**
 * Fetch a specific search section with offset pagination
 */
export async function getGraphQLSearchSection({ query, type, limit = 12, offset = 0 }) {
  const data = await fetchGraphQL(SEARCH_SECTION_QUERY, { query: query || '', type, limit, offset });
  return normalizeGraphQLSearchSection(data?.searchSection);
}

/**
 * Fetch search auto-suggestions
 */
export async function getGraphQLSearchSuggestions(query) {
  if (!query || !query.trim()) return [];
  const data = await fetchGraphQL(SEARCH_SUGGESTIONS_QUERY, { query: query.trim() });
  return data?.searchSuggestions || [];
}

/**
 * Fetch creator directory
 */
export async function getGraphQLSearchCreators({ query = null, accountType = null, limit = 24 } = {}) {
  const variables = { limit };
  if (query) variables.query = query;
  if (accountType && accountType !== 'all') variables.accountType = accountType;

  const data = await fetchGraphQL(SEARCH_CREATORS_QUERY, variables);
  const rawUsers = data?.searchCreators || [];
  return rawUsers.map(normalizeGraphQLUser).filter(Boolean);
}

/**
 * Fetch suggested developers for feed rail & sidebar
 */
export async function getGraphQLSuggestedCreators(limit = 10) {
  return getGraphQLSearchCreators({ limit });
}

/**
 * Clap post mutation
 */
export async function clapGraphQLPost(postId) {
  const data = await fetchGraphQL(CLAP_POST_MUTATION, { id: postId });
  return data?.clapPost;
}

/**
 * Unclap post mutation
 */
export async function unclapGraphQLPost(postId) {
  const data = await fetchGraphQL(UNCLAP_POST_MUTATION, { id: postId });
  return data?.unclapPost;
}

/**
 * Fetch post comments
 */
export async function getGraphQLPostComments(postId, { first = 50, after = null } = {}) {
  const data = await fetchGraphQL(POST_COMMENTS_QUERY, { postId, first, after });
  const rawEdges = data?.postComments?.edges || [];
  const comments = rawEdges.map(edge => normalizeGraphQLComment(edge.node)).filter(Boolean);
  const pageInfo = data?.postComments?.pageInfo || { hasNextPage: false, endCursor: null };
  return {
    comments,
    pageInfo,
  };
}

/**
 * Add comment to post
 */
export async function addGraphQLPostComment(postId, { body, parentId = null }) {
  const data = await fetchGraphQL(ADD_POST_COMMENT_MUTATION, {
    postId,
    input: { body, parentId },
  });
  return normalizeGraphQLComment(data?.addPostComment);
}

/**
 * Delete post comment
 */
export async function deleteGraphQLPostComment(postId, commentId) {
  const data = await fetchGraphQL(DELETE_POST_COMMENT_MUTATION, { postId, commentId });
  return data?.deletePostComment;
}

/* ─────────────────────────────────────────────────────────────────────────────
   TYPED SHORTS & VIDEOS API FUNCTIONS (Exported for view components)
───────────────────────────────────────────────────────────────────────────── */

/**
 * Fetch shorts with cursor pagination & category filter
 */
export async function getGraphQLShorts({ category = null, first = 12, after = null } = {}) {
  const variables = { first };
  if (category && category !== 'All') variables.category = category;
  if (after) variables.after = after;

  const data = await fetchGraphQL(SHORTS_QUERY, variables);
  const connection = data?.shorts;
  const rawEdges = connection?.edges || [];
  const videos = rawEdges.map(e => normalizeGraphQLVideo(e.node)).filter(Boolean);
  const pageInfo = connection?.pageInfo || { hasNextPage: false, endCursor: null };

  return {
    videos,
    shorts: videos,
    cursor: pageInfo.hasNextPage ? pageInfo.endCursor : null,
    has_more: pageInfo.hasNextPage,
    hasMore: pageInfo.hasNextPage,
    pageInfo,
  };
}

/**
 * Fetch videos with filter, search, and cursor/offset pagination
 */
export async function getGraphQLVideos({ filter = {}, first = 12, after = null } = {}) {
  const cleanFilter = {};
  const safeFilter = filter || {};
  if (safeFilter.category && safeFilter.category !== 'All') cleanFilter.category = safeFilter.category;
  if (safeFilter.difficulty && safeFilter.difficulty !== 'All') cleanFilter.difficulty = safeFilter.difficulty;
  if (safeFilter.search) cleanFilter.search = safeFilter.search;
  if (safeFilter.contentType) cleanFilter.contentType = safeFilter.contentType;
  if (safeFilter.content_type) cleanFilter.contentType = safeFilter.content_type;
  if (safeFilter.tag) cleanFilter.tag = safeFilter.tag;

  const variables = { first };
  if (Object.keys(cleanFilter).length > 0) variables.filter = cleanFilter;
  if (after) variables.after = after;

  const data = await fetchGraphQL(VIDEOS_QUERY, variables);
  const connection = data?.videos;
  const rawEdges = connection?.edges || [];
  const videos = rawEdges.map(e => normalizeGraphQLVideo(e.node)).filter(Boolean);
  const pageInfo = connection?.pageInfo || { hasNextPage: false, endCursor: null };

  return {
    videos,
    cursor: pageInfo.hasNextPage ? pageInfo.endCursor : null,
    has_more: pageInfo.hasNextPage,
    hasMore: pageInfo.hasNextPage,
    pageInfo,
  };
}

/**
 * Fetch a single video by ID
 */
export async function getGraphQLVideo(id) {
  if (!id) return null;
  const data = await fetchGraphQL(VIDEO_QUERY, { id });
  return normalizeGraphQLVideo(data?.video);
}

/**
 * Fetch recommended videos for a video or category
 */
export async function getGraphQLRecommendedVideos({ videoId = null, category = null, limit = 8 } = {}) {
  const variables = { limit };
  if (videoId) variables.videoId = videoId;
  if (category && category !== 'All') variables.category = category;

  const data = await fetchGraphQL(RECOMMENDED_VIDEOS_QUERY, variables);
  const rawList = data?.recommendedVideos || [];
  return rawList.map(normalizeGraphQLVideo).filter(Boolean);
}

/**
 * Fetch video comments
 */
export async function getGraphQLVideoComments(videoId, { limit = 50, offset = 0 } = {}) {
  if (!videoId) return { comments: [] };
  const data = await fetchGraphQL(VIDEO_COMMENTS_QUERY, { videoId, limit, offset });
  const rawComments = data?.videoComments || [];
  const comments = rawComments.map(normalizeGraphQLVideoComment).filter(Boolean);
  return {
    comments,
  };
}

/**
 * Toggle video like mutation
 */
export async function toggleGraphQLVideoLike(id) {
  const data = await fetchGraphQL(TOGGLE_VIDEO_LIKE_MUTATION, { id });
  return data?.toggleVideoLike;
}

/**
 * Toggle video save mutation
 */
export async function toggleGraphQLVideoSave(id) {
  const data = await fetchGraphQL(TOGGLE_VIDEO_SAVE_MUTATION, { id });
  return data?.toggleVideoSave;
}

/**
 * Add video comment
 */
export async function addGraphQLVideoComment(videoId, { text, parentId = null }) {
  const data = await fetchGraphQL(ADD_VIDEO_COMMENT_MUTATION, {
    videoId,
    input: { text, parentId },
  });
  return normalizeGraphQLVideoComment(data?.addVideoComment);
}

/**
 * Toggle video comment like
 */
export async function toggleGraphQLVideoCommentLike(commentId) {
  const data = await fetchGraphQL(TOGGLE_VIDEO_COMMENT_LIKE_MUTATION, { commentId });
  return data?.toggleVideoCommentLike;
}

/* ─────────────────────────────────────────────────────────────────────────────
   TYPED DIRECT MESSAGING API FUNCTIONS (Exported for DM view components)
───────────────────────────────────────────────────────────────────────────── */

/**
 * Fetch direct messaging inbox conversations
 */
export async function getGraphQLDirectInbox({ since = null } = {}) {
  const variables = {};
  if (since) variables.since = since;
  const data = await fetchGraphQL(DIRECT_INBOX_QUERY, variables);
  const rawList = data?.directInbox || [];
  const conversations = rawList.map(normalizeGraphQLConversation).filter(Boolean);
  return {
    conversations,
  };
}

/**
 * Fetch pending direct message requests
 */
export async function getGraphQLDirectRequests() {
  const data = await fetchGraphQL(DIRECT_REQUESTS_QUERY);
  const rawList = data?.directRequests || [];
  const requests = rawList.map(normalizeGraphQLMessageRequest).filter(Boolean);
  return {
    requests,
  };
}

/**
 * Fetch conversation details & messages
 */
export async function getGraphQLDirectConversation(id, { after = null, before = null, limit = 50 } = {}) {
  if (!id) return null;
  const variables = { id, limit };
  if (after) variables.after = after;
  if (before) variables.before = before;

  const data = await fetchGraphQL(DIRECT_CONVERSATION_QUERY, variables);
  const detail = data?.conversation;
  if (!detail) return null;

  const other = detail.otherUser ? normalizeGraphQLUser(detail.otherUser) : null;
  const messages = (detail.messages || []).map(normalizeGraphQLMessage).filter(Boolean);

  return {
    conversation: detail.conversation ? normalizeGraphQLConversation(detail.conversation) : null,
    messages,
    other_user: other ? {
      id: other.id,
      username: other.username,
      name: other.name || other.displayName,
      displayName: other.displayName || other.name,
      avatar_url: other.avatar_url || other.avatarUrl,
      avatarUrl: other.avatarUrl || other.avatar_url,
      is_verified: other.is_verified || false,
      isVerified: other.is_verified || false,
      is_active: other.is_active || false,
      isActive: other.is_active || false,
      bio: other.bio || '',
    } : null,
    is_blocked: Boolean(detail.isBlocked),
  };
}

/**
 * Send a message inside a direct conversation
 */
export async function sendGraphQLDirectMessage(conversationId, { body, type = 'text', contentAttachment = null, linkPreview = null, replyTo = null }) {
  const input = {
    body: body || '',
    type,
    contentAttachment: contentAttachment || undefined,
    linkPreview: linkPreview || undefined,
    replyTo: replyTo || undefined,
  };
  const data = await fetchGraphQL(SEND_DIRECT_MESSAGE_MUTATION, { conversationId, input });
  return normalizeGraphQLMessage(data?.sendMessage);
}

/**
 * Start a new direct message conversation
 */
export async function startGraphQLDirectMessage({ toUsername, message, type = 'text', contentAttachment = null, linkPreview = null, replyTo = null }) {
  const input = {
    toUsername,
    message: message || '',
    type,
    contentAttachment: contentAttachment || undefined,
    linkPreview: linkPreview || undefined,
    replyTo: replyTo || undefined,
  };
  const data = await fetchGraphQL(START_DIRECT_MESSAGE_MUTATION, { input });
  return data?.startDirectMessage;
}

/**
 * Respond to a message request (accept/decline)
 */
export async function respondGraphQLMessageRequest(requestId, status) {
  const data = await fetchGraphQL(RESPOND_MESSAGE_REQUEST_MUTATION, { requestId, status });
  return data?.respondMessageRequest;
}

/**
 * Delete a direct conversation from inbox
 */
export async function deleteGraphQLDirectConversation(conversationId) {
  const data = await fetchGraphQL(DELETE_DIRECT_CONVERSATION_MUTATION, { conversationId });
  return data?.deleteConversation;
}


