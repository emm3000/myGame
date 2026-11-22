import type { WordSupport } from '../../scaffold/domain/WordSupport'

export type FrameSpan = {
  readonly text: string
  readonly support: WordSupport | null
}

export type FrameSpans = readonly [FrameSpan, ...ReadonlyArray<FrameSpan>]
