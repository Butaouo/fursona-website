import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const sha = process.env.GITHUB_SHA;
if (!/^[a-f0-9]{40}$/.test(sha || '')) throw new Error('Expected a GitHub commit SHA');

const root = 'public/content';
const catalog = await readFile(join(root, 'catalog.json'));
const hash = createHash('sha256').update(catalog).update('\0');
const media = await readdir(join(root, 'media')).catch(error => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
for (const file of media.sort()) {
  hash.update(file).update('\0');
  hash.update(createHash('sha256').update(await readFile(join(root, 'media', file))).digest());
}
const manifest = { sha, contentHash: hash.digest('hex') };
await writeFile('public/publication-version.json', JSON.stringify(manifest));

if (process.argv[2] === 'compare') {
  const response = await fetch('https://longday.tw/publication-version.json?' + Date.now(), {
    headers: { 'Cache-Control': 'no-cache' },
    signal: AbortSignal.timeout(15000),
  });
  // The full release establishes the baseline for its own commit.
  if (!response.ok && response.status !== 404) throw new Error('Could not read the deployed publication version');
  const live = response.ok ? await response.json() : {};
  const changed = live.sha === sha && live.contentHash !== manifest.contentHash;
  await writeFile(process.env.GITHUB_OUTPUT, `changed=${changed}\n`, { flag: 'a' });
  console.log(live.sha !== sha ? 'Full code release pending' : changed ? 'Publication changed' : 'Publication unchanged');
}
