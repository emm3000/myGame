import type { PlayerCopy } from '../copy/PlayerCopy'
import type { Label } from '../design-system/Label'
import { formatFinish } from '../time/formatFinish'

export const finishTimeOf = (copy: PlayerCopy, remainingSeconds: number, now: Date): Label =>
  copy.chrome((catalog) => formatFinish(catalog, remainingSeconds, now))
