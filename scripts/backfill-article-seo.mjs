#!/usr/bin/env node
/**
 * backfill-article-seo.mjs
 *
 * One-time backfill script — fixes SEO metadata for all published articles
 * that still have placeholder descriptions or missing OG images.
 *
 * Uses the Supabase REST API directly (no @supabase/supabase-js needed).
 * Requires two environment variables:
 *
 *   SUPABASE_URL              e.g. https://dsgfzikehtxuroabenjr.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY your service role secret key (starts with eyJ…)
 *
 * Run:
 *   SUPABASE_URL=https://… SUPABASE_SERVICE_ROLE_KEY=eyJ… node scripts/backfill-article-seo.mjs
 *
 * Or with a .env file:
 *   node --env-file=.env.local scripts/backfill-article-seo.mjs
 *
 * The script NEVER overwrites an existing non-placeholder description.
 * It is safe to run multiple times (idempotent).
 */

import { extractArticleMetadata } from '../src/lib/seo/extractArticleMetadata.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('\n❌  Missing required environment variables:\n');
  if (!SUPABASE_URL)  console.error('   SUPABASE_URL is not set');
  if (!SERVICE_KEY)   console.error('   SUPABASE_SERVICE_ROLE_KEY is not set');
  console.error('\nUsage:\n   SUPABASE_URL=https://… SUPABASE_SERVICE_ROLE_KEY=eyJ… node scripts/backfill-article-seo.mjs\n');
  process.exit(1);
}

// Known placeholder description strings — same list as in extractArticleMetadata.js
const PLACEHOLDER_STRINGS = new Set([
  'General purpose long-form editorial article.',
  'Curated resources, tools, and reading lists.',
  'GitHub-style repo explanation and usage guide.',
  'A standard long-form article.',
  'A curated resource article.',
  'A repository article.',
  'A course overview article.',
]);

function isPlaceholderOrEmpty(str) {
  if (!str || typeof str !== 'string' || str.trim() === '') return true;
  return PLACEHOLDER_STRINGS.has(str.trim());
}

// ---------------------------------------------------------------------------
// Supabase REST helpers (no SDK — pure fetch)
// ---------------------------------------------------------------------------

const HEADERS = {
  'apikey':        SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type':  'application/json',
  'Prefer':        'return=representation',
};

/**
 * Fetch all published articles from Supabase.
 * Uses pagination to handle large tables (1000-row page size).
 */
async function fetchAllPublishedArticles() {
  const PAGE_SIZE = 1000;
  let all = [];
  let offset = 0;

  while (true) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/articles`);
    url.searchParams.set('select', 'id,title,slug,meta,og_image_url,content_blocks,status');
    url.searchParams.set('status', 'eq.published');
    url.searchParams.set('order', 'created_at.asc');
    url.searchParams.set('limit', String(PAGE_SIZE));
    url.searchParams.set('offset', String(offset));

    const res = await fetch(url.toString(), { headers: HEADERS });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Supabase fetch failed (${res.status}): ${body}`);
    }

    const page = await res.json();
    all = all.concat(page);

    if (page.length < PAGE_SIZE) break; // last page
    offset += PAGE_SIZE;
  }

  return all;
}

/**
 * PATCH a single article row — updates meta.description and/or og_image_url.
 * Only sends the fields that need updating.
 */
async function patchArticle(id, updates) {
  const url = `${SUPABASE_URL}/rest/v1/articles?id=eq.${id}`;
  const res = await fetch(url, {
    method:  'PATCH',
    headers: HEADERS,
    body:    JSON.stringify(updates),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PATCH failed for id=${id} (${res.status}): ${body}`);
  }
}

// ---------------------------------------------------------------------------
// Main backfill logic
// ---------------------------------------------------------------------------

async function backfill() {
  console.log('\n🔄  CPA Article SEO Backfill\n');
  console.log(`   Supabase: ${SUPABASE_URL}`);
  console.log(`   Started:  ${new Date().toISOString()}\n`);
  console.log('─'.repeat(60));

  // ── Fetch all published articles ────────────────────────────────────────
  console.log('📥  Fetching published articles…');
  let articles;
  try {
    articles = await fetchAllPublishedArticles();
  } catch (err) {
    console.error(`\n❌  Failed to fetch articles: ${err.message}\n`);
    process.exit(1);
  }
  console.log(`    Found ${articles.length} published articles.\n`);

  // ── Report buckets ───────────────────────────────────────────────────────
  const results = {
    updated:          [],  // description and/or image written
    alreadyOk:        [],  // had real content already, no changes needed
    stillPlaceholder: [],  // no real content found anywhere, needs author work
    stillNoImage:     [],  // updated desc but still no image
    errors:           [],  // patch failed
  };

  // ── Process each article ─────────────────────────────────────────────────
  for (const article of articles) {
    const { id, title, slug, meta = {}, og_image_url } = article;
    const label = `[${slug || id}]`;

    let extracted;
    try {
      extracted = extractArticleMetadata(article);
    } catch (err) {
      console.error(`  ⚠️  ${label} extractArticleMetadata threw: ${err.message}`);
      results.errors.push({ slug, reason: `extract error: ${err.message}` });
      continue;
    }

    const { description: extractedDesc, ogImageUrl: extractedImage, isPlaceholder } = extracted;

    // Decide what to patch
    const updates = {};

    // Description: update only if current value is empty/placeholder
    const currentDesc = meta?.description;
    const shouldUpdateDesc = isPlaceholderOrEmpty(currentDesc) && !isPlaceholder;
    if (shouldUpdateDesc) {
      // Merge into meta jsonb — build updated meta object
      updates.meta = {
        ...meta,
        description: extractedDesc,
      };
    }

    // OG image: update only if currently null and we found something
    const shouldUpdateImage = !og_image_url && extractedImage;
    if (shouldUpdateImage) {
      updates.og_image_url = extractedImage;
    }

    // Nothing to update
    if (Object.keys(updates).length === 0) {
      if (isPlaceholder) {
        results.stillPlaceholder.push({ slug, title });
      } else {
        results.alreadyOk.push({ slug });
      }
      continue;
    }

    // Apply patch
    try {
      await patchArticle(id, updates);

      const parts = [];
      if (shouldUpdateDesc)  parts.push(`desc="${extractedDesc.slice(0, 60)}…"`);
      if (shouldUpdateImage) parts.push(`image="${extractedImage}"`);
      console.log(`  ✅  ${label} → ${parts.join(' + ')}`);

      results.updated.push({ slug, descUpdated: shouldUpdateDesc, imageUpdated: shouldUpdateImage });

      if (!shouldUpdateImage && !og_image_url) {
        results.stillNoImage.push({ slug });
      }
    } catch (err) {
      console.error(`  ❌  ${label} PATCH failed: ${err.message}`);
      results.errors.push({ slug, reason: err.message });
    }
  }

  // ── Final report ─────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  console.log('\n📊  Backfill Report\n');

  console.log(`  ✅  ${results.updated.length} articles updated`);
  console.log(`  ✔️   ${results.alreadyOk.length} articles already had real metadata (no changes)`);
  console.log(`  ❌  ${results.errors.length} errors\n`);

  if (results.stillPlaceholder.length > 0) {
    console.log(`  ⚠️   ${results.stillPlaceholder.length} articles STILL have placeholder/empty content\n`);
    console.log('       These need an author to write real content before they can show\n');
    console.log('       a meaningful description in search results / social previews:\n');
    for (const { slug, title } of results.stillPlaceholder) {
      console.log(`         • /articles/${slug}  "${title}"`);
    }
    console.log('');
  }

  if (results.stillNoImage.length > 0) {
    console.log(`  🖼️   ${results.stillNoImage.length} articles still have NO OG image\n`);
    console.log('       (description was updated but no image was found in content_blocks)\n');
    console.log('       Add a hero image or image_block with a URL in the Studio editor:\n');
    for (const { slug } of results.stillNoImage) {
      console.log(`         • /articles/${slug}`);
    }
    console.log('');
  }

  if (results.errors.length > 0) {
    console.log('  Errors:');
    for (const { slug, reason } of results.errors) {
      console.log(`    • ${slug}: ${reason}`);
    }
    console.log('');
  }

  console.log(`   Finished: ${new Date().toISOString()}\n`);

  // Non-zero exit if any errors occurred
  if (results.errors.length > 0) process.exit(1);
}

backfill().catch(err => {
  console.error('\n❌  Unexpected error:', err);
  process.exit(1);
});
