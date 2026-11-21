import type { ChromeCatalog } from '../copy/PlayerCopy'
import { finishSeparator } from './finishSeparator'
import { formatFinishPieces } from './formatFinishPieces'

export function formatFinish(catalog: ChromeCatalog, remainingSeconds: number, now: Date): string {
  return formatFinishPieces(catalog, remainingSeconds, now).join(` ${finishSeparator} `)
}
