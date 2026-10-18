import { describe, expect, it } from 'vitest';
// @ts-expect-error Build-only publication audit is plain ESM, outside the frontend bundle.
import { assertPublicContent } from '../scripts/public-content.mjs';

describe('public publication gate', () => {
  it('blocks internal instructions in either language and AI image provenance', () => {
    for (const text of ['關係網圖片尚未提供', '這裡預留給久天的世界。不使用替代角色或虛構設定。', '展示佔位，非正式商品', 'Relationship artwork hasn’t been added yet', 'Preview the interaction', 'ChatGPT', 'https://example.oaiusercontent.com/art.png']) {
      expect(() => assertPublicContent(text)).toThrow();
    }
  });
  it('blocks accidental fixture products in the published catalog', () => {
    for (const data of [{ placeholder: true }, { id: 'fixture-item-1' }, { id: 'placeholder-0' }]) {
      expect(() => assertPublicContent(JSON.stringify(data))).toThrow();
    }
  });
  it('retains real brand copy, copyright and legitimate service feedback', () => {
    expect(() => assertPublicContent('LongDay · 久天。相遇、牽絆，以及同一個世界裡的彼此。© HaGooLongDay。角色與插畫權利歸各自權利人所有。圖片暫時無法載入，請稍後重試。')).not.toThrow();
    expect(() => assertPublicContent('/*! OpenAI copyright: retained third-party license */ const title="LongDay"')).not.toThrow();
  });
});
