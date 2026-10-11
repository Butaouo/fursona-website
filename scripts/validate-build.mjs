import { readFile, access, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
const html = await readFile('dist/index.html', 'utf8');
const expectedBase = process.env.SITE_BASE || '/fursona-website/';
const refs = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m => m[1]).filter(p => !/^(https?:|data:|mailto:)/.test(p));
for (const ref of refs) {
  if (!ref.startsWith(expectedBase)) throw new Error(`Incorrect base path: ${ref}`);
  await access(join('dist', ref.slice(expectedBase.length)));
}
const imageFiles = ['lyont-hero.webp','lyont-hero-640.webp','lyont-avatar.webp','lyont-illustration.webp','lyont-reference-clothed.webp','lyont-reference-natural.webp','younger-cover.webp'];
for (const file of imageFiles) await access(join('dist/images', file));
await access('dist/brand/bump.webp');
const files = await readdir('dist/assets');
const sizes = await Promise.all(files.map(async f => ({ file: f, kb: +((await stat(join('dist/assets', f))).size / 1024).toFixed(1) })));
console.log(JSON.stringify({ result: 'PASS', base: expectedBase, htmlReferences: refs.length, images: imageFiles.length + 1, bundles: sizes }, null, 2));
