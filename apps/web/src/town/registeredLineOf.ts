import { reportNewsBuildingWorkFinished, shellRetainedWords } from '@mygame/catalog'
import { skillRatesLineOf } from '../review/skillRatesLineOf'
import { placeNameOf } from './placeNameOf'
import type { Registered } from './registeredBetween'

export function registeredLineOf({ places, retainedWords, rates }: Registered): string {
  const placeLines = places.map(({ place, level }) =>
    reportNewsBuildingWorkFinished({ place: placeNameOf(place), level }),
  )
  const ringLines =
    retainedWords === undefined
      ? []
      : [shellRetainedWords({ count: retainedWords.count, total: retainedWords.total })]
  const rateLines = rates.map(({ resource, ratePerHourBefore, ratePerHourAfter }) =>
    skillRatesLineOf(resource, ratePerHourBefore, ratePerHourAfter),
  )
  return [...placeLines, ...ringLines, ...rateLines].join(' ')
}
