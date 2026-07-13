/**
 * extractArticleMetadata.test.js
 *
 * Unit tests for extractArticleMetadata().
 * Uses Node.js built-in `assert` — no test framework required.
 *
 * Run with:
 *   node src/lib/seo/extractArticleMetadata.test.js
 *
 * Exit code 0 = all passed, non-zero = failure.
 */

import assert from 'node:assert/strict';
import { extractArticleMetadata } from './extractArticleMetadata.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log(`  ✅ ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${label}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

console.log('\n🧪 extractArticleMetadata tests\n');

// ── 1. Normal case: hero subtitle + hero image ─────────────────────────────
test('returns hero subtitle as description when present and not placeholder', () => {
  const article = {
    title: 'React vs Next.js',
    meta: {},
    content_blocks: [
      {
        id: 'b1', type: 'hero', order: 0,
        data: {
          title: 'React vs Next.js',
          subtitle: 'A practical comparison of Vite-React and Next.js for production apps.',
          category: 'Article',
          tags: ['react', 'nextjs'],
          imageUrl: 'https://cdn.cpa.in/hero.jpg',
        },
      },
    ],
  };
  const result = extractArticleMetadata(article);
  assert.equal(result.description, 'A practical comparison of Vite-React and Next.js for production apps.');
  assert.equal(result.ogImageUrl, 'https://cdn.cpa.in/hero.jpg');
  assert.equal(result.isPlaceholder, false);
});

// ── 2. Placeholder subtitle is skipped, falls through to rich_text ─────────
test('skips placeholder subtitle and uses rich_text content instead', () => {
  const article = {
    title: 'My Article',
    meta: {},
    content_blocks: [
      {
        id: 'b1', type: 'hero', order: 0,
        data: {
          subtitle: 'General purpose long-form editorial article.',
        },
      },
      {
        id: 'b2', type: 'rich_text', order: 1,
        data: { content: 'Node.js makes building servers easy with its event-driven architecture.' },
      },
    ],
  };
  const result = extractArticleMetadata(article);
  assert.equal(result.description, 'Node.js makes building servers easy with its event-driven architecture.');
  assert.equal(result.isPlaceholder, false);
});

// ── 3. Empty content_blocks → falls back to title ─────────────────────────
test('returns article title with isPlaceholder=true when content_blocks is empty', () => {
  const article = {
    title: 'My Draft Article',
    meta: {},
    content_blocks: [],
  };
  const result = extractArticleMetadata(article);
  assert.equal(result.description, 'My Draft Article');
  assert.equal(result.ogImageUrl, null);
  assert.equal(result.isPlaceholder, true);
});

// ── 4. Missing content_blocks → falls back to title ────────────────────────
test('handles missing content_blocks gracefully', () => {
  const article = { title: 'Article Without Blocks', meta: {} };
  const result = extractArticleMetadata(article);
  assert.equal(result.description, 'Article Without Blocks');
  assert.equal(result.isPlaceholder, true);
});

// ── 5. HTML-laden rich_text is stripped cleanly ────────────────────────────
test('strips HTML tags and entities from rich_text content', () => {
  const article = {
    title: 'Test',
    meta: {},
    content_blocks: [
      {
        id: 'b1', type: 'hero', order: 0,
        data: { subtitle: '' },
      },
      {
        id: 'b2', type: 'rich_text', order: 1,
        data: {
          content: '<p>This is a <strong>bold</strong> statement about <em>React&amp;Node</em>. ' +
                   '<a href="https://example.com">Click here</a> to learn more.</p>',
        },
      },
    ],
  };
  const result = extractArticleMetadata(article);
  assert.equal(result.description, 'This is a bold statement about React&Node. Click here to learn more.');
  assert.equal(result.isPlaceholder, false);
});

// ── 6. Description truncated to 155 chars at word boundary ─────────────────
test('truncates description at 155 chars at a word boundary and appends ellipsis', () => {
  const longSubtitle = 'This is a very long subtitle that goes well beyond one hundred and fifty five characters in total length and should be truncated properly at a word boundary without cutting any word in half.';
  const article = {
    title: 'Long Article',
    meta: {},
    content_blocks: [
      { id: 'b1', type: 'hero', order: 0, data: { subtitle: longSubtitle } },
    ],
  };
  const result = extractArticleMetadata(article);
  assert.ok(result.description.length <= 156, `length ${result.description.length} should be ≤ 156 (155 + ellipsis char)`);
  assert.ok(result.description.endsWith('…'), 'should end with ellipsis');
  // Must not cut mid-word — last char before ellipsis must not be in the middle of a word
  const withoutEllipsis = result.description.slice(0, -1);
  assert.ok(!withoutEllipsis.endsWith(' '), 'should not end with trailing space before ellipsis');
});

// ── 7. Short description is NOT truncated (no ellipsis added) ──────────────
test('does not truncate or append ellipsis when description is ≤ 155 chars', () => {
  const article = {
    title: 'Short',
    meta: {},
    content_blocks: [
      { id: 'b1', type: 'hero', order: 0, data: { subtitle: 'Short subtitle.' } },
    ],
  };
  const result = extractArticleMetadata(article);
  assert.equal(result.description, 'Short subtitle.');
  assert.ok(!result.description.endsWith('…'));
});

// ── 8. hero.data.backgroundImageUrl used as fallback image ─────────────────
test('uses hero.data.backgroundImageUrl when imageUrl is absent', () => {
  const article = {
    title: 'Test',
    meta: {},
    content_blocks: [
      {
        id: 'b1', type: 'hero', order: 0,
        data: {
          subtitle: 'Real content here.',
          backgroundImageUrl: 'https://cdn.cpa.in/background.jpg',
          // no imageUrl
        },
      },
    ],
  };
  const result = extractArticleMetadata(article);
  assert.equal(result.ogImageUrl, 'https://cdn.cpa.in/background.jpg');
});

// ── 9. image_block.data.url used when no hero image ────────────────────────
test('falls through to image_block.data.url when hero has no image', () => {
  const article = {
    title: 'Test',
    meta: {},
    content_blocks: [
      { id: 'b1', type: 'hero', order: 0, data: { subtitle: 'Content.' } },
      { id: 'b2', type: 'image_block', order: 1, data: { url: 'https://cdn.cpa.in/img.png', caption: 'Caption' } },
    ],
  };
  const result = extractArticleMetadata(article);
  assert.equal(result.ogImageUrl, 'https://cdn.cpa.in/img.png');
});

// ── 10. hero imageUrl takes priority over backgroundImageUrl ────────────────
test('hero.data.imageUrl takes priority over backgroundImageUrl', () => {
  const article = {
    title: 'Test',
    meta: {},
    content_blocks: [
      {
        id: 'b1', type: 'hero', order: 0,
        data: {
          subtitle: 'Content.',
          imageUrl: 'https://cdn.cpa.in/og.jpg',
          backgroundImageUrl: 'https://cdn.cpa.in/bg.jpg',
        },
      },
    ],
  };
  const result = extractArticleMetadata(article);
  assert.equal(result.ogImageUrl, 'https://cdn.cpa.in/og.jpg');
});

// ── 11. Callout body used when hero subtitle and rich_text are empty ────────
test('uses callout.data.body when hero and rich_text are empty', () => {
  const article = {
    title: 'Test',
    meta: {},
    content_blocks: [
      { id: 'b1', type: 'hero', order: 0, data: { subtitle: '' } },
      { id: 'b2', type: 'rich_text', order: 1, data: { content: '' } },
      { id: 'b3', type: 'callout', order: 2, data: { title: 'Tip', body: 'This callout explains an important concept.', icon: '💡' } },
    ],
  };
  const result = extractArticleMetadata(article);
  assert.equal(result.description, 'This callout explains an important concept.');
  assert.equal(result.isPlaceholder, false);
});

// ── 12. content_blocks as JSON string (some API responses) ─────────────────
test('handles content_blocks passed as a JSON string', () => {
  const blocks = JSON.stringify([
    { id: 'b1', type: 'hero', order: 0, data: { subtitle: 'Parsed from JSON string.' } },
  ]);
  const article = { title: 'Test', meta: {}, content_blocks: blocks };
  const result = extractArticleMetadata(article);
  assert.equal(result.description, 'Parsed from JSON string.');
});

// ── 13. All placeholder strings are correctly identified ───────────────────
test('treats all known placeholder strings as non-content', () => {
  const placeholders = [
    'General purpose long-form editorial article.',
    'Curated resources, tools, and reading lists.',
    'GitHub-style repo explanation and usage guide.',
  ];
  for (const ph of placeholders) {
    const article = {
      title: 'Fallback Title',
      meta: {},
      content_blocks: [
        { id: 'b1', type: 'hero', order: 0, data: { subtitle: ph } },
      ],
    };
    const result = extractArticleMetadata(article);
    assert.notEqual(result.description, ph,
      `"${ph}" should have been rejected as a placeholder`);
    assert.equal(result.isPlaceholder, true,
      `isPlaceholder should be true when only placeholder content exists (got "${result.description}")`);
  }
});

// ── 14. Markdown syntax stripped from rich_text ─────────────────────────────
test('strips markdown syntax from rich_text content', () => {
  const article = {
    title: 'Test',
    meta: {},
    content_blocks: [
      {
        id: 'b1', type: 'rich_text', order: 0,
        data: { content: '## Introduction\n\nThis is **important** and _underscored_. `code snippet` and [link](https://x.com).' },
      },
    ],
  };
  const result = extractArticleMetadata(article);
  assert.equal(result.description, 'Introduction This is important and underscored. code snippet and link.');
});

// ── 15. No image anywhere → ogImageUrl is null ─────────────────────────────
test('returns ogImageUrl=null when no image exists anywhere in blocks', () => {
  const article = {
    title: 'Test',
    meta: {},
    content_blocks: [
      { id: 'b1', type: 'hero', order: 0, data: { subtitle: 'Some content.' } },
      { id: 'b2', type: 'rich_text', order: 1, data: { content: 'More content.' } },
    ],
  };
  const result = extractArticleMetadata(article);
  assert.equal(result.ogImageUrl, null);
});

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
