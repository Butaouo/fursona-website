export type EffectTier = 'high' | 'low';
// Touch input and CPU core counts are not evidence that an iPhone cannot animate.
export function effectTier(memory?: number, saveData = false): EffectTier {
  return saveData || (memory !== undefined && memory <= 2) ? 'low' : 'high';
}
export function sustainedSlowFrames(samples: number, slow: number, elapsed: number) {
  return elapsed >= 6000 && samples >= 80 && slow / samples > .6;
}
