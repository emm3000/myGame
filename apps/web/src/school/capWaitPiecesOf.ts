import type { FixedLinePieces } from '../copy/PlayerCopy'
import { formatFinishPieces } from '../time/formatFinishPieces'
import type { LiveTown } from '../town/liveTown'

export function capWaitPiecesOf(
  catalog: FixedLinePieces,
  { overview, at }: LiveTown,
): ReadonlyArray<string> | null {
  const dueAt = overview.learning.nextInLearningDueAt
  if (dueAt === null || overview.nextStep.kind === 'reviews') {
    return null
  }
  const remainingSeconds = (Date.parse(dueAt) - at.getTime()) / 1000
  return remainingSeconds > 0 ? formatFinishPieces(catalog, remainingSeconds, at) : null
}
