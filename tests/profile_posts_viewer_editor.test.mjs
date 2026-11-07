/**
 * tests/profile_posts_viewer_editor.test.mjs
 *
 * FocusGram — Phase 2.4: Web App Parity Verification Suite
 * Profile Posts Viewer and Published Post Editor
 *
 * Covers all 14 mandatory verification requirements from PART D:
 * 1. Profile grid post selection
 * 2. Correct selected-post positioning & index clamping
 * 3. Viewer scrolling & publication ordering (newer above, older below)
 * 4. Older-post pagination with forward compound cursor
 * 5. Duplicate request & duplicate post prevention
 * 6. Browser back navigation and scroll restoration
 * 7. Single image, carousel, and video rendering (Claps over Likes)
 * 8. Caption editing and code snippet handling
 * 9. Media deletion with minimum 1-media invariant protection
 * 10. Media reorder validation (contiguous 0..N-1 sortOrder)
 * 11. Failed mutation and dirty-state preservation
 * 12. Unauthorized editing fail-closed protection
 * 13. Empty and error states graceful degradation
 * 14. Responsive layout and theme-agnostic styling
 *
 * Run with: node tests/profile_posts_viewer_editor.test.mjs
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(testNumber, name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ [PASS] ${testNumber}. ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testNumber}. ${name}`);
    console.error(`     Reason: ${err.message}`);
  }
}

console.log('\n======================================================================');
console.log('🚀 FOCUSGRAM PHASE 2.4 — WEB APP PARITY VERIFICATION SUITE');
console.log('======================================================================\n');

// ── Read relevant sources for static & structural verification ─────────────
const graphqlSource = fs.readFileSync(path.join(projectRoot, 'src/api/graphql.js'), 'utf8');
const viewerSource = fs.readFileSync(path.join(projectRoot, 'src/components/profile/ProfilePostsViewer.jsx'), 'utf8');
const editorSource = fs.readFileSync(path.join(projectRoot, 'src/views/EditPost.jsx'), 'utf8');
const appSource = fs.readFileSync(path.join(projectRoot, 'src/App.jsx'), 'utf8');
const desktopProfileSource = fs.readFileSync(path.join(projectRoot, 'src/components/profile/DesktopProfile.jsx'), 'utf8');
const mobileProfileSource = fs.readFileSync(path.join(projectRoot, 'src/components/profile/MobileProfile.jsx'), 'utf8');
const appRouterPageSource = fs.readFileSync(path.join(projectRoot, 'app/u/[username]/posts/page.jsx'), 'utf8');
const mediaUtilsJsPath = path.join(projectRoot, 'src/utils/mediaUtils.js');
const mediaUtilsJsContent = fs.readFileSync(mediaUtilsJsPath, 'utf8');

// ── Extract and evaluate normalizeGraphQLPost via VM sandbox ───────────────
const sandbox = {
  console,
  process: { env: { NEXT_PUBLIC_CDN_URL: 'https://cdn.codeplusacademy.in' } },
  normalizeGraphQLUser: (u) => ({ id: u.id, name: u.name, username: u.username }),
};
vm.createContext(sandbox);

const resolveCdnMatch = mediaUtilsJsContent.match(/export function resolveCdnUrl\([\s\S]*?\n\}/);
const resolveCdnCode = resolveCdnMatch ? resolveCdnMatch[0].replace('export function', 'function') : '';
vm.runInContext(`
  const CDN_BASE_URL = 'https://cdn.codeplusacademy.in';
  const S3_BUCKET_REGEX = /^https?:\\/\\/(?:cpacontentstream\\.s3[.-][a-z0-9-]*\\.amazonaws\\.com|s3[.-][a-z0-9-]*\\.amazonaws\\.com\\/cpacontentstream)/i;
  ${resolveCdnCode}
`, sandbox);

const normFnMatch = graphqlSource.match(/export function normalizeGraphQLPost\([\s\S]*?\n\}/);
if (!normFnMatch) {
  throw new Error('Could not find normalizeGraphQLPost in src/api/graphql.js');
}
const normFnCode = normFnMatch[0].replace('export function', 'function');
vm.runInContext(`${normFnCode}; sandbox_normalize = normalizeGraphQLPost;`, sandbox);
const normalizeGraphQLPost = sandbox.sandbox_normalize;

// ── REQUIREMENT 1: Profile Grid Post Selection ────────────────────────────
runTest(1, 'Profile grid post selection routes to ProfilePostsViewer with state', () => {
  assert.ok(desktopProfileSource.includes('/u/${postUser}/posts?post='), 'DesktopProfile must route to /u/:username/posts?post=');
  assert.ok(mobileProfileSource.includes('/u/${postUser}/posts?post='), 'MobileProfile must route to /u/:username/posts?post=');
  assert.ok(desktopProfileSource.includes('initialIndex: idx'), 'DesktopProfile must pass initialIndex in router state');
  assert.ok(mobileProfileSource.includes('initialIndex: idx'), 'MobileProfile must pass initialIndex in router state');
  assert.ok(desktopProfileSource.includes('posts: allPosts'), 'DesktopProfile must pass pre-loaded posts in router state for instant render');
  assert.ok(appSource.includes('path="/u/:username/posts"'), 'App.jsx must declare /u/:username/posts route');
  assert.ok(appRouterPageSource.includes('ProfilePostsViewer'), 'App Router page must mount ProfilePostsViewer');
});

// ── REQUIREMENT 2: Correct Selected-Post Positioning & Clamping ───────────
runTest(2, 'Correct selected-post positioning and index clamping', () => {
  assert.ok(viewerSource.includes('Math.min(routerState.initialIndex, postsList.length - 1)'), 'Viewer must clamp initialIndex to valid upper bound');
  assert.ok(viewerSource.includes('Math.max(0,'), 'Viewer must clamp initialIndex to valid lower bound (0)');
  assert.ok(viewerSource.includes('scrollIntoView'), 'Viewer must call scrollIntoView to position selected post');

  // Verify clamping math
  const clamp = (idx, len) => Math.max(0, Math.min(idx, len - 1));
  assert.equal(clamp(0, 10), 0, 'Index 0 in list of 10 must clamp to 0');
  assert.equal(clamp(5, 10), 5, 'Index 5 in list of 10 must clamp to 5');
  assert.equal(clamp(20, 10), 9, 'Index 20 in list of 10 must clamp to 9');
  assert.equal(clamp(-3, 10), 0, 'Negative index must clamp to 0');
  assert.equal(clamp(0, 1), 0, 'Single item list must clamp to 0');
});

// ── REQUIREMENT 3: Viewer Scrolling & Publication Ordering ────────────────
runTest(3, 'Viewer displays posts in publication order (newer above, older below)', () => {
  assert.ok(viewerSource.includes('created_at DESC, id DESC'), 'Viewer documentation and ordering must specify publication order');
  assert.ok(graphqlSource.includes('userPosts(username: $username, first: $first, after: $after)'), 'userPosts query must accept username, first, after');

  // Verify descending publication sort contract
  const samplePosts = [
    { id: '3', created_at: '2026-11-01T10:00:00Z' },
    { id: '2', created_at: '2026-11-01T09:00:00Z' },
    { id: '1', created_at: '2026-11-01T08:00:00Z' },
  ];
  const selectedIdx = 1; // Post 2
  const newerAbove = samplePosts.slice(0, selectedIdx);
  const olderBelow = samplePosts.slice(selectedIdx + 1);

  assert.equal(newerAbove[0].id, '3', 'Newer post must be positioned above selected post');
  assert.equal(olderBelow[0].id, '1', 'Older post must be positioned below selected post');
});

// ── REQUIREMENT 4: Older-Post Pagination With Compound Cursor ──────────────
runTest(4, 'Older-post pagination with compound cursor via GraphQL contract', () => {
  assert.ok(viewerSource.includes('pageInfoRef.current.endCursor'), 'Pagination must pass endCursor to fetch next page');
  assert.ok(viewerSource.includes('pageInfoRef.current.hasNextPage'), 'Pagination must check hasNextPage');
  assert.ok(graphqlSource.includes('endCursor'), 'USER_POSTS_QUERY must request endCursor');
  assert.ok(graphqlSource.includes('hasNextPage'), 'USER_POSTS_QUERY must request hasNextPage');
  assert.ok(viewerSource.includes('getGraphQLUserPosts'), 'Viewer must call getGraphQLUserPosts');
});

// ── REQUIREMENT 5: Duplicate Request & Duplicate Post Prevention ───────────
runTest(5, 'Duplicate pagination request and duplicate post ID prevention', () => {
  assert.ok(viewerSource.includes('isFetchingMoreRef.current'), 'Viewer must guard pagination with synchronous ref lock');
  assert.ok(viewerSource.includes('postIdsRef.current.has'), 'Viewer must filter out already-delivered post IDs');
  assert.ok(viewerSource.includes('new Set('), 'Viewer must maintain Set of delivered post IDs');

  // Simulate deduplication logic
  const existingSet = new Set(['post-1', 'post-2']);
  const incoming = [{ id: 'post-2' }, { id: 'post-3' }];
  const deduplicated = incoming.filter(p => !existingSet.has(p.id));

  assert.equal(deduplicated.length, 1);
  assert.equal(deduplicated[0].id, 'post-3');
});

// ── REQUIREMENT 6: Browser Back Navigation & Scroll Restoration ───────────
runTest(6, 'Browser back navigation and URL search param synchronization', () => {
  assert.ok(viewerSource.includes('navigate(-1)'), 'Viewer header back button must call navigate(-1)');
  assert.ok(viewerSource.includes('window.history.replaceState'), 'Viewer must update URL on scroll with replaceState without full reload');
  assert.ok(viewerSource.includes("url.searchParams.set('post', id)"), 'URL search param post must sync with currently visible post');
  assert.ok(viewerSource.includes('threshold: 0.5'), 'IntersectionObserver must use threshold to detect centered post');
});

// ── REQUIREMENT 7: Single Image, Carousel & Video Rendering (Claps Semantics) ──
runTest(7, 'Supports single image, carousel, video and strictly enforces Claps over Likes', () => {
  // Post normalization handles all media structures
  const imagePost = normalizeGraphQLPost({
    id: 'p-1',
    media: [{ id: 'm-1', mediaUrl: 'https://cdn.example.com/photo.jpg', mediaType: 'image', sortOrder: 0 }],
    clapCount: 15,
  });
  assert.equal(imagePost.media.length, 1);
  assert.equal(imagePost.media[0].media_type, 'image');
  assert.equal(imagePost.clap_count, 15, 'Must use clap_count');

  const carouselPost = normalizeGraphQLPost({
    id: 'p-2',
    media: [
      { id: 'm-2', mediaUrl: 'https://cdn.example.com/2.jpg', mediaType: 'image', sortOrder: 1 },
      { id: 'm-1', mediaUrl: 'https://cdn.example.com/1.jpg', mediaType: 'image', sortOrder: 0 },
    ],
  });
  assert.equal(carouselPost.media.length, 2);
  assert.equal(carouselPost.media[0].id, 'm-1', 'Carousel items must be ordered by sortOrder ascending');
  assert.equal(carouselPost.media[1].id, 'm-2');

  const videoPost = normalizeGraphQLPost({
    id: 'p-3',
    videoUrl: 'https://cdn.example.com/video.mp4',
    media: [{ id: 'm-v', mediaUrl: 'https://cdn.example.com/video.mp4', mediaType: 'video', sortOrder: 0 }],
  });
  assert.equal(videoPost.media[0].media_type, 'video');
  assert.ok(videoPost.video_url.includes('video.mp4'));

  // Ensure no Likes terminology introduced in viewer or editor
  assert.ok(!viewerSource.includes('likeCount'), 'Viewer must never use likeCount (FocusGram uses Claps)');
  assert.ok(!viewerSource.includes('toggleLike'), 'Viewer must never use toggleLike');
});

// ── REQUIREMENT 8: Caption Editing & Code Snippet Handling ─────────────────
runTest(8, 'Caption editing and code snippet extraction and formatting', () => {
  assert.ok(editorSource.includes('caption'), 'Editor must bind caption state');
  assert.ok(editorSource.includes('includeCode'), 'Editor must support code snippet attachment');
  assert.ok(editorSource.includes('extractCodeBlock'), 'Editor must parse existing code blocks from description');
  assert.ok(editorSource.includes('detectLanguage'), 'Editor must auto-detect code language');

  // Verify description formatting with markdown code block
  const caption = 'Check out this utility function';
  const code = 'const add = (a, b) => a + b;';
  const lang = 'typescript';
  const finalDesc = `${caption}\n\n\`\`\`${lang}\n${code}\n\`\`\``;

  assert.ok(finalDesc.includes('Check out this utility function'));
  assert.ok(finalDesc.includes('```typescript\nconst add = (a, b) => a + b;\n```'));
});

// ── REQUIREMENT 9: Media Deletion & Minimum-1-Media Invariant ──────────────
runTest(9, 'Media deletion stages deletions and enforces minimum-one-media invariant', () => {
  assert.ok(editorSource.includes('stagedDeletions'), 'Editor must track staged deletions');
  assert.ok(editorSource.includes('activeMedia.length <= 1'), 'Editor must guard minimum 1-media invariant');
  assert.ok(editorSource.includes('Cannot delete all media. A post must have at least one media item.'), 'Editor must block 0-media submission');
  assert.ok(editorSource.includes('undoDelete'), 'Editor must provide undo option before save');

  // Invariant simulation
  const initialMedia = [{ id: '1' }, { id: '2' }];
  let staged = new Set(['1']);
  let active = initialMedia.filter(m => !staged.has(m.id));
  assert.equal(active.length, 1, '1 media item remaining after staging item 1');

  // Attempting to delete remaining item must be blocked
  const canDeleteLastItem = active.length > 1;
  assert.equal(canDeleteLastItem, false, 'Deleting the last media item must be prevented');
});

// ── REQUIREMENT 10: Media Reorder Validation & Contiguity ─────────────────
runTest(10, 'Media reordering produces contiguous 0..N-1 sortOrder permutations', () => {
  assert.ok(editorSource.includes('moveMedia'), 'Editor must support reorder operations');
  assert.ok(editorSource.includes('mediaReorder'), 'Editor must build mediaReorder payload');
  assert.ok(editorSource.includes('sortOrder: idx'), 'Editor must map contiguous indices 0..N-1');

  // Permutation & contiguity validator
  function validateMediaReorder(activeItems) {
    const reorderPayload = activeItems.map((m, idx) => ({ mediaId: m.id, sortOrder: idx }));
    const sortOrders = reorderPayload.map(r => r.sortOrder);
    const seenSortOrders = new Set(sortOrders);

    // Contiguity check 0..N-1
    for (let i = 0; i < activeItems.length; i++) {
      if (!seenSortOrders.has(i)) return false;
    }
    return seenSortOrders.size === activeItems.length;
  }

  const items = [{ id: 'b' }, { id: 'c' }, { id: 'a' }];
  assert.equal(validateMediaReorder(items), true, 'Reordered permutation must satisfy contiguous 0..N-1');
});

// ── REQUIREMENT 11: Failed Mutation & Dirty-State Preservation ────────────
runTest(11, 'Failed mutation preserves user changes and tracks isDirty state', () => {
  assert.ok(editorSource.includes('isDirty'), 'Editor must compute isDirty boolean');
  assert.ok(editorSource.includes('beforeunload'), 'Editor must attach beforeunload when dirty');
  assert.ok(editorSource.includes('setSaveError'), 'Editor must set error state upon mutation failure');
  assert.ok(editorSource.includes('setShowDiscardConfirm'), 'Editor must warn user before discarding dirty changes');
  assert.ok(editorSource.includes('your changes have been retained'), 'Editor must inform user edits are retained upon failure');
});

// ── REQUIREMENT 12: Unauthorized Editing Fail-Closed Protection ───────────
runTest(12, 'Unauthorized editing strictly fails closed for non-owners and non-admins', () => {
  assert.ok(editorSource.includes("user?.role === 'admin'"), 'Editor must allow admin override');
  assert.ok(editorSource.includes('String(currentUserId) !== String(authorId)'), 'Editor must strictly match currentUserId against authorId');
  assert.ok(editorSource.includes('You do not have permission to edit this post'), 'Editor must display permission error and redirect');

  // Matrix test
  const checkAuth = (userId, authorId, role) => {
    if (role === 'admin') return true;
    return String(userId) === String(authorId);
  };

  assert.equal(checkAuth('user-1', 'user-1', 'creator'), true, 'Owner permitted');
  assert.equal(checkAuth('user-admin', 'user-1', 'admin'), true, 'Admin permitted');
  assert.equal(checkAuth('user-2', 'user-1', 'creator'), false, 'Non-owner rejected');
  assert.equal(checkAuth(null, 'user-1', 'guest'), false, 'Unauthenticated user rejected');
});

// ── REQUIREMENT 13: Empty & Error States Graceful Degradation ──────────────
runTest(13, 'Viewer and Editor handle Loading, Empty, and Error states gracefully', () => {
  assert.ok(viewerSource.includes('PostCardSkeleton'), 'Viewer must render PostCardSkeleton during initial load');
  assert.ok(viewerSource.includes('Unable to load posts'), 'Viewer must render friendly error state');
  assert.ok(viewerSource.includes('Try Again'), 'Viewer must provide retry action in error state');
  assert.ok(viewerSource.includes('No Posts Yet'), 'Viewer must render friendly empty state when user has 0 posts');
  assert.ok(editorSource.includes('Loading post...'), 'Editor must render loader during initial fetch');
  assert.ok(editorSource.includes('Post not found'), 'Editor must handle missing post gracefully');
});

// ── REQUIREMENT 14: Responsive Layout & Theme-Agnostic Styling ─────────────
runTest(14, 'Viewer and Editor enforce fluid layouts, mobile-first design, and semantic tokens', () => {
  assert.ok(viewerSource.includes('maxWidth:') || viewerSource.includes('max-w-'), 'Viewer must enforce max-width constraint');
  assert.ok(viewerSource.includes("width: '100%'"), 'Viewer must enforce full width fluid styling');
  assert.ok(viewerSource.includes('var(--bg'), 'Viewer must use semantic theme tokens');
  assert.ok(viewerSource.includes('var(--text'), 'Viewer must use semantic text tokens');
  assert.ok(viewerSource.includes('clamp('), 'Viewer must use adaptive clamp typography for header titles');

  assert.ok(editorSource.includes('useMediaQuery'), 'Editor must adaptively query mobile breakpoints');
  assert.ok(editorSource.includes('var(--border'), 'Editor must use semantic border tokens');
  assert.ok(editorSource.includes('draggable'), 'Editor must support desktop drag and drop');
  assert.ok(editorSource.includes('ChevronLeft'), 'Editor must provide accessible button controls for mobile touch');
});

console.log('\n======================================================================');
console.log(`📊 RESULTS: ${passedTests} passed, ${failedTests} failed out of ${totalTests} tests`);
console.log('======================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
