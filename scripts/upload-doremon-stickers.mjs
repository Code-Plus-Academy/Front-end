import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const projectRoot = 'C:/Users/Sayaji_Kapse_2006/.gemini/antigravity/worktrees/Front-end/add_doremon_stickers';

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
  // Original 8 Doremon Stickers
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
    id: 'doremon_bangalimon',
    name: 'बंगालीmon 😁',
    file: 'doremon/2814c750-c8bf-4573-8d0e-d257e25c7f5e.webp',
    filename: '2814c750-c8bf-4573-8d0e-d257e25c7f5e.webp',
    tags: ['doremon', 'doraemon', 'bangali', 'bangalimon', 'smile', 'happy', 'teeth', 'meme'],
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
  },

  // 29 New Stickers from Desktop/stickers/all/WEBP
  {
    id: 'doremon_neele_racoon',
    name: 'Hatt Ja Neele Racoon 🦝',
    file: 'doremon/1027175c-c52c-4768-b0b9-dafc1919d7b8.webp',
    filename: '1027175c-c52c-4768-b0b9-dafc1919d7b8.webp',
    tags: ['doremon', 'doraemon', 'nobita', 'racoon', 'neele racoon', 'hatt ja', 'run', 'school bag', 'crushed', 'meme'],
    width: 1254,
    height: 1254
  },
  {
    id: 'doremon_raddimon',
    name: 'रद्दीmon 📰',
    file: 'doremon/108201a6-b4df-4448-a1b2-40ef808cf063.webp',
    filename: '108201a6-b4df-4448-a1b2-40ef808cf063.webp',
    tags: ['doremon', 'doraemon', 'raddi', 'raddimon', 'newspaper', 'box', 'heavy', 'work', 'majdoori', 'meme'],
    width: 1216,
    height: 1294
  },
  {
    id: 'doremon_achi_bivi',
    name: 'Padhai Likhai Krunga 📖',
    file: 'doremon/19dbc0b6-ccd5-41ce-8cf3-cfb74e99fe3e.webp',
    filename: '19dbc0b6-ccd5-41ce-8cf3-cfb74e99fe3e.webp',
    tags: ['doremon', 'doraemon', 'study', 'padhai', 'achi bivi', 'exam', 'books', 'pen', 'motivation', 'meme'],
    width: 1254,
    height: 1254
  },
  {
    id: 'doremon_motemon',
    name: 'मोटे-mon 😗',
    file: 'doremon/1d6b3e9a-6660-4d18-8d08-f884478e84a1.webp',
    filename: '1d6b3e9a-6660-4d18-8d08-f884478e84a1.webp',
    tags: ['doremon', 'doraemon', 'mote', 'motemon', 'fat', 'chubby', 'whistle', 'walking', 'cute', 'meme'],
    width: 1209,
    height: 1301
  },
  {
    id: 'doremon_devi_prasad',
    name: 'Devi Prasad Ghar Pe Hai? 📞',
    file: 'doremon/21959dff-d727-45cb-90fe-a9e9877ab8c2.webp',
    filename: '21959dff-d727-45cb-90fe-a9e9877ab8c2.webp',
    tags: ['doremon', 'doraemon', 'devi prasad', 'phone', 'call', 'hera pheri', 'kabira speaking', 'telephone', 'meme'],
    width: 1254,
    height: 1254
  },
  {
    id: 'doremon_teri_shadi',
    name: 'Teri Shadi Ka Kya Hua? 👰',
    file: 'doremon/2767c879-07e0-404b-959d-62ef2667496b.webp',
    filename: '2767c879-07e0-404b-959d-62ef2667496b.webp',
    tags: ['doremon', 'oggy', 'cockroach', 'shadi', 'wedding', 'single', 'taunt', 'shock', 'meme'],
    width: 1254,
    height: 1254
  },
  {
    id: 'doremon_sherni_ki_dahaad',
    name: 'Sherni ki Dahaad 🦁',
    file: 'doremon/2fbf25b0-4f1f-4a81-aab5-63d4dc73ae13.webp',
    filename: '2fbf25b0-4f1f-4a81-aab5-63d4dc73ae13.webp',
    tags: ['doremon', 'doraemon', 'nobita', 'mom', 'scolding', 'sherni', 'dahaad', 'angry mom', 'shivering', 'exam', 'meme'],
    width: 1379,
    height: 1141
  },
  {
    id: 'doremon_kapti_insan',
    name: 'Kapti Insan 😈',
    file: 'doremon/3792f21e-a333-48c6-b840-f1593f03a19c.webp',
    filename: '3792f21e-a333-48c6-b840-f1593f03a19c.webp',
    tags: ['doremon', 'oggy', 'cockroach', 'joey', 'kapti', 'evil', 'cunning', 'scheme', 'smile', 'meme'],
    width: 1312,
    height: 1199
  },
  {
    id: 'doremon_bhondu',
    name: 'Mein Toh Hun Hi Bhondu 🌇',
    file: 'doremon/393b7e59-777b-4578-83e9-915694ed23be.webp',
    filename: '393b7e59-777b-4578-83e9-915694ed23be.webp',
    tags: ['doremon', 'doraemon', 'bhondu', 'sunset', 'sad', 'alone', 'window', 'depression', 'overthinking', 'meme'],
    width: 1254,
    height: 1254
  },
  {
    id: 'doremon_acha_esa_kya',
    name: 'Acha Esa Kya! 😲',
    file: 'doremon/3c855061-fedd-4446-b40d-5b7e7d74a21b.webp',
    filename: '3c855061-fedd-4446-b40d-5b7e7d74a21b.webp',
    tags: ['doremon', 'doraemon', 'acha esa kya', 'really', 'gossip', 'surprise', 'smile', 'tea', 'meme'],
    width: 1536,
    height: 1024
  },
  {
    id: 'doremon_thodi_badmoshi',
    name: 'Thodi Badmoshi Hojaye 😈',
    file: 'doremon/46b0fa32-f32f-4a9b-ab4c-728564648060.webp',
    filename: '46b0fa32-f32f-4a9b-ab4c-728564648060.webp',
    tags: ['doremon', 'doraemon', 'badmoshi', 'evil grin', 'naughty', 'scheming', 'trouble', 'prank', 'meme'],
    width: 1254,
    height: 1254
  },
  {
    id: 'doremon_financial_status',
    name: 'Financial Status Y\'all 💸',
    file: 'doremon/51c5a634-1bef-4a01-9542-9d66c53d8b03.webp',
    filename: '51c5a634-1bef-4a01-9542-9d66c53d8b03.webp',
    tags: ['doremon', 'doraemon', 'money', 'rupees', 'broke', 'empty wallet', 'garibi', 'crying', 'bills', 'meme'],
    width: 1254,
    height: 1254
  },
  {
    id: 'doremon_emotional_krdiya',
    name: 'Emotional Krdia Tune 🥺',
    file: 'doremon/563ecfe5-3baf-4b23-9e6d-f00b8720531c.webp',
    filename: '563ecfe5-3baf-4b23-9e6d-f00b8720531c.webp',
    tags: ['doremon', 'doraemon', 'emotional', 'crying', 'tears', 'wholesome', 'pgle', 'heartfelt', 'meme'],
    width: 1254,
    height: 1254
  },
  {
    id: 'doremon_sunimon',
    name: 'सुनिmon 😏',
    file: 'doremon/6231681e-5d3a-4bac-9a9e-4a9f647e7718.webp',
    filename: '6231681e-5d3a-4bac-9a9e-4a9f647e7718.webp',
    tags: ['doremon', 'doraemon', 'sunio', 'sunimon', 'smug', 'attitude', 'rich kid', 'brag', 'meme'],
    width: 1316,
    height: 1195
  },
  {
    id: 'doremon_theplamon',
    name: 'थेपला mon 🥱',
    file: 'doremon/69afff23-9ab9-4fd6-ba7e-f55fa597bf16.webp',
    filename: '69afff23-9ab9-4fd6-ba7e-f55fa597bf16.webp',
    tags: ['doremon', 'doraemon', 'thepla', 'theplamon', 'tired', 'flat', 'exhausted', 'sleepy', 'lazy', 'meme'],
    width: 1364,
    height: 1153
  },
  {
    id: 'doremon_pata_chl_gya',
    name: 'Tujhe Kese Pata Chl Gya? 🤫',
    file: 'doremon/71956ff1-34b7-4dd7-81b8-acf78c1d4ce3.webp',
    filename: '71956ff1-34b7-4dd7-81b8-acf78c1d4ce3.webp',
    tags: ['doremon', 'doraemon', 'secret', 'exposed', 'caught', 'guilty', 'cheeky', 'smile', 'meme'],
    width: 1254,
    height: 1254
  },
  {
    id: 'doremon_instagram_blocked',
    name: 'Instagram User Not Found 🚫',
    file: 'doremon/766e2c7c-6b49-4b7f-b6fb-da9fe9373eed.webp',
    filename: '766e2c7c-6b49-4b7f-b6fb-da9fe9373eed.webp',
    tags: ['doremon', 'oggy', 'instagram', 'blocked', 'user not found', 'heartbreak', 'shock', 'meme'],
    width: 1312,
    height: 1199
  },
  {
    id: 'doremon_gusse_mon',
    name: 'गुस्से mon 💢',
    file: 'doremon/84141798-78ae-4cf9-ac0c-2cdd7a34d170.webp',
    filename: '84141798-78ae-4cf9-ac0c-2cdd7a34d170.webp',
    tags: ['doremon', 'doraemon', 'angry', 'gussa', 'mad', 'clenched teeth', 'rage', 'red face', 'meme'],
    width: 1234,
    height: 1275
  },
  {
    id: 'doremon_kya_baat_krdi',
    name: 'Ye Kya Baat Krdi Aapne!? 😱',
    file: 'doremon/861639f6-ad2c-4691-aa99-a6174b1ba5a4.webp',
    filename: '861639f6-ad2c-4691-aa99-a6174b1ba5a4.webp',
    tags: ['doremon', 'doraemon', 'nobita', 'shock', 'ye kya baat', 'hands up', 'screaming', 'disbelief', 'meme'],
    width: 1536,
    height: 1024
  },
  {
    id: 'doremon_kya_he_bolu',
    name: 'Ab Isme Mai Kya He Bolu 🤷',
    file: 'doremon/9e79a457-4825-4524-b828-fb8a33ac8794.webp',
    filename: '9e79a457-4825-4524-b828-fb8a33ac8794.webp',
    tags: ['doremon', 'doraemon', 'speechless', 'confused', 'scratch head', 'no comments', 'awkward', 'meme'],
    width: 1254,
    height: 1254
  },
  {
    id: 'doremon_me_core',
    name: 'Me Core 📺',
    file: 'doremon/a5ced02b-94a3-4a79-8045-0a1bd7354ee0.webp',
    filename: 'a5ced02b-94a3-4a79-8045-0a1bd7354ee0.webp',
    tags: ['doremon', 'doraemon', 'me core', 'lazy', 'tv', 'chilling', 'dorayaki', 'relaxing', 'weekend', 'relatable', 'meme'],
    width: 1536,
    height: 1024
  },
  {
    id: 'doremon_pinjde_mon',
    name: 'पिंजड़े mon 🪤',
    file: 'doremon/a7a0608e-148f-447d-81ee-3209089e9c3c.webp',
    filename: 'a7a0608e-148f-447d-81ee-3209089e9c3c.webp',
    tags: ['doremon', 'doraemon', 'pinjra', 'cage', 'trapped', 'jail', 'grumpy', 'caught', 'meme'],
    width: 1316,
    height: 1195
  },
  {
    id: 'doremon_matter_ho_gaya',
    name: 'Matter Ho Gaya 🚨',
    file: 'doremon/cf517aa2-346f-42fd-95d4-cee426ed7118.webp',
    filename: 'cf517aa2-346f-42fd-95d4-cee426ed7118.webp',
    tags: ['doremon', 'doraemon', 'nobita', 'gian', 'sunio', 'lafda', 'matter', 'fight', 'trouble', 'pulling', 'meme'],
    width: 1451,
    height: 1084
  },
  {
    id: 'doremon_born_to_forced_to',
    name: 'Born To / Forced To 🥀',
    file: 'doremon/d3a78fc2-5ab4-41e4-bdc9-4364db37ed7c.webp',
    filename: 'd3a78fc2-5ab4-41e4-bdc9-4364db37ed7c.webp',
    tags: ['doremon', 'shinchan', 'born to', 'forced to', 'romance', 'study', 'corporate', 'sad', 'meme'],
    width: 1199,
    height: 1312
  },
  {
    id: 'doremon_party_deta_hu',
    name: 'Idhar Aa Tujhe Party Deta Hu 🚪',
    file: 'doremon/db479fac-ef57-473e-aa55-a9e4b01b6162.webp',
    filename: 'db479fac-ef57-473e-aa55-a9e4b01b6162.webp',
    tags: ['doremon', 'doraemon', 'party deta hu', 'peeking', 'door', 'trap', 'sinister', 'calling', 'meme'],
    width: 1343,
    height: 1171
  },
  {
    id: 'doremon_level_dekh',
    name: 'Level Dekh K Baat Kr Lala 💅',
    file: 'doremon/e3921b6c-233c-43de-8dc4-375b51620992.webp',
    filename: 'e3921b6c-233c-43de-8dc4-375b51620992.webp',
    tags: ['doremon', 'doraemon', 'shizuka', 'nobita', 'level sabke niklenge', 'flex', 'attitude', 'swagger', 'meme'],
    width: 1254,
    height: 1254
  },
  {
    id: 'doremon_khana_do',
    name: 'Advice Nhi Khana Do 🍲',
    file: 'doremon/e89fee65-33fc-4631-bfcc-8e584bfc1259.webp',
    filename: 'e89fee65-33fc-4631-bfcc-8e584bfc1259.webp',
    tags: ['doremon', 'doraemon', 'khana do', 'hungry', 'bowl', 'bhukhad', 'food', 'advice nhi', 'begging', 'meme'],
    width: 1188,
    height: 1324
  },
  {
    id: 'doremon_refurbished_iphone',
    name: 'Refurbished iPhone Lelete H 📱',
    file: 'doremon/f8450505-58ec-4049-9dad-f8bbd7607372.webp',
    filename: 'f8450505-58ec-4049-9dad-f8bbd7607372.webp',
    tags: ['doremon', 'oggy', 'iphone', 'refurbished', 'poor', 'beat up', 'compromise', 'apple', 'meme'],
    width: 1536,
    height: 1024
  },
  {
    id: 'doremon_reacted_to_message',
    name: 'Reacted To Your Message 🤪',
    file: 'doremon/fb716cb8-7719-462b-a006-bf87664e0369.webp',
    filename: 'fb716cb8-7719-462b-a006-bf87664e0369.webp',
    tags: ['doremon', 'shinchan', 'reacted', 'funny face', 'tongue', 'stretch face', 'tease', 'dm reaction', 'meme'],
    width: 1254,
    height: 1254
  }
];

const SEARCH_DIRS = [
  'C:/Users/Sayaji_Kapse_2006/Desktop/stickers/all/WEBP',
  'C:/Users/Sayaji_Kapse_2006/Desktop/stickers/Doremon/WEBP',
  path.join(projectRoot, 'public', 'stickers', 'doremon')
];

const LOCAL_TARGET_DIR = path.join(projectRoot, 'public', 'stickers', 'doremon');
const LOCAL_MANIFEST_PATH = path.join(projectRoot, 'public', 'stickers', 'manifest.json');

function resolveSourceFile(filename) {
  for (const dir of SEARCH_DIRS) {
    const fullPath = path.join(dir, filename);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

async function run() {
  console.log('====================================================');
  console.log('  CPA Doremon Sticker Pack Ingestion Engine (37 pk) ');
  console.log('====================================================');
  console.log(`Total Stickers   : ${DOREMON_STICKERS.length}`);
  console.log(`Target Bucket    : ${bucket}`);
  console.log(`Target Region    : ${region}`);
  console.log(`S3 Prefix        : stickers/doremon/\n`);

  // 1. Copy files locally to public/stickers/doremon/
  if (!fs.existsSync(LOCAL_TARGET_DIR)) {
    fs.mkdirSync(LOCAL_TARGET_DIR, { recursive: true });
  }

  for (const item of DOREMON_STICKERS) {
    const src = resolveSourceFile(item.filename);
    if (!src) {
      throw new Error(`Cannot locate source file for ${item.filename}`);
    }
    const dest = path.join(LOCAL_TARGET_DIR, item.filename);
    if (src !== dest) {
      fs.copyFileSync(src, dest);
      console.log(`[LOCAL] Copied ${item.filename} -> public/stickers/doremon/`);
    } else {
      console.log(`[LOCAL] Already present: ${item.filename}`);
    }
  }

  // 2. Upload images to S3
  console.log(`\nUploading ${DOREMON_STICKERS.length} Doremon stickers to S3...`);
  for (let i = 0; i < DOREMON_STICKERS.length; i++) {
    const st = DOREMON_STICKERS[i];
    const s3Key = `stickers/${st.file}`;
    const localFile = path.join(LOCAL_TARGET_DIR, st.filename);
    const fileBuf = fs.readFileSync(localFile);

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

  // 4. Construct the updated doremon pack
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

  // Replace existing doremon pack
  const filteredPacks = manifest.packs.filter(p => p.id !== 'doremon');

  // Insert doremon pack after kgdm_vibes (or position 3)
  const kgdmIndex = filteredPacks.findIndex(p => p.id === 'kgdm_vibes');
  const insertIndex = kgdmIndex !== -1 ? kgdmIndex + 1 : 2;
  filteredPacks.splice(insertIndex, 0, doremonPack);

  manifest.packs = filteredPacks;
  const updatedManifestJson = JSON.stringify(manifest, null, 2);

  // 5. Upload updated manifest.json to S3
  console.log(`\nUploading updated stickers/manifest.json to S3 (${filteredPacks.length} packs, 37 stickers in doremon)...`);
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
    const expectedSize = fs.statSync(path.join(LOCAL_TARGET_DIR, st.filename)).size;
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
  console.log('  Doremon Pack Successfully Ingested (37 stickers)! ');
  console.log('====================================================\n');
}

run().catch(err => {
  console.error('Fatal Ingestion Error:', err);
  process.exit(1);
});
