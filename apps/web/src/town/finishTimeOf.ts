import type { PlayerCopy } from '../copy/PlayerCopy'
import { formatFinish } from '../time/formatFinish'

export const finishTimeOf = (copy: PlayerCopy, remainingSeconds: number, now: Date): string =>
  copy.chrome((catalog) => formatFinish(catalog, remainingSeconds, now)).text
