import { describe, expect, it } from 'vitest';
import { effectTier, sustainedSlowFrames } from '../src/motionPolicy';
describe('animation quality preserves mobile motion', () => {
  it('keeps full effects when Safari does not expose memory', () => expect(effectTier()).toBe('high'));
  it('keeps full effects on a normal 4 GB device', () => expect(effectTier(4)).toBe('high'));
  it('reduces effects on genuinely small-memory devices', () => expect(effectTier(1)).toBe('low'));
  it('respects data saver without declaring animation disabled', () => expect(effectTier(8, true)).toBe('low'));
  it('ignores startup stalls and too few samples', () => { expect(sustainedSlowFrames(200,180,1500)).toBe(false); expect(sustainedSlowFrames(40,40,9000)).toBe(false); });
  it('requires sustained slow delivery rather than occasional drops', () => { expect(sustainedSlowFrames(180,70,6500)).toBe(false); expect(sustainedSlowFrames(100,70,6500)).toBe(true); });
  it('detects very slow compositors after a longer observation window', () => { expect(sustainedSlowFrames(30,28,16000)).toBe(true); expect(sustainedSlowFrames(30,5,16000)).toBe(false); });
});
