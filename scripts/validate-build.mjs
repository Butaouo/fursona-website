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

// Fail publication if an ephemeral generator URL or tool-branded public asset returns.
// Source documentation and third-party license notices are intentionally not rewritten.
const toolTrace = /chatgpt|openai|dall[·. -]?e|oaiusercontent|sdmnt|blob\.core\.windows/i;
if (toolTrace.test(html)) throw new Error('Unexpected tool branding in public HTML metadata');
async function inspectPublic(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (toolTrace.test(entry.name)) throw new Error(`Non-brand public filename: ${entry.name}`);
    if (entry.isDirectory()) await inspectPublic(path);
    else if (/\.(html|json|svg|txt|xml)$/i.test(entry.name) && !/license|notice/i.test(entry.name)) {
      if (toolTrace.test(await readFile(path, 'utf8'))) throw new Error(`Unexpected tool branding in ${path}`);
    }
  }
}
await inspectPublic('dist');
const shareImages = [...html.matchAll(/<meta[^>]+(?:property|name)="(?:og:image|twitter:image)"[^>]+content="([^"]+)"/g)].map(m=>m[1]);
for (const url of shareImages) {
  const parsed = new URL(url);
  if (parsed.hostname.toLowerCase() !== 'butaouo.github.io' || !parsed.pathname.startsWith(expectedBase)) throw new Error('Sharing image must be a stable project asset');
  await access(join('dist', parsed.pathname.slice(expectedBase.length)));
}
console.log(JSON.stringify({ brandAudit: 'PASS', shareImages: shareImages.length, policy: 'stable project assets; license notices preserved' }));
