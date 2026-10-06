import { copy } from '../copy'
import { isFoundingOnTheWay, type LiveFief, type LiveMarch } from './liveFief'

const { march, founding } = copy

type AnsweredMarch = NonNullable<LiveFief['overview']['march']>

export interface MarchCountdown {
  readonly words: string
  readonly remainingSeconds: number
}

export function marchCountdownOf(live: LiveMarch, answered: AnsweredMarch): MarchCountdown {
  if (isFoundingOnTheWay(answered)) {
    return { words: founding.arrivalHeading, remainingSeconds: live.remainingSeconds }
  }
  if (answered.order === 'transport' && live.phase === 'outbound') {
    return {
      words: founding.arrivalHeading,
      remainingSeconds: live.arrivalSeconds - live.elapsedSeconds,
    }
  }
  return { words: march.returnHeading, remainingSeconds: live.remainingSeconds }
}
