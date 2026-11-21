import type { PlayerCopy } from '../copy/PlayerCopy'
import { spokenLineOf } from '../design-system/spokenLineOf'
import { skillRatesLineOf } from '../review/skillRatesLineOf'
import { placeNameOf } from './placeNameOf'
import type { Registered } from './registeredBetween'

export function registeredLineOf(
  copy: PlayerCopy,
  { places, retainedWords, rates }: Registered,
): string {
  const placeLines = places.map(({ place, level }) =>
    copy.chrome((catalog) =>
      catalog.reportNewsBuildingWorkFinished({ place: placeNameOf(catalog, place), level }),
    ),
  )
  const ringLines =
    retainedWords === undefined
      ? []
      : [
          copy.chrome((catalog) =>
            catalog.shellRetainedWords({ count: retainedWords.count, total: retainedWords.total }),
          ),
        ]
  const rateLines = rates.map(({ resource, ratePerHourBefore, ratePerHourAfter }) =>
    skillRatesLineOf(resource, ratePerHourBefore, ratePerHourAfter),
  )
  return [...[...placeLines, ...ringLines].map(spokenLineOf), ...rateLines].join(' ')
}
