import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

// Inspect shipped visitor content, never private documentation or test fixtures.
const rules = [
  ['internal publishing copy', /關係網圖片尚未提供|這裡預留給久天的世界|不使用替代角色或虛構設定|展示佔位|商品預留位置|素材確認後發布|清楚標示的展示佔位|僅供自動測試|僅供自動化|測試資料|測試商品|測試文章|test fixture|開發備註|開發預覽|敬請期待|尚未完成|Relationship artwork hasn.t been added|Reserved for LongDay.s world|no substitute characters|Display placeholder|Reserved (?:product )?space|Preview the interaction|clearly marked display placeholder|No published chapters yet|還沒有公開的篇章/i],
  ['generation-tool branding or temporary image host', /ChatGPT|OpenAI|DALL[·.\s-]?E|(?:https?:)?\/\/[^\s"'<>]*(?:oaiusercontent\.com|openaiusercontent\.com|oaistatic\.com|chatgpt\.com)/i],
  ['fixture product data', /"placeholder"\s*:\s*true|"id"\s*:\s*"(?:placeholder-|test-story|fixture-item-)/i],
];
export function assertPublicContent(text, file = 'public content') {
  // Preserve required third-party license notices, even if a licensor name matches.
  const visitorText = text.replace(/\/\*[!*][\s\S]*?\*\//g, '');
  for (const [reason, pattern] of rules) {
    if (pattern.test(visitorText)) throw new Error(`${file}: ${reason}`);
  }
}
export async function auditPublicBuild(root = 'dist') {
  let checked = 0;
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (/\.(?:html|js|json|svg|txt)$/i.test(entry.name) && !/(?:license|notice|third.party)/i.test(entry.name)) {
        assertPublicContent(await readFile(file, 'utf8'), file);
        checked++;
      }
    }
  }
  await walk(root);
  return { publicContent: 'PASS', filesChecked: checked };
}
