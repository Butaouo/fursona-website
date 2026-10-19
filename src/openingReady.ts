export const OPENING_RESOURCE_TIMEOUT = 8000;

const aborted = () => new DOMException('Opening cancelled', 'AbortError');

function primaryContent(signal: AbortSignal, doc: Document): Promise<Element> {
  return new Promise((resolve, reject) => {
    let observer: MutationObserver | undefined;
    const cleanup = () => { observer?.disconnect(); signal.removeEventListener('abort', cancel); };
    const cancel = () => { cleanup(); reject(aborted()); };
    const check = () => {
      const content = doc.querySelector('main .hero,main .content-heading,main .reader-heading');
      if (content) { cleanup(); resolve(content); return true; }
      return false;
    };
    if (signal.aborted) { cancel(); return; }
    signal.addEventListener('abort', cancel, { once: true });
    if (!check()) { observer = new MutationObserver(check); observer.observe(doc, { childList: true, subtree: true }); }
  });
}

function decodedImage(image: HTMLImageElement, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      image.removeEventListener('load', loaded); image.removeEventListener('error', failed);
      signal.removeEventListener('abort', cancel);
    };
    const cancel = () => { cleanup(); reject(aborted()); };
    const failed = () => { cleanup(); resolve(); };
    const loaded = () => {
      // A cached image still needs decoding. Failed images settle without hiding
      // the existing artwork error UI or preventing the opening from finishing.
      const decoded = image.naturalWidth && image.decode ? image.decode().catch(() => {}) : Promise.resolve();
      void decoded.then(() => { cleanup(); resolve(); });
    };
    if (signal.aborted) { cancel(); return; }
    signal.addEventListener('abort', cancel, { once: true });
    image.addEventListener('load', loaded, { once: true });
    image.addEventListener('error', failed, { once: true });
    if (image.complete) loaded();
  });
}

/** Wait for real primary content, critical image decoding and layout fonts.
 * The deadline is an escape hatch, not a substitute for resource readiness.
 * Never await window.load, third-party players, music artwork or lazy content.
 */
export async function prepareOpening(signal: AbortSignal, doc = document, timeoutMs = OPENING_RESOURCE_TIMEOUT): Promise<'ready' | 'timeout'> {
  const pending = new AbortController();
  let deadline: ReturnType<typeof setTimeout> | undefined;
  let cancel: () => void = () => {};
  const cancelled = new Promise<never>((_, reject) => {
    cancel = () => { pending.abort(); reject(aborted()); };
    if (signal.aborted) cancel();
    else signal.addEventListener('abort', cancel, { once: true });
  });
  const resources = (async () => {
    await primaryContent(pending.signal, doc);
    // FontFaceSet.ready includes its layout work. Avoid forcing synchronous
    // layout here; the visible-frame gate verifies the main layout afterwards.
    const images = Array.from(doc.querySelectorAll<HTMLImageElement>('.hero-image,.identity-card img,.wordmark img'));
    await Promise.all([doc.fonts?.ready.catch(() => {}), ...images.map(image => decodedImage(image, pending.signal))]);
    return 'ready' as const;
  })();
  const timedOut = new Promise<'timeout'>(resolve => { deadline = setTimeout(() => resolve('timeout'), timeoutMs); });
  try { return await Promise.race([resources, timedOut, cancelled]); }
  finally { clearTimeout(deadline); signal.removeEventListener('abort', cancel); pending.abort(); }
}

/** Two visible rAF callbacks straddle a rendering opportunity. A hidden tab or
 * Safari page-cache restoration must acquire fresh visible frames before play.
 */
export function afterVisiblePaint(signal: AbortSignal, doc = document, view: Window = window): Promise<void> {
  return new Promise((resolve, reject) => {
    let first = 0, second = 0;
    const cancelFrames = () => { view.cancelAnimationFrame(first); view.cancelAnimationFrame(second); first = second = 0; };
    const cleanup = () => {
      cancelFrames(); signal.removeEventListener('abort', cancel);
      doc.removeEventListener('visibilitychange', schedule); view.removeEventListener('pageshow', schedule);
    };
    const cancel = () => { cleanup(); reject(aborted()); };
    const schedule = () => {
      cancelFrames();
      if (doc.visibilityState !== 'visible') return;
      first = view.requestAnimationFrame(() => {
        first = 0;
        if (doc.visibilityState !== 'visible') return;
        second = view.requestAnimationFrame(() => {
          second = 0;
          const bounds = doc.querySelector('main')?.getBoundingClientRect();
          if (doc.visibilityState === 'visible' && bounds && bounds.width > 0 && bounds.height > 0) {
            cleanup(); resolve();
          } else schedule();
        });
      });
    };
    if (signal.aborted) { cancel(); return; }
    signal.addEventListener('abort', cancel, { once: true });
    doc.addEventListener('visibilitychange', schedule); view.addEventListener('pageshow', schedule);
    schedule();
  });
}
