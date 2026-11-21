import type { FixedLinePieces } from '../copy/PlayerCopy'
import { joinFinishPieces } from '../time/joinFinishPieces'
import type { LiveTown } from '../town/liveTown'
import { capWaitPiecesOf } from './capWaitPiecesOf'

export function capWaitLabelOf(catalog: FixedLinePieces, town: LiveTown): string | null {
  const pieces = capWaitPiecesOf(catalog, town)
  return pieces === null ? null : joinFinishPieces(pieces)
}
