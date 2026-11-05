import type { DomainError } from '../DomainError'
import { ok, type Result } from '../Result'
import { accrueTown } from './accrueTown'
import { rebaseFullSince } from './rebaseFullSince'
import type { ChangedTown, Town } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { TownSkill } from './TownSkill'

export const earnTownSkill = (
  town: Town,
  skill: TownSkill,
  catalog: TownCatalog,
): Result<ChangedTown, DomainError> => {
  const accrual = accrueTown(town, catalog, skill.earnedAt)
  if (!accrual.ok) {
    return accrual
  }
  const rebased = rebaseFullSince(
    accrual.value.fullSince,
    town.earnSkill(skill, accrual.value.stocks),
    catalog,
  )
  if (!rebased.ok) {
    return rebased
  }
  const { lessonId, resource, ratePercent, earnedAt } = skill
  return ok({
    town: rebased.value,
    events: [{ kind: 'skillEarned', lessonId, resource, ratePercent, occurredAt: earnedAt }],
  })
}
