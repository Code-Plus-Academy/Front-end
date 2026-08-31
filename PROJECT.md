# Project: CPA Community Feed Media Regression Fix

## Architecture
- **Framework**: Next.js (App Router), React, Apollo Client / GraphQL, Tailwind CSS.
- **Problem**: GraphQL migration caused a media regression where video posts either play broken/no source or fall back incorrectly to images, and multi-image posts need verification across GraphQL and REST modes.
- **Affected Files**:
  - `src/api/graphql.js`: GraphQL queries (`FEED_QUERY`, `GET_POST_BY_ID_QUERY`, `GET_POST_BY_SLUG_QUERY`) and normalizer `normalizeGraphQLPost`.
  - `src/components/posts/PostCard.jsx`: Video detection (`isVideoPost`), player component (`FeedVideoPlayer`), and media extractor (`extractAllPostMedia`).
  - `src/components/feed/Feed.jsx`: REST fallback and feed post orchestration.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | `FEED_QUERY` `videoUrl` Field | Add `videoUrl` to `FEED_QUERY` selection set in `src/api/graphql.js` | M1 | R1 |
| 2 | `GET_POST_BY_ID_QUERY` `videoUrl` Field | Add `videoUrl` to `GET_POST_BY_ID_QUERY` selection set in `src/api/graphql.js` | M1 | R1 |
| 3 | Safe Video Source Resolution | In `FeedVideoPlayer`, replace blind `files?.[0]` with type-aware filter (`file_type?.startsWith('video/')` or video regex) | M2 | R2 |
| 4 | Robust `isVideoPost` Detection | Ensure `isVideoPost` checks `post.media?.some(m => m.media_type === 'video')` alongside `video_url`, `type === 'video'`, etc. | M2 | R3 |
| 5 | Multi-Image Carousel Verification | Verify `extractAllPostMedia` -> `DocumentCarousel` -> `MediaCarousel` handles N images cleanly with dot indicators and counter | M3 | R4 |
| 6 | REST Fallback Parity | Verify `Feed.jsx` and media extraction work cleanly when GraphQL is disabled (`NEXT_PUBLIC_ENABLE_GRAPHQL=false`) | M3 | R5 |
| 7 | Build Verification | Validate full clean build with `npm run build` with 0 errors | M4 | Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | GraphQL Selection Sets Fix | Update `FEED_QUERY`, `GET_POST_BY_ID_QUERY`, and `GET_POST_BY_SLUG_QUERY` in `src/api/graphql.js` to include `videoUrl` | none | DONE |
| M2 | PostCard Video Player & Detection Hardening | Update `FeedVideoPlayer` video source resolution and `isVideoPost` detection in `src/components/posts/PostCard.jsx` | M1 | DONE |
| M3 | Multi-Image Carousel & REST Parity Verification | Audit and verify `extractAllPostMedia`, `Feed.jsx` REST fallback, and carousel rendering | M1, M2 | DONE |
| M4 | End-to-End Build & Acceptance Audit | Run `npm run build`, verify zero errors, review code diffs against core rules | M1, M2, M3 | DONE |

## Interface Contracts
### GraphQL Post Shape
```javascript
{
  id: string,
  type: string,
  content: string,
  videoUrl: string | null,    // Primary video stream URL
  thumbnailUrl: string | null,// Cloudinary poster
  media: Array<{
    id: string,
    media_url: string,
    storage_url: string,
    media_type: 'image' | 'video' | 'document',
    thumbnail_url: string
  }>,
  files: Array<{
    id: string,
    url: string,
    storage_url: string,
    file_type: string,
    file_name: string
  }>
}
```

### Video Source Resolution Hierarchy (`FeedVideoPlayer`)
1. `post.video_url`
2. `post.media?.find(m => m.media_type === 'video')?.media_url || post.media?.find(m => m.media_type === 'video')?.storage_url`
3. `post.files?.find(f => f.file_type?.startsWith('video/') || /\.(mp4|mov|webm|mkv|m3u8)(\?|$)/i.test(f.url || f.storage_url))?.storage_url || ...?.url`
4. `post.thumbnail_url` only if matching video extension regex.

## Code Layout
```
src/
├── api/
│   └── graphql.js                  // FEED_QUERY, GET_POST_BY_ID_QUERY, GET_POST_BY_SLUG_QUERY, normalizeGraphQLPost
└── components/
    ├── feed/
    │   └── Feed.jsx                // Main Feed with GraphQL / REST fallback logic
    └── posts/
        ├── PostCard.jsx            // PostCard, FeedVideoPlayer, isVideoPost, extractAllPostMedia
        └── mediaResolution.test.js // Empirical test suite (23 test cases)
```
