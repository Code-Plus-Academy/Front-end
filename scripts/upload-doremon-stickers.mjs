import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Require AWS SDK from backend node_modules
const requireFromBackend = createRequire('e:/code_plus_academy/Back-end/backend/package.json');
const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = requireFromBackend('@aws-sdk/client-s3');

// Load credentials
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
  credentials: { accessKeyId, secretAccessKey }
});

const DOREMON_STICKERS = [
  {
    id: 'doremon_bangalimon',
    name: 'बंगालीmon 😁',
    file: 'doremon/2814c750-c8bf-4573-8d0e-d257e25c7f5e.webp',
    filename: '2814c750-c8bf-4573-8d0e-d257e25c7f5e.webp',
    tags: ['doremon', 'doraemon', 'bangali', 'bangalimon', 'smile', 'happy', 'teeth', 'meme'],
    width: 1254,
    height: 1254
  },
  {
    id: 'doremon_harami_mon',
    name: 'Harami mon 😈',
    file: 'doremon/310b0512-8856-4475-9c98-3eed255a26fd.webp',
    filename: '310b0512-8856-4475-9c98-3eed255a26fd.webp',
    tags: ['doremon', 'doraemon', 'harami', 'harami mon', 'evil', 'grin', 'savage', 'meme'],
    width: 1254,
    height: 1254
  },
  {
    id: 'doremon_delulu_mon',
    name: 'डेलुलु-mon 📢',
    file: 'doremon/430547e2-f356-47cf-adf7-b2b119fc6cc5.webp',
    filename: '430547e2-f356-47cf-adf7-b2b119fc6cc5.webp',
    tags: ['doremon', 'doraemon', 'delulu', 'delulu-mon', 'screaming', 'gaming', 'chair', 'crying', 'meme'],
    width: 1254,
    height: 1254
  },
  {
    id: 'doremon_gentlemon',
    name: 'GentleMon 🤵',
    file: 'doremon/a51d301d-b9f0-4ac6-8cd3-e2fdae63a6c9.webp',
    filename: 'a51d301d-b9f0-4ac6-8cd3-e2fdae63a6c9.webp',
    tags: ['doremon', 'doraemon', 'gentlemon', 'gentleman', 'suit', 'tuxedo', 'bowtie', 'classy', 'swag', 'meme'],
    width: 1254,
    height: 1254
  },
  {
    id: 'doremon_sharmate_mon',
    name: 'शर्मातेmon 🥰',
    file: 'doremon/a747a001-1985-4bc3-a8c9-1dae19ea1b42.webp',
    filename: 'a747a001-1985-4bc3-a8c9-1dae19ea1b42.webp',
    tags: ['doremon', 'doraemon', 'sharmate', 'blush', 'shy', 'cute', 'hearts', 'crush', 'love', 'meme'],
    width: 1254,
    height: 1254
  },
  {
    id: 'doremon_padhaku_mon',
    name: 'पढ़ाकुmon 📖',
    file: 'doremon/b8daee94-2df6-4027-837f-4b1b14905ca4.webp',
    filename: 'b8daee94-2df6-4027-837f-4b1b14905ca4.webp',
    tags: ['doremon', 'doraemon', 'padhaku', 'study', 'exam', 'book', 'desk', 'serious', 'topper', 'meme'],
    width: 1254,
    height: 1254
  },
  {
    id: 'doremon_tharkimon',
    name: 'tharkimon 😏',
    file: 'doremon/cd0e4108-41d4-4524-967f-9969c0e1c61f.webp',
    filename: 'cd0e4108-41d4-4524-967f-9969c0e1c61f.webp',
    tags: ['doremon', 'doraemon', 'tharki', 'tharkimon', 'smirk', 'side eye', 'sus', 'sly', 'meme'],
    width: 1254,
    height: 1254
  },
  {
    id: 'doremon_ninnimon',
    name: 'Ninnimon 😴',
    file: 'doremon/eddad4ce-e8e1-4700-a04d-2d3e9fdb0ecf.webp',
    filename: 'eddad4ce-e8e1-4700-a04d-2d3e9fdb0ecf.webp',
    tags: ['doremon', 'doraemon', 'ninnimon', 'ninni', 'sleep', 'pillow', 'bed', 'goodnight', 'tired', 'meme'],
    width: 1235,
    height: 1274
  }
];

const SOURCE_DIR = 'C:/Users/Sayaji_Kapse_2006/Desktop/stickers/Doremon/WEBP';
const LOCAL_TARGET_DIR = path.join(projectRoot, 'public', 'stickers', 'doremon');
const LOCAL_MANIFEST_PATH = path.join(projectRoot, 'public', 'stickers', 'manifest.json');

async function run() {
  console.log('====================================================');
  console.log('  CPA Doremon Sticker Pack Ingestion Engine         ');
  console.log('====================================================');
  console.log(`Source Directory : ${SOURCE_DIR}`);
  console.log(`Target Bucket    : ${bucket}`);
  console.log(`Target Region    : ${region}`);
  console.log(`S3 Prefix        : stickers/doremon/\n`);

  // 1. Copy files locally to public/stickers/doremon/
  if (!fs.existsSync(LOCAL_TARGET_DIR)) {
    fs.mkdirSync(LOCAL_TARGET_DIR, { recursive: true });
  }

  for (const item of DOREMON_STICKERS) {
    const src = path.join(SOURCE_DIR, item.filename);
    const dest = path.join(LOCAL_TARGET_DIR, item.filename);
    fs.copyFileSync(src, dest);
    console.log(`[LOCAL] Copied ${item.filename} -> public/stickers/doremon/`);
  }

  // 2. Upload images to S3
  console.log('\nUploading 8 Doremon stickers to S3...');
  for (let i = 0; i < DOREMON_STICKERS.length; i++) {
    const st = DOREMON_STICKERS[i];
    const s3Key = `stickers/${st.file}`;
    const fileBuf = fs.readFileSync(path.join(SOURCE_DIR, st.filename));

    process.stdout.write(`[${i + 1}/${DOREMON_STICKERS.length}] Uploading ${s3Key} (${(fileBuf.length / 1024).toFixed(1)} KB)... `);
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: fileBuf,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable'
    }));
    process.stdout.write('OK\n');
  }

  // 3. Fetch current manifest from S3
  console.log('\nFetching current stickers/manifest.json from S3...');
  let manifest;
  try {
    const getRes = await s3.send(new GetObjectCommand({
      Bucket: bucket,
      Key: 'stickers/manifest.json'
    }));
    const manifestStr = await getRes.Body.transformToString();
    manifest = JSON.parse(manifestStr);
    console.log(`Retrieved manifest v${manifest.version} with ${manifest.packs.length} existing packs.`);
  } catch (err) {
    console.error('Failed to get manifest from S3:', err.message);
    process.exit(1);
  }

  // 4. Construct the doremon pack
  const doremonPack = {
    id: 'doremon',
    name: '🐱 Doremon Vibes (डेलुलु & Harami)',
    icon: 'doremon/310b0512-8856-4475-9c98-3eed255a26fd.webp',
    stickers: DOREMON_STICKERS.map(({ id, name, file, tags, width, height }) => ({
      id,
      name,
      file,
      tags,
      width,
      height
    }))
  };

  // Remove existing doremon pack if present
  const filteredPacks = manifest.packs.filter(p => p.id !== 'doremon');

  // Insert doremon pack after kgdm_vibes (or position 3)
  const kgdmIndex = filteredPacks.findIndex(p => p.id === 'kgdm_vibes');
  const insertIndex = kgdmIndex !== -1 ? kgdmIndex + 1 : 2;
  filteredPacks.splice(insertIndex, 0, doremonPack);

  manifest.packs = filteredPacks;
  const updatedManifestJson = JSON.stringify(manifest, null, 2);

  // 5. Upload updated manifest.json to S3
  console.log(`Uploading updated stickers/manifest.json to S3 (${filteredPacks.length} packs)...`);
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: 'stickers/manifest.json',
    Body: Buffer.from(updatedManifestJson, 'utf-8'),
    ContentType: 'application/json',
    CacheControl: 'public, max-age=300, stale-while-revalidate=600'
  }));
  console.log('Uploaded stickers/manifest.json to S3 successfully.');

  // 6. Save manifest locally
  fs.writeFileSync(LOCAL_MANIFEST_PATH, updatedManifestJson, 'utf-8');
  console.log(`Saved local manifest to ${LOCAL_MANIFEST_PATH}`);

  // 7. Verify all uploaded objects in S3 with HeadObject
  console.log('\nRunning HeadObject parity verification against S3...');
  for (const st of DOREMON_STICKERS) {
    const s3Key = `stickers/${st.file}`;
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: s3Key }));
    const expectedSize = fs.statSync(path.join(SOURCE_DIR, st.filename)).size;
    if (head.ContentLength !== expectedSize) {
      throw new Error(`Size mismatch for ${s3Key}: expected ${expectedSize}, got ${head.ContentLength}`);
    }
    if (head.ContentType !== 'image/webp') {
      throw new Error(`MIME mismatch for ${s3Key}: expected image/webp, got ${head.ContentType}`);
    }
    console.log(`[VERIFIED] ${s3Key} -> ${head.ContentLength} bytes (${head.ContentType})`);
  }

  // Verify manifest
  const manifestHead = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: 'stickers/manifest.json' }));
  console.log(`[VERIFIED] stickers/manifest.json -> ${manifestHead.ContentLength} bytes (${manifestHead.ContentType})`);

  console.log('\n====================================================');
  console.log('  Doremon Sticker Collection Successfully Deployed! ');
  console.log('====================================================\n');
}

run().catch(err => {
  console.error('Fatal Ingestion Error:', err);
  process.exit(1);
});
