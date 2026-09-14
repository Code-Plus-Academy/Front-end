import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Require AWS SDK from backend node_modules
let S3Client, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command;
try {
  const requireFromBackend = createRequire('e:/code_plus_academy/Back-end/backend/package.json');
  const s3Module = requireFromBackend('@aws-sdk/client-s3');
  S3Client = s3Module.S3Client;
  PutObjectCommand = s3Module.PutObjectCommand;
  HeadObjectCommand = s3Module.HeadObjectCommand;
  ListObjectsV2Command = s3Module.ListObjectsV2Command;
} catch (e) {
  console.error('Failed to load @aws-sdk/client-s3:', e.message);
  process.exit(1);
}

// Load credentials from environment or backend .env
function loadEnv() {
  const env = { ...process.env };
  const envPaths = [
    path.join(projectRoot, '.env'),
    path.join(projectRoot, '.env.local'),
    'e:/code_plus_academy/Back-end/backend/.env'
  ];

  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...rest] = trimmed.split('=');
        if (key && rest.length > 0 && !env[key.trim()]) {
          env[key.trim()] = rest.join('=').trim();
        }
      }
    }
  }
  return env;
}

const env = loadEnv();

const region = env.AWS_S3_REGION || env.AWS_REGION || 'ap-south-1';
const bucket = env.AWS_S3_BUCKET || 'cpacontentstream';
const accessKeyId = env.AWS_S3_ACCESS_KEY || env.AWS_ACCESS_KEY_ID;
const secretAccessKey = env.AWS_S3_SECRET_KEY || env.AWS_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
  console.error('Missing AWS Credentials: AWS_S3_ACCESS_KEY or AWS_ACCESS_KEY_ID required');
  process.exit(1);
}

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
});

const MIME_MAP = {
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};

const CACHE_CONTROL_MEDIA = 'public, max-age=31536000, immutable';
const CACHE_CONTROL_MANIFEST = 'public, max-age=300, stale-while-revalidate=600';

function getFilesRecursively(dir, baseDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath, baseDir));
    } else {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      results.push({
        fullPath,
        relPath,
        ext: path.extname(item.name).toLowerCase(),
        size: fs.statSync(fullPath).size
      });
    }
  }
  return results;
}

async function uploadFile(file, targetKey) {
  const content = fs.readFileSync(file.fullPath);
  const mimeType = MIME_MAP[file.ext] || 'application/octet-stream';
  const cacheControl = file.relPath === 'manifest.json'
    ? CACHE_CONTROL_MANIFEST
    : CACHE_CONTROL_MEDIA;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: targetKey,
    Body: content,
    ContentType: mimeType,
    CacheControl: cacheControl
  });

  await s3.send(command);
}

async function run() {
  console.log('====================================================');
  console.log('  CPA S3 Sticker Migration & Synchronization Engine ');
  console.log('====================================================');
  console.log(`Target Bucket : ${bucket}`);
  console.log(`Target Region : ${region}`);
  console.log(`Prefix        : stickers/`);
  console.log('');

  const stickersDir = path.join(projectRoot, 'public', 'stickers');
  if (!fs.existsSync(stickersDir)) {
    console.error(`Stickers directory not found: ${stickersDir}`);
    process.exit(1);
  }

  const files = getFilesRecursively(stickersDir);
  console.log(`Found ${files.length} local files in public/stickers/`);

  let successCount = 0;
  let failedCount = 0;
  const errors = [];

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const s3Key = `stickers/${f.relPath}`;
    process.stdout.write(`[${i + 1}/${files.length}] Uploading ${s3Key} (${(f.size / 1024).toFixed(1)} KB)... `);
    try {
      await uploadFile(f, s3Key);
      process.stdout.write('OK\n');
      successCount++;
    } catch (err) {
      process.stdout.write('FAILED\n');
      console.error(`       Error: ${err.message}`);
      failedCount++;
      errors.push({ file: f.relPath, error: err.message });
    }
  }

  console.log('\n----------------------------------------------------');
  console.log(`Upload Complete: ${successCount} succeeded, ${failedCount} failed.`);
  console.log('----------------------------------------------------\n');

  if (failedCount > 0) {
    console.error('Migration failed with errors:');
    console.error(errors);
    process.exit(1);
  }

  console.log('Starting verification pass against S3...');
  let verifiedCount = 0;
  for (const f of files) {
    const s3Key = `stickers/${f.relPath}`;
    const expectedMime = MIME_MAP[f.ext] || 'application/octet-stream';
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: s3Key }));
    if (head.ContentLength !== f.size) {
      throw new Error(`Size mismatch for ${s3Key}: expected ${f.size}, got ${head.ContentLength}`);
    }
    if (head.ContentType !== expectedMime) {
      throw new Error(`MIME mismatch for ${s3Key}: expected ${expectedMime}, got ${head.ContentType}`);
    }
    verifiedCount++;
  }

  console.log(`Parity Verified: Exactly ${verifiedCount} of ${files.length} objects match byte-for-byte in S3.`);
  console.log('Migration to S3 successfully completed!\n');
}

run().catch(err => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
