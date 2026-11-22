import type { FsrsParameters } from './MemoryTerms'

export type ForgettingCurve = {
  readonly decay: number
  readonly factor: number
}

const RETRIEVABILITY_AT_STABILITY = 0.9

export const forgettingCurveOf = (parameters: FsrsParameters): ForgettingCurve => {
  const decay = -parameters[20]
  return { decay, factor: RETRIEVABILITY_AT_STABILITY ** (1 / decay) - 1 }
}
