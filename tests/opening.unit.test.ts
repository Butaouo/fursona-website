import { afterEach, describe, expect, it, vi } from 'vitest';
import { afterVisiblePaint, prepareOpening } from '../src/openingReady';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
};
class ImageProbe extends EventTarget {
  complete = false;
  naturalWidth = 640;
  decoded = deferred();
  decode = vi.fn(() => this.decoded.promise);
}
class DocumentProbe extends EventTarget {
  visibilityState = 'visible';
  width = 390;
  fonts = { ready: Promise.resolve() };
  images: ImageProbe[] = [];
  querySelector = () => ({ getBoundingClientRect: () => ({ width: this.width, height: 844 }) });
  querySelectorAll = () => this.images;
}
class Frames extends EventTarget {
  next = 0;
  pending = new Map<number, FrameRequestCallback>();
  requestAnimationFrame = (callback: FrameRequestCallback) => { this.pending.set(++this.next, callback); return this.next; };
  cancelAnimationFrame = (id: number) => { this.pending.delete(id); };
  frame() { const callbacks = [...this.pending.values()]; this.pending.clear(); callbacks.forEach(callback => callback(0)); }
}
const asDocument = (doc: DocumentProbe) => doc as unknown as Document;
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
afterEach(() => vi.useRealTimers());

describe('opening readiness is based on resources, not a playback delay', () => {
  it('waits for both image decoding and the layout font promise', async () => {
    const doc = new DocumentProbe(), image = new ImageProbe(), font = deferred();
    doc.images = [image]; doc.fonts.ready = font.promise;
    let settled = false;
    const ready = prepareOpening(new AbortController().signal, asDocument(doc)).then(result => { settled = true; return result; });
    await flush(); expect(settled).toBe(false);
    image.complete = true; image.dispatchEvent(new Event('load'));
    await flush(); expect(image.decode).toHaveBeenCalled(); expect(settled).toBe(false);
    image.decoded.resolve(); await flush(); expect(settled).toBe(false);
    font.resolve(); expect(await ready).toBe('ready');
  });
  it('decodes complete cached images instead of assuming complete means painted', async () => {
    const doc = new DocumentProbe(), image = new ImageProbe(); image.complete = true; doc.images = [image];
    let settled = false;
    const ready = prepareOpening(new AbortController().signal, asDocument(doc)).then(result => { settled = true; return result; });
    await flush(); expect(image.decode).toHaveBeenCalledOnce(); expect(settled).toBe(false);
    image.decoded.resolve(); expect(await ready).toBe('ready');
  });
  it('allows an image failure to settle while preserving the page fallback', async () => {
    const doc = new DocumentProbe(), image = new ImageProbe(); doc.images = [image];
    const ready = prepareOpening(new AbortController().signal, asDocument(doc)); await flush();
    image.naturalWidth = 0; image.dispatchEvent(new Event('error'));
    expect(await ready).toBe('ready'); expect(image.decode).not.toHaveBeenCalled();
  });
  it('uses the deadline only for genuinely stalled resources', async () => {
    vi.useFakeTimers(); const doc = new DocumentProbe(); doc.fonts.ready = new Promise(() => {});
    let result: string | undefined;
    const ready = prepareOpening(new AbortController().signal, asDocument(doc)).then(value => { result = value; });
    await vi.advanceTimersByTimeAsync(7999); expect(result).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1); await ready; expect(result).toBe('timeout'); expect(vi.getTimerCount()).toBe(0);
  });
  it('cancels preparation and clears the deadline on navigation or unmount', async () => {
    vi.useFakeTimers(); const doc = new DocumentProbe(), controller = new AbortController();
    doc.fonts.ready = new Promise(() => {});
    const ready = prepareOpening(controller.signal, asDocument(doc));
    const rejected = expect(ready).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort(); await rejected; expect(vi.getTimerCount()).toBe(0);
  });
});

describe('opening requires fresh visible rendering opportunities', () => {
  it('cannot start in a hidden document and requires two visible frames', async () => {
    const doc = new DocumentProbe(), frames = new Frames(); doc.visibilityState = 'hidden';
    let painted = false;
    const ready = afterVisiblePaint(new AbortController().signal, asDocument(doc), frames as unknown as Window).then(() => { painted = true; });
    frames.frame(); frames.frame(); await flush(); expect(painted).toBe(false); expect(frames.pending.size).toBe(0);
    doc.visibilityState = 'visible'; doc.dispatchEvent(new Event('visibilitychange'));
    frames.frame(); await flush(); expect(painted).toBe(false);
    frames.frame(); await ready; expect(painted).toBe(true);
  });
  it('discards frames interrupted by hiding and reacquires them on return', async () => {
    const doc = new DocumentProbe(), frames = new Frames(); let painted = false;
    const ready = afterVisiblePaint(new AbortController().signal, asDocument(doc), frames as unknown as Window).then(() => { painted = true; });
    frames.frame(); doc.visibilityState = 'hidden'; doc.dispatchEvent(new Event('visibilitychange'));
    frames.frame(); await flush(); expect(painted).toBe(false);
    doc.visibilityState = 'visible'; frames.dispatchEvent(new Event('pageshow'));
    frames.frame(); await flush(); expect(painted).toBe(false);
    frames.frame(); await ready; expect(painted).toBe(true);
  });
  it('waits for a nonzero rendered main layout', async () => {
    const doc = new DocumentProbe(), frames = new Frames(); doc.width = 0; let painted = false;
    const ready = afterVisiblePaint(new AbortController().signal, asDocument(doc), frames as unknown as Window).then(() => { painted = true; });
    frames.frame(); frames.frame(); await flush(); expect(painted).toBe(false);
    doc.width = 390; frames.frame(); frames.frame(); await ready; expect(painted).toBe(true);
  });
  it('cancels pending frame callbacks when preparation is aborted', async () => {
    const doc = new DocumentProbe(), frames = new Frames(), controller = new AbortController();
    const ready = afterVisiblePaint(controller.signal, asDocument(doc), frames as unknown as Window);
    const rejected = expect(ready).rejects.toMatchObject({ name: 'AbortError' });
    frames.frame(); controller.abort(); await rejected; expect(frames.pending.size).toBe(0);
  });
});
