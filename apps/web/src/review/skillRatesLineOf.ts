import type { ResourceKind } from '@mygame/contracts'
import type { PlayerCopy } from '../copy/PlayerCopy'
import { capitalize } from '../design-system/capitalize'
import { formatQuantity } from '../design-system/formatQuantity'
import type { Label } from '../design-system/Label'
import { townResourceNameOf } from '../resources/townResourceNameOf'

const shownRateOf = (ratePerHour: number): string => formatQuantity(Math.floor(ratePerHour))

export function skillRatesLineOf(
  { fixedCopy }: PlayerCopy,
  resource: ResourceKind,
  ratePerHourBefore: number,
  ratePerHourAfter: number,
): Label {
  return fixedCopy((catalog, pieces) =>
    catalog.reviewSkillRates({
      resource: capitalize(townResourceNameOf(pieces, resource)),
      before: shownRateOf(ratePerHourBefore),
      after: shownRateOf(ratePerHourAfter),
    }),
  )
}
