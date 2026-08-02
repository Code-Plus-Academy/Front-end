import { cp, mkdir, rm, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const openNextDir = path.join(rootDir, '.open-next');
const assetsDir = path.join(openNextDir, 'assets');
const runtimeDir = path.join(assetsDir, 'open-next');

// 1. Ensure all Next.js static build chunks (.next/static) are copied into Cloudflare ASSETS directory (.open-next/assets/_next/static)
const nextStaticDir = path.join(rootDir, '.next', 'static');
const targetNextStaticDir = path.join(assetsDir, '_next', 'static');

try {
  await cp(nextStaticDir, targetNextStaticDir, { recursive: true, force: true });
  console.log('[prepare-pages] Successfully synced .next/static chunks into .open-next/assets/_next/static');
} catch (err) {
  console.warn('[prepare-pages] Warning syncing .next/static:', err.message);
}

// 2. Prepare Cloudflare worker runtime assets
await rm(runtimeDir, { recursive: true, force: true });
await mkdir(runtimeDir, { recursive: true });

await writeFile(
  path.join(assetsDir, '_worker.js'),
  "import worker from './open-next/worker.js';\n\nexport default worker;\n"
);

const entries = await readdir(openNextDir, { withFileTypes: true });
for (const entry of entries) {
  if (entry.name === 'assets') continue;
  await cp(path.join(openNextDir, entry.name), path.join(runtimeDir, entry.name), {
    recursive: true,
    force: true,
    preserveTimestamps: true,
  });
}
