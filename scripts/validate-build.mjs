import { readFile, access, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
const html = await readFile('dist/index.html', 'utf8');
const expectedBase = process.env.SITE_BASE || '/';
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

// Keep every deployment on the verified root-domain configuration.
if ((await readFile('dist/CNAME', 'utf8')).trim() !== 'longday.tw') throw new Error('Unexpected deployment domain');
for (const marker of ['<link rel="canonical" href="https://longday.tw/"', '<meta property="og:url" content="https://longday.tw/"']) {
  if (!html.includes(marker)) throw new Error('Canonical domain metadata is missing');
}
const sharing = [...html.matchAll(/<meta[^>]+(?:property|name)="(?:og:image|twitter:image)"[^>]+content="([^"]+)"/g)].map(m => m[1]);
if (sharing.length !== 2) throw new Error('Both social sharing images are required');
for (const url of sharing) {
  const image = new URL(url);
  if (image.origin !== 'https://longday.tw' || !image.pathname.startsWith('/images/')) throw new Error('Sharing image must use the canonical domain');
  await access(join('dist', image.pathname.slice(1)));
}
if (/butaouo\.github\.io|\/fursona-website\//i.test(html)) throw new Error('Legacy domain or base remains in production HTML');
console.log(JSON.stringify({ domain: 'longday.tw', canonical: 'PASS', sharingImages: sharing.length }));
