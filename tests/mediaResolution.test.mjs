import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

let passed = 0;
let failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log(`  [PASS] ${label}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${label}`);
    console.error(`         ${err.message}`);
    failed++;
  }
}

console.log('\n=======================================================');
console.log('  CPA Community Feed Media Resolution Empirical Tests  ');
console.log('=======================================================\n');

// ── 1. Load source files directly from disk ──────────────────────────────
const rootDir = process.cwd();
const graphqlJsPath = path.join(rootDir, 'src', 'api', 'graphql.js');
const postCardJsxPath = path.join(rootDir, 'src', 'components', 'posts', 'PostCard.jsx');

const graphqlJsContent = fs.readFileSync(graphqlJsPath, 'utf8');
const postCardJsxContent = fs.readFileSync(postCardJsxPath, 'utf8');

// ── 2. Extract and evaluate normalizeGraphQLPost from graphql.js ─────────
const sandbox = {
  console,
  normalizeGraphQLUser: (u) => ({ id: u.id, name: u.name, username: u.username }),
};
vm.createContext(sandbox);

const normFnMatch = graphqlJsContent.match(/export function normalizeGraphQLPost\([\s\S]*?\n\}/);
if (!normFnMatch) {
  throw new Error('Could not find normalizeGraphQLPost in src/api/graphql.js');
}
const normFnCode = normFnMatch[0].replace('export function', 'function');
vm.runInContext(`${normFnCode}; sandbox_normalize = normalizeGraphQLPost;`, sandbox);
const normalizeGraphQLPost = sandbox.sandbox_normalize;

// ── 3. Extract and evaluate extractAllPostMedia from PostCard.jsx ──────────
const extractFnMatch = postCardJsxContent.match(/export function extractAllPostMedia\([\s\S]*?\n\}/);
if (!extractFnMatch) {
  throw new Error('Could not find extractAllPostMedia in src/components/posts/PostCard.jsx');
}
const extractFnCode = extractFnMatch[0].replace('export function', 'function');
vm.runInContext(`${extractFnCode}; sandbox_extractAllPostMedia = extractAllPostMedia;`, sandbox);
const extractAllPostMedia = sandbox.sandbox_extractAllPostMedia;

// ── 4. Helper functions reflecting PostCard.jsx logic ─────────────────────
function isVideoPost(post) {
  if (!post) return false;
  return Boolean(
    post.is_video_item ||
    post.type === 'video' ||
    post.type === 'short' ||
    post.video_url ||
    post.media?.some(m => m.media_type === 'video' || m.file_type?.startsWith('video/') || /\.(mp4|mov|webm|mkv|m3u8)(\?|$)/i.test(m.media_url || m.storage_url || m.url)) ||
    post.files?.some(f => f.file_type?.startsWith('video/') || /\.(mp4|mov|webm|mkv|m3u8)(\?|$)/i.test(f.url || f.storage_url))
  );
}

function resolveFeedVideoUrl(post) {
  if (!post) return null;
  return post.video_url ||
    post.media?.find(m => m.media_type === 'video' || m.file_type?.startsWith('video/') || /\.(mp4|mov|webm|mkv|m3u8)(\?|$)/i.test(m.media_url || m.storage_url || m.url))?.media_url ||
    post.media?.find(m => m.media_type === 'video' || m.file_type?.startsWith('video/') || /\.(mp4|mov|webm|mkv|m3u8)(\?|$)/i.test(m.media_url || m.storage_url || m.url))?.storage_url ||
    post.files?.find(f => f.file_type?.startsWith('video/') || /\.(mp4|mov|webm|mkv|m3u8)(\?|$)/i.test(f.url || f.storage_url))?.storage_url ||
    post.files?.find(f => f.file_type?.startsWith('video/') || /\.(mp4|mov|webm|mkv|m3u8)(\?|$)/i.test(f.url || f.storage_url))?.url ||
    (post.thumbnail_url && /\.(mp4|mov|webm|mkv|m3u8)(\?|$)/i.test(post.thumbnail_url) ? post.thumbnail_url : null) || null;
}

function determinePostCardRoute(post) {
  if (!post) return 'NoMedia';
  const isVideo = isVideoPost(post);
  const mediaFiles = extractAllPostMedia(post);
  const hasMedia = mediaFiles.length > 0 || Boolean(post.video_url);
  if (isVideo) return 'FeedVideoPlayer';
  if (hasMedia) return 'DocumentCarousel';
  return 'NoMedia';
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: GRAPHQL SELECTION SET AUDIT (R1)
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- Section 1: GraphQL Selection Set Verification ---');

test('FEED_QUERY selection set includes videoUrl and thumbnailUrl', () => {
  const feedQueryMatch = graphqlJsContent.match(/export const FEED_QUERY = `#graphql([\s\S]*?)`;/);
  assert.ok(feedQueryMatch, 'FEED_QUERY must be exported');
  const queryStr = feedQueryMatch[1];
  assert.match(queryStr, /\bvideoUrl\b/, 'FEED_QUERY must request videoUrl');
  assert.match(queryStr, /\bthumbnailUrl\b/, 'FEED_QUERY must request thumbnailUrl');
  assert.match(queryStr, /\bmedia\s*\{[\s\S]*?\bmediaUrl\b/, 'FEED_QUERY must request media.mediaUrl');
  assert.match(queryStr, /\bfiles\s*\{[\s\S]*?\bstorageUrl\b/, 'FEED_QUERY must request files.storageUrl');
});

test('GET_POST_BY_ID_QUERY selection set includes videoUrl and thumbnailUrl', () => {
  const getByIdMatch = graphqlJsContent.match(/export const GET_POST_BY_ID_QUERY = `#graphql([\s\S]*?)`;/);
  assert.ok(getByIdMatch, 'GET_POST_BY_ID_QUERY must be exported');
  const queryStr = getByIdMatch[1];
  assert.match(queryStr, /\bvideoUrl\b/, 'GET_POST_BY_ID_QUERY must request videoUrl');
  assert.match(queryStr, /\bthumbnailUrl\b/, 'GET_POST_BY_ID_QUERY must request thumbnailUrl');
  assert.match(queryStr, /\bmedia\s*\{[\s\S]*?\bmediaUrl\b/, 'GET_POST_BY_ID_QUERY must request media.mediaUrl');
});

test('GET_POST_BY_SLUG_QUERY selection set includes videoUrl and thumbnailUrl', () => {
  const getBySlugMatch = graphqlJsContent.match(/export const GET_POST_BY_SLUG_QUERY = `#graphql([\s\S]*?)`;/);
  assert.ok(getBySlugMatch, 'GET_POST_BY_SLUG_QUERY must be exported');
  const queryStr = getBySlugMatch[1];
  assert.match(queryStr, /\bvideoUrl\b/, 'GET_POST_BY_SLUG_QUERY must request videoUrl');
  assert.match(queryStr, /\bthumbnailUrl\b/, 'GET_POST_BY_SLUG_QUERY must request thumbnailUrl');
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: NORMALIZER VERIFICATION (R1, R5)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Section 2: normalizeGraphQLPost Unit Verification ---');

test('normalizeGraphQLPost maps camelCase videoUrl from GraphQL to both video_url and videoUrl', () => {
  const node = {
    id: 'post-1',
    title: 'GraphQL Video Stream',
    videoUrl: 'https://stream.mux.com/abcd1234efgh.m3u8',
    thumbnailUrl: 'https://res.cloudinary.com/cpa/image/upload/v1/poster.jpg',
    aspectRatio: '16:9',
    dominantColor: '#0e0e0e',
    clapCount: 42,
  };
  const normalized = normalizeGraphQLPost(node);
  assert.equal(normalized.video_url, 'https://stream.mux.com/abcd1234efgh.m3u8');
  assert.equal(normalized.videoUrl, 'https://stream.mux.com/abcd1234efgh.m3u8');
  assert.equal(normalized.thumbnail_url, 'https://res.cloudinary.com/cpa/image/upload/v1/poster.jpg');
  assert.equal(normalized.aspect_ratio, '16:9');
  assert.equal(normalized.clap_count, 42);
});

test('normalizeGraphQLPost maintains backwards compatibility with snake_case video_url', () => {
  const node = {
    id: 'post-2',
    video_url: 'https://cdn.cpa.in/video.mp4',
    thumbnail_url: 'https://cdn.cpa.in/thumb.jpg',
  };
  const normalized = normalizeGraphQLPost(node);
  assert.equal(normalized.video_url, 'https://cdn.cpa.in/video.mp4');
  assert.equal(normalized.videoUrl, 'https://cdn.cpa.in/video.mp4');
  assert.equal(normalized.thumbnail_url, 'https://cdn.cpa.in/thumb.jpg');
});

test('normalizeGraphQLPost safely returns null when videoUrl is omitted', () => {
  const node = { id: 'post-3', title: 'Image only' };
  const normalized = normalizeGraphQLPost(node);
  assert.equal(normalized.video_url, null);
  assert.equal(normalized.videoUrl, null);
  assert.equal(normalized.thumbnail_url, null);
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: SOURCE CODE AST & REGEX AUDIT (R2, R3)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Section 3: PostCard.jsx Source Code Safety Audit ---');

test('FeedVideoPlayer does NOT contain unsafe blind files?.[0] fallback without type check', () => {
  const feedVideoPlayerSection = postCardJsxContent.slice(
    postCardJsxContent.indexOf('export function FeedVideoPlayer'),
    postCardJsxContent.indexOf('export default function PostCard')
  );
  const blindFiles0Access = /post\.files\??\.\[0\]\??\.(storage_url|url)/;
  assert.equal(blindFiles0Access.test(feedVideoPlayerSection), false,
    'FeedVideoPlayer must NOT blindly access post.files[0]');
});

test('isVideoPost in PostCard.jsx includes media and files video checks', () => {
  const isVideoPostSection = postCardJsxContent.slice(
    postCardJsxContent.indexOf('const isVideoPost = Boolean('),
    postCardJsxContent.indexOf('const postSlug = post.slug')
  );
  assert.match(isVideoPostSection, /post\.media\?\.some\(/, 'isVideoPost must check post.media.some');
  assert.match(isVideoPostSection, /post\.files\?\.some\(/, 'isVideoPost must check post.files.some');
  assert.match(isVideoPostSection, /post\.video_url/, 'isVideoPost must check post.video_url');
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: EMPIRICAL DISPATCH TEST MATRIX (Cases A through G)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Section 4: Dispatch Test Cases A through G ---');

// Case A: Video post with videoUrl from GraphQL
test('Case A: Video post with videoUrl from GraphQL -> isVideoPost=true, resolves videoUrl, routes FeedVideoPlayer', () => {
  const post = {
    id: 'case-a',
    type: 'post',
    video_url: 'https://stream.mux.com/video-case-a.m3u8',
    thumbnail_url: 'https://res.cloudinary.com/cpa/image/upload/v1/poster_a.jpg',
    media: [],
    files: [],
  };
  assert.equal(isVideoPost(post), true, 'isVideoPost should be true');
  assert.equal(resolveFeedVideoUrl(post), 'https://stream.mux.com/video-case-a.m3u8');
  assert.equal(determinePostCardRoute(post), 'FeedVideoPlayer');
});

// Case B: Video post with media: [{ media_type: 'video', storage_url: '...' }]
test('Case B: Video post with media array video item -> isVideoPost=true, resolves storage_url, routes FeedVideoPlayer', () => {
  const post = {
    id: 'case-b',
    type: 'post',
    video_url: null,
    thumbnail_url: 'https://res.cloudinary.com/cpa/image/upload/v1/poster_b.jpg',
    media: [
      { id: 'm1', media_type: 'video', storage_url: 'https://cdn.cpa.in/videos/b_lesson.mp4' }
    ],
    files: [],
  };
  assert.equal(isVideoPost(post), true, 'isVideoPost should be true');
  assert.equal(resolveFeedVideoUrl(post), 'https://cdn.cpa.in/videos/b_lesson.mp4');
  assert.equal(determinePostCardRoute(post), 'FeedVideoPlayer');
});

// Case C: Multi-media post with files: [{ file_type: 'image/png', url: 'img.png' }, { file_type: 'video/mp4', url: 'vid.mp4' }]
test('Case C: Multi-media post with files [image, video] -> isVideoPost=true, resolves video file (never image)', () => {
  const post = {
    id: 'case-c',
    type: 'post',
    video_url: null,
    files: [
      { file_type: 'image/png', url: 'https://cdn.cpa.in/img_c.png' },
      { file_type: 'video/mp4', url: 'https://cdn.cpa.in/vid_c.mp4' },
    ],
  };
  assert.equal(isVideoPost(post), true, 'isVideoPost should be true');
  assert.equal(resolveFeedVideoUrl(post), 'https://cdn.cpa.in/vid_c.mp4');
  assert.notEqual(resolveFeedVideoUrl(post), 'https://cdn.cpa.in/img_c.png');
  assert.equal(determinePostCardRoute(post), 'FeedVideoPlayer');
});

// Case D: Image-only post with files: [{ file_type: 'image/jpeg', url: 'img1.jpg' }, { file_type: 'image/png', url: 'img2.png' }]
test('Case D: Image-only post with files -> isVideoPost=false, routes DocumentCarousel, extractAllPostMedia returns 2 items', () => {
  const post = {
    id: 'case-d',
    type: 'post',
    video_url: null,
    files: [
      { file_type: 'image/jpeg', url: 'https://cdn.cpa.in/img1.jpg' },
      { file_type: 'image/png', url: 'https://cdn.cpa.in/img2.png' },
    ],
  };
  assert.equal(isVideoPost(post), false, 'isVideoPost should be false for image-only post');
  assert.equal(resolveFeedVideoUrl(post), null, 'resolveFeedVideoUrl should be null');
  assert.equal(determinePostCardRoute(post), 'DocumentCarousel');
  const media = extractAllPostMedia(post);
  assert.equal(media.length, 2);
  assert.equal(media[0].storage_url, 'https://cdn.cpa.in/img1.jpg');
  assert.equal(media[1].storage_url, 'https://cdn.cpa.in/img2.png');
});

// Case E: Legacy post with empty media arrays and thumbnail_url
test('Case E: Legacy post with empty media arrays -> isVideoPost=false, extractAllPostMedia falls back to 1 thumbnail item', () => {
  const post = {
    id: 'case-e',
    type: 'post',
    video_url: null,
    thumbnail_url: 'https://res.cloudinary.com/demo/image/upload/sample_legacy.jpg',
    media: [],
    files: [],
  };
  assert.equal(isVideoPost(post), false, 'isVideoPost should be false');
  assert.equal(resolveFeedVideoUrl(post), null);
  assert.equal(determinePostCardRoute(post), 'DocumentCarousel');
  const media = extractAllPostMedia(post);
  assert.equal(media.length, 1);
  assert.equal(media[0].storage_url, 'https://res.cloudinary.com/demo/image/upload/sample_legacy.jpg');
});

// Case F: Document post with files: [{ file_type: 'application/pdf', url: 'doc.pdf' }]
test('Case F: Document post with PDF -> isVideoPost=false, routes DocumentCarousel with 1 document item', () => {
  const post = {
    id: 'case-f',
    type: 'document',
    video_url: null,
    files: [
      { file_type: 'application/pdf', url: 'https://cdn.cpa.in/docs/syllabus_f.pdf' }
    ],
  };
  assert.equal(isVideoPost(post), false, 'isVideoPost should be false');
  assert.equal(resolveFeedVideoUrl(post), null);
  assert.equal(determinePostCardRoute(post), 'DocumentCarousel');
  const media = extractAllPostMedia(post);
  assert.equal(media.length, 1);
  assert.equal(media[0].storage_url, 'https://cdn.cpa.in/docs/syllabus_f.pdf');
});

// Case G: REST post with snake_case and camelCase mixed fields
test('Case G: REST post with mixed snake_case and camelCase fields extracts cleanly', () => {
  const post = {
    id: 'case-g',
    type: 'post',
    mediaUrls: 'https://cdn.cpa.in/g1.jpg, https://cdn.cpa.in/g2.jpg, https://cdn.cpa.in/g3.jpg',
    aspect_ratio: '4:5',
    dominant_color: '#1a1a1a',
  };
  assert.equal(isVideoPost(post), false);
  assert.equal(determinePostCardRoute(post), 'DocumentCarousel');
  const media = extractAllPostMedia(post);
  assert.equal(media.length, 3);
  assert.equal(media[0].aspect_ratio, '4:5');
  assert.equal(media[1].aspect_ratio, '4:5');
  assert.equal(media[2].aspect_ratio, '4:5');
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: ADVERSARIAL STRESS CASES
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Section 5: Adversarial Stress Testing ---');

test('Stress H: Multi-image post with 5 images & duplicate URLs deduplicates properly', () => {
  const post = {
    id: 'stress-h',
    type: 'post',
    media: [
      { media_url: 'https://cdn.cpa.in/img1.jpg', media_type: 'image' },
      { media_url: 'https://cdn.cpa.in/img2.jpg', media_type: 'image' },
      { media_url: 'https://cdn.cpa.in/img3.jpg', media_type: 'image' },
      { media_url: 'https://cdn.cpa.in/img4.jpg', media_type: 'image' },
      { media_url: 'https://cdn.cpa.in/img5.jpg', media_type: 'image' },
      { media_url: 'https://cdn.cpa.in/img1.jpg', media_type: 'image' }, // duplicate 1
      { media_url: 'https://cdn.cpa.in/img3.jpg', media_type: 'image' }, // duplicate 2
    ],
  };
  assert.equal(isVideoPost(post), false);
  assert.equal(determinePostCardRoute(post), 'DocumentCarousel');
  const media = extractAllPostMedia(post);
  assert.equal(media.length, 5, 'Must have exactly 5 deduplicated images');
});

test('Stress I: Signed video URL with complex query parameters is detected and preserved', () => {
  const signedUrl = 'https://cdn.cpa.in/secured/video.mp4?X-Amz-Signature=abc12345&X-Amz-Expires=86400&token=xyz';
  const post = {
    id: 'stress-i',
    video_url: signedUrl,
  };
  assert.equal(isVideoPost(post), true);
  assert.equal(resolveFeedVideoUrl(post), signedUrl);
  assert.equal(determinePostCardRoute(post), 'FeedVideoPlayer');
});

test('Stress J: Postgres JSONB text serialized string in media column is parsed and extracted', () => {
  const post = {
    id: 'stress-j',
    media: JSON.stringify([
      { storage_url: 'https://cdn.cpa.in/slide1.jpg' },
      { storage_url: 'https://cdn.cpa.in/slide2.jpg' },
    ]),
  };
  const media = extractAllPostMedia(post);
  assert.equal(media.length, 2);
  assert.equal(media[0].storage_url, 'https://cdn.cpa.in/slide1.jpg');
});

test('Stress K: Markdown embedded image in caption is extracted when no media array', () => {
  const post = {
    id: 'stress-k',
    description: 'Post explanation with diagram: ![Diagram](https://cdn.cpa.in/inline_diagram.png)',
  };
  const media = extractAllPostMedia(post);
  assert.equal(media.length, 1);
  assert.equal(media[0].storage_url, 'https://cdn.cpa.in/inline_diagram.png');
});

test('Stress L: Video resolution hierarchy priority check', () => {
  const postWithAll = {
    id: 'stress-l',
    video_url: 'https://cdn.cpa.in/primary.mp4',
    media: [{ media_type: 'video', media_url: 'https://cdn.cpa.in/secondary.mp4' }],
    files: [{ file_type: 'video/mp4', url: 'https://cdn.cpa.in/tertiary.mp4' }],
  };
  assert.equal(resolveFeedVideoUrl(postWithAll), 'https://cdn.cpa.in/primary.mp4');

  const postWithoutVideoUrl = {
    id: 'stress-l2',
    video_url: null,
    media: [{ media_type: 'video', media_url: 'https://cdn.cpa.in/secondary.mp4' }],
    files: [{ file_type: 'video/mp4', url: 'https://cdn.cpa.in/tertiary.mp4' }],
  };
  assert.equal(resolveFeedVideoUrl(postWithoutVideoUrl), 'https://cdn.cpa.in/secondary.mp4');
});

test('Stress M: Post with only audio files does not falsely activate isVideoPost', () => {
  const post = {
    id: 'stress-m',
    type: 'post',
    files: [
      { file_type: 'audio/mp3', url: 'https://cdn.cpa.in/audio/speech.mp3' }
    ]
  };
  assert.equal(isVideoPost(post), false);
  assert.equal(resolveFeedVideoUrl(post), null);
  assert.equal(determinePostCardRoute(post), 'DocumentCarousel');
});

test('Stress N: Empty, null, and malformed post inputs do not crash', () => {
  assert.equal(isVideoPost({}), false);
  assert.equal(isVideoPost(null), false);
  assert.equal(resolveFeedVideoUrl({}), null);
  assert.equal(resolveFeedVideoUrl(null), null);
  assert.equal(extractAllPostMedia(null).length, 0);
  assert.equal(extractAllPostMedia({}).length, 0);
  assert.equal(determinePostCardRoute({}), 'NoMedia');
  assert.equal(determinePostCardRoute(null), 'NoMedia');
});

test('Stress O: Post with files [image, video] selects video (index 1), NEVER image (index 0)', () => {
  const post = {
    id: 'case-o',
    type: 'post',
    files: [
      { file_type: 'image/jpeg', storage_url: 'https://cdn.cpa.in/cover.jpg' },
      { file_type: 'video/mp4', storage_url: 'https://cdn.cpa.in/clip.mp4' }
    ]
  };
  assert.equal(isVideoPost(post), true);
  assert.equal(resolveFeedVideoUrl(post), 'https://cdn.cpa.in/clip.mp4');
  assert.notEqual(resolveFeedVideoUrl(post), 'https://cdn.cpa.in/cover.jpg');
});

test('Case P: Modern 6-image post with post_media array -> isVideoPost=false, routes DocumentCarousel, extractAllPostMedia returns 6 distinct items', () => {
  const post = {
    id: '1aee9b59-c24b-47b3-b081-a15d40b60274',
    type: 'carousel',
    thumbnail_url: 'https://cpacontentstream.s3.ap-south-1.amazonaws.com/uploads/posts/instagram/8b00cb76/1788235981841-ud9ovv.webp',
    media: [
      { id: 'm0', media_url: 'https://cpacontentstream.s3.ap-south-1.amazonaws.com/uploads/posts/instagram/8b00cb76/1788235981841-ud9ovv.webp', media_type: 'image', sort_order: 0 },
      { id: 'm1', media_url: 'https://cpacontentstream.s3.ap-south-1.amazonaws.com/uploads/posts/instagram/8b00cb76/1788235983408-etom0v.webp', media_type: 'image', sort_order: 1 },
      { id: 'm2', media_url: 'https://cpacontentstream.s3.ap-south-1.amazonaws.com/uploads/posts/instagram/8b00cb76/1788235984855-a6po9l.webp', media_type: 'image', sort_order: 2 },
      { id: 'm3', media_url: 'https://cpacontentstream.s3.ap-south-1.amazonaws.com/uploads/posts/instagram/8b00cb76/1788235986300-s7qo82.webp', media_type: 'image', sort_order: 3 },
      { id: 'm4', media_url: 'https://cpacontentstream.s3.ap-south-1.amazonaws.com/uploads/posts/instagram/8b00cb76/1788235987724-ddnjt7.webp', media_type: 'image', sort_order: 4 },
      { id: 'm5', media_url: 'https://cpacontentstream.s3.ap-south-1.amazonaws.com/uploads/posts/instagram/8b00cb76/1788235989269-ea0fnc.webp', media_type: 'image', sort_order: 5 },
    ],
    files: []
  };

  assert.equal(isVideoPost(post), false, 'isVideoPost should be false');
  assert.equal(resolveFeedVideoUrl(post), null, 'resolveFeedVideoUrl should be null');
  assert.equal(determinePostCardRoute(post), 'DocumentCarousel', 'Should route to DocumentCarousel');

  const media = extractAllPostMedia(post);
  assert.equal(media.length, 6, 'Should extract all 6 items without collapsing');
  assert.equal(media[0].storage_url, 'https://cpacontentstream.s3.ap-south-1.amazonaws.com/uploads/posts/instagram/8b00cb76/1788235981841-ud9ovv.webp');
  assert.equal(media[5].storage_url, 'https://cpacontentstream.s3.ap-south-1.amazonaws.com/uploads/posts/instagram/8b00cb76/1788235989269-ea0fnc.webp');
});

console.log('\n=======================================================');
console.log(`  EMPIRICAL TEST SUMMARY: ${passed} PASSED, ${failed} FAILED  `);
console.log('=======================================================\n');

if (failed > 0) {
  process.exit(1);
}
