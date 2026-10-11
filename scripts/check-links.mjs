import { site, visibleSocials } from '../src/config/site.ts';
import { mkdir, writeFile } from 'node:fs/promises';
const entries = visibleSocials().filter(s => s.href?.startsWith('https://')).map(s => ({ name: s.name, url: s.href }));
entries.push({ name: 'Apple Music', url: site.music.appleMusicUrl }, { name: 'Apple Music embed', url: site.music.embedUrl });
const results = await Promise.all(entries.map(async ({name, url}) => {
  try {
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'LongDay-LinkCheck/1.0' } });
    const body = (await response.text()).slice(0, 50000);
    return { name, requested: url, final: response.url, status: response.status, reachable: response.ok, verification: response.ok ? /sign in|log in|登入/i.test(body) ? 'HTTP reachable; login may be required' : 'HTTP reachable; profile content still needs visual verification' : 'Not verified; response may reflect access or network restrictions' };
  } catch (error) { return { name, requested: url, reachable: false, verification: 'Not verified', error: String(error) }; }
}));
await mkdir('reports', { recursive: true });
await writeFile('reports/links.json', JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
console.log(JSON.stringify(results, null, 2));
