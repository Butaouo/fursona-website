import { expect, it } from 'vitest';
// @ts-expect-error Server-only ESM is not bundled into the website.
import { parseDocument } from '../scripts/google-sync.mjs';

it('keeps every text-only paragraph including blank lines and exact formatted runs', async () => {
  const paragraphs = [
    { elements: [{ textRun: { content: '\n' } }] },
    { paragraphStyle: { namedStyleType: 'HEADING_2' }, elements: [{ textRun: { content: '標題\n', textStyle: { bold: true } } }] },
    { elements: [{ textRun: { content: '\n' } }] },
    { elements: [{ textRun: { content: '第一行\n第二行\n', textStyle: { italic: true } } }] },
    { elements: [{ textRun: { content: '\n' } }] },
  ];
  const blocks = await parseDocument({ body: { content: paragraphs.map(paragraph => ({ paragraph })) } }, undefined, () => { throw new Error('Unexpected image'); });
  expect(blocks.map((block: { type: string }) => block.type)).toEqual(['paragraph', 'heading', 'paragraph', 'paragraph', 'paragraph']);
  expect(blocks.flatMap((block: { runs: unknown[] }) => block.runs)).toEqual([
    { text: '\n' }, { text: '標題\n', bold: true }, { text: '\n' },
    { text: '第一行\n第二行\n', italic: true }, { text: '\n' },
  ]);
});

it('does not add spacer blocks for the structural newline after an inline image', async () => {
  const document = {
    body: { content: [{ paragraph: { elements: [{ inlineObjectElement: { inlineObjectId: 'image' } }, { textRun: { content: '\n' } }] } }, { paragraph: { elements: [{ textRun: { content: '\n' } }] } }] },
    inlineObjects: { image: { inlineObjectProperties: { embeddedObject: { imageProperties: { contentUri: 'https://lh3.googleusercontent.com/fixture' } } } } },
  };
  const blocks = await parseDocument(document, undefined, async () => ({ src: 'content/media/fixture.webp', width: 10, height: 20 }));
  expect(blocks.map((block: { type: string }) => block.type)).toEqual(['image', 'paragraph']);
  expect(blocks[1].runs).toEqual([{ text: '\n' }]);
});

it('still rejects a document made only of blank paragraphs', async () => {
  await expect(parseDocument({ body: { content: [{ paragraph: { elements: [{ textRun: { content: '\n' } }] } }, { paragraph: { elements: [{ textRun: { content: '  \n' } }] } }] } }, undefined, () => {})).rejects.toThrow('Refusing to publish an empty document');
});
