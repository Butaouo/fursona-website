import { useEffect, useRef } from 'react';
import type { Language } from '../config/site';
import { copy } from '../content';

/** Keep the existing hash URL while naming the character reference page consistently. */
export function usePageMetadata(route: string, language: Language) {
  const original = useRef<{ title: string; values: Array<{ node: Element; content: string }> } | null>(null);
  useEffect(() => {
    if (!original.current) original.current = {
      title: document.title,
      values: Array.from(document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[name="twitter:title"]')).map(node => ({ node, content: node.getAttribute('content') || '' })),
    };
    const character = route === 'about';
    const title = `${copy('about', language)} · LongDay`;
    document.title = character ? title : original.current.title;
    for (const { node, content } of original.current.values) {
      const isTitle = (node.getAttribute('property') || node.getAttribute('name') || '').endsWith('title');
      node.setAttribute('content', character ? (isTitle ? title : copy('characterDescription', language)) : content);
    }
  }, [route, language]);
}
