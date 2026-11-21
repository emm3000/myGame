import { finishSeparator } from './finishSeparator'

export function joinFinishPieces(pieces: ReadonlyArray<string>): string {
  return pieces.join(` ${finishSeparator} `)
}
