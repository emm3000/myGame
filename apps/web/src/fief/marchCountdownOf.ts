import { foundingArrivalHeading, marchReturnHeading } from '@mygame/catalog'
import { isFoundingOnTheWay, type LiveFief, type LiveMarch } from './liveFief'

type AnsweredMarch = NonNullable<LiveFief['overview']['march']>

export interface MarchCountdown {
  readonly words: string
  readonly remainingSeconds: number
}

export function marchCountdownOf(live: LiveMarch, answered: AnsweredMarch): MarchCountdown {
  if (isFoundingOnTheWay(answered)) {
    return { words: foundingArrivalHeading(), remainingSeconds: live.remainingSeconds }
  }
  if (answered.order === 'transport' && live.phase === 'outbound') {
    return {
      words: foundingArrivalHeading(),
      remainingSeconds: live.arrivalSeconds - live.elapsedSeconds,
    }
  }
  return { words: marchReturnHeading(), remainingSeconds: live.remainingSeconds }
}
