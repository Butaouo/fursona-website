export type EffectTier = 'high' | 'low';
// Touch input and CPU core counts are not evidence that an iPhone cannot animate.
export function effectTier(memory?: number, saveData = false): EffectTier {
  return saveData || (memory !== undefined && memory <= 2) ? 'low' : 'high';
}
export function sustainedSlowFrames(samples: number, slow: number, elapsed: number) {
  const enoughSamples = samples >= 80 || (elapsed >= 15000 && samples >= 20);
  return elapsed >= 6000 && enoughSamples && slow / samples > .6;
}
