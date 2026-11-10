import { reviewSkillRates } from '@mygame/catalog'
import type { ResourceKind } from '@mygame/contracts'
import { capitalize } from '../design-system/capitalize'
import { formatQuantity } from '../design-system/formatQuantity'
import { townResourceNameOf } from '../resources/townResourceNameOf'

const shownRateOf = (ratePerHour: number): string => formatQuantity(Math.floor(ratePerHour))

export function skillRatesLineOf(
  resource: ResourceKind,
  ratePerHourBefore: number,
  ratePerHourAfter: number,
): string {
  return reviewSkillRates({
    resource: capitalize(townResourceNameOf(resource)),
    before: shownRateOf(ratePerHourBefore),
    after: shownRateOf(ratePerHourAfter),
  })
}
