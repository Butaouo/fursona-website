import { useEffect, useRef } from 'react';
import type { Language } from '../config/site';
import { copy } from '../content';
import { routePath } from '../router';

/** Keep the existing hash URLs while localizing their page titles. */
export function usePageMetadata(route: string, language: Language) {
  const original = useRef<{ title: string; values: Array<{ node: Element; content: string }> } | null>(null);
  useEffect(() => {
    if (!original.current) original.current = {
      title: document.title,
      values: Array.from(document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[name="twitter:title"]')).map(node => ({ node, content: node.getAttribute('content') || '' })),
    };
    const character = route === 'about';
    const articles = routePath(route) === 'archive';
    const title = `${copy(articles ? 'archive' : 'about', language)} · LongDay`;
    document.title = character || articles ? title : original.current.title;
    for (const { node, content } of original.current.values) {
      const isTitle = (node.getAttribute('property') || node.getAttribute('name') || '').endsWith('title');
      node.setAttribute('content', (character || articles) && isTitle ? title : character ? copy('characterDescription', language) : content);
    }
  }, [route, language]);
}
