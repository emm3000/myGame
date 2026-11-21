import type { FixedLinePieces } from '../copy/PlayerCopy'
import { formatFinishPieces } from './formatFinishPieces'
import { joinFinishPieces } from './joinFinishPieces'

export function formatFinish(
  catalog: FixedLinePieces,
  remainingSeconds: number,
  now: Date,
): string {
  return joinFinishPieces(formatFinishPieces(catalog, remainingSeconds, now))
}
