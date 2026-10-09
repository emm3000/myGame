import { finishSeparator } from './finishSeparator'
import { formatFinishPieces } from './formatFinishPieces'

export function formatFinish(remainingSeconds: number, now: Date): string {
  return formatFinishPieces(remainingSeconds, now).join(` ${finishSeparator} `)
}
