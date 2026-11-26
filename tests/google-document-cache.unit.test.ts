import { generateKeyPairSync } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
// @ts-expect-error Server-only ESM is not bundled into the website.
import { sync } from '../scripts/google-sync.mjs';

it('fetches a shared document once per sync and publishes each correct tab and legacy document', async () => {
  const root = await mkdtemp(join(tmpdir(), 'longday-doc-cache-'));
  const output = join(root, 'content');
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const env = {
    GOOGLE_SYNC_ENABLED: 'true',
    GOOGLE_PUBLICATION_SHEET_ID: 'fixture-spreadsheet',
    GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({
      client_email: 'fixture@test.iam.gserviceaccount.com',
      private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
    }),
  };
  const rows = [
    ['id', 'kind', 'title', 'date', 'docId', 'tabId', 'publishStatus'],
    ['diary-01', 'diary', '台灣', '2026-11-25', 'shared-document', 't.0', 'published'],
    ['diary-02', 'diary', '愛你，恨我', '2026-11-25', 'shared-document', 't.second', 'published'],
    ['novel-01', 'novel', '獨立文件', '2026-11-25', 'standalone-document', '', 'published'],
    ['diary-03', 'diary', '草稿', '2026-11-25', 'draft-document', '', 'draft'],
    ['world-01', 'worldbuilding', '世界觀', '2026-11-25', 'shared-document', 't.third', 'published'],
    ['region-01', 'region', '地區', '2026-11-25', 'shared-document', 't.region', 'published'],
    ['future-region', 'region', '未來', '2026-11-26', 'future-document', '', 'published'],
    ['draft-world', 'worldbuilding', '草稿', '2026-11-25', 'private-document', '', 'draft'],
  ];
  const body = (content: string) => ({ content: [{ paragraph: { elements: [{ textRun: { content } }] } }] });
  const tab = (tabId: string, content: string) => ({ tabProperties: { tabId }, documentTab: { body: body(content) } });
  const docsRequested: string[] = [];
  let second = '第二篇\n';
  const request = async (raw: string) => {
    const url = new URL(raw);
    if (url.hostname === 'oauth2.googleapis.com') return Response.json({ access_token: 'fixture-token' });
    if (url.hostname === 'sheets.googleapis.com') return Response.json({ valueRanges: [{ values: rows }, { values: [] }] });
    const id = url.pathname.split('/').at(-1)!;
    docsRequested.push(id);
    if (id === 'standalone-document') return Response.json({ body: body('獨立正文\n') });
    expect(id).toBe('shared-document');
    expect(url.searchParams.get('includeTabsContent')).toBe('true');
    return Response.json({ tabs: [{ ...tab('t.0', '第一篇\n'), childTabs: [tab('t.second', second), tab('t.third', '世界觀正文\n'), tab('t.region', '地區正文\n'), tab('t.fourth', '第三篇\n')] }] });
  };
  const readBodies = async () => {
    const { articles } = JSON.parse(await readFile(join(output, 'catalog.json'), 'utf8'));
    return articles.map((article: { id: string; blocks: { runs: { text: string }[] }[] }) =>
      [article.id, article.blocks.flatMap(block => block.runs).map(run => run.text).join('')]);
  };
  try {
    await sync({ env, request, output, today: '2026-11-25' });
    expect(docsRequested).toEqual(['shared-document', 'standalone-document']);
    expect(await readBodies()).toEqual([
      ['diary-01', '第一篇\n'], ['diary-02', '第二篇\n'], ['novel-01', '獨立正文\n'],
      ['world-01', '世界觀正文\n'], ['region-01', '地區正文\n'],
    ]);

    second = '第二篇更新\n';
    rows.push(['diary-04', 'diary', '新分頁', '2026-11-25', 'shared-document', 't.fourth', 'published']);
    await sync({ env, request, output, today: '2026-11-25' });
    expect(docsRequested).toEqual(['shared-document', 'standalone-document', 'shared-document', 'standalone-document']);
    expect(await readBodies()).toEqual([
      ['diary-01', '第一篇\n'], ['diary-02', '第二篇更新\n'], ['novel-01', '獨立正文\n'],
      ['world-01', '世界觀正文\n'], ['region-01', '地區正文\n'], ['diary-04', '第三篇\n'],
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
