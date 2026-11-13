import type { FrameSpan } from '@mygame/contracts'

export function frameTextOf(frame: ReadonlyArray<FrameSpan>): string {
  return frame.map(({ text }) => text).join('')
}
