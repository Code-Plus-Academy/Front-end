import assert from 'node:assert/strict';
import { canonicalizeStickerUrl, getStickerCdnBase } from '../src/utils/s3MediaClient.js';
import { resolveCdnUrl } from '../src/utils/mediaUtils.js';

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
console.log('  CPA Sticker Resolution & S3 CDN Verification Tests   ');
console.log('=======================================================\n');

test('getStickerCdnBase returns CDN base URL', () => {
  const base = getStickerCdnBase();
  assert.equal(base, 'https://cdn.codeplusacademy.in/stickers');
});

test('canonicalizeStickerUrl with leading /stickers/ relative path', () => {
  const input = '/stickers/cid_unfiltered/cid_kya_chakkar_hai.png';
  const expected = 'https://cdn.codeplusacademy.in/stickers/cid_unfiltered/cid_kya_chakkar_hai.png';
  assert.equal(canonicalizeStickerUrl(input), expected);
});

test('canonicalizeStickerUrl without leading slash stickers/ relative path', () => {
  const input = 'stickers/dev_life/git_fire.svg';
  const expected = 'https://cdn.codeplusacademy.in/stickers/dev_life/git_fire.svg';
  assert.equal(canonicalizeStickerUrl(input), expected);
});

test('canonicalizeStickerUrl without stickers folder prefix', () => {
  const input = 'marathi_student_slang/marathi_lay_bhari.png';
  const expected = 'https://cdn.codeplusacademy.in/stickers/marathi_student_slang/marathi_lay_bhari.png';
  assert.equal(canonicalizeStickerUrl(input), expected);
});

test('canonicalizeStickerUrl leaves absolute https URL untouched', () => {
  const input = 'https://cdn.codeplusacademy.in/stickers/exam_mode/294c1da1.webp';
  assert.equal(canonicalizeStickerUrl(input), input);
});

test('canonicalizeStickerUrl leaves data: URLs untouched', () => {
  const input = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...';
  assert.equal(canonicalizeStickerUrl(input), input);
});

test('canonicalizeStickerUrl resolves legacy aliases', () => {
  const input = '/stickers/marathi_one_night_enough.png';
  const resolved = canonicalizeStickerUrl(input);
  assert.ok(resolved.includes('exam_mode/294c1da1-e1d9-47d7-932d-e3b40159bd05.webp'));
  assert.ok(resolved.startsWith('https://cdn.codeplusacademy.in/stickers/'));
});

test('resolveCdnUrl rewrites /stickers/ to CloudFront CDN', () => {
  const input = '/stickers/dev_life/10x_hacker.svg';
  const expected = 'https://cdn.codeplusacademy.in/stickers/dev_life/10x_hacker.svg';
  assert.equal(resolveCdnUrl(input), expected);
});

test('historical message payload resolution simulation', () => {
  const dbMessages = [
    { id: '1', content_attachment: { sticker_url: '/stickers/marathi_student_slang/marathi_game_zhalay_bhau.png' } },
    { id: '2', content_attachment: { sticker_url: '/stickers/cid_unfiltered/cid_kya_chakkar_hai.png' } },
    { id: '3', content_attachment: { sticker_url: 'stickers/meme_chaotic/443b4d3c-8a8d-4ad5-b004-3035092466ef.webp' } },
    { id: '4', content_attachment: { sticker_url: 'https://cdn.codeplusacademy.in/stickers/dev_life/git_fire.svg' } },
  ];

  for (const msg of dbMessages) {
    const raw = msg.content_attachment.sticker_url;
    const resolved = canonicalizeStickerUrl(raw);
    assert.ok(resolved.startsWith('https://cdn.codeplusacademy.in/stickers/'), `Failed for ${raw}: ${resolved}`);
    assert.ok(!resolved.includes('/stickers/stickers/'), `Double-prefix detected: ${resolved}`);
  }
});

test('canonicalizeStickerUrl resolves doremon stickers correctly', () => {
  const input = '/stickers/doremon/310b0512-8856-4475-9c98-3eed255a26fd.webp';
  const expected = 'https://cdn.codeplusacademy.in/stickers/doremon/310b0512-8856-4475-9c98-3eed255a26fd.webp';
  assert.equal(canonicalizeStickerUrl(input), expected);
});

test('canonicalizeStickerUrl without leading slash for doremon', () => {
  const input = 'doremon/430547e2-f356-47cf-adf7-b2b119fc6cc5.webp';
  const expected = 'https://cdn.codeplusacademy.in/stickers/doremon/430547e2-f356-47cf-adf7-b2b119fc6cc5.webp';
  assert.equal(canonicalizeStickerUrl(input), expected);
});

console.log('\n=======================================================');
console.log(`  STICKER TEST SUMMARY: ${passed} PASSED, ${failed} FAILED `);
console.log('=======================================================\n');

if (failed > 0) {
  process.exit(1);
}
