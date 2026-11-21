import type { FixedLinePieces } from '../copy/PlayerCopy'
import { finishSeparator } from './finishSeparator'
import { formatFinishPieces } from './formatFinishPieces'

export function formatFinish(
  catalog: FixedLinePieces,
  remainingSeconds: number,
  now: Date,
): string {
  return formatFinishPieces(catalog, remainingSeconds, now).join(` ${finishSeparator} `)
}
