import type { TownOverview } from '@mygame/contracts'
import { type Instant, jobInstantsOf, jobPhaseAt, type Town } from '@mygame/domain'
import { isoOf } from '../http/isoOf'

export const jobStateOf = (town: Town, at: Instant): TownOverview['job'] => {
  const slot = town.jobSlot
  if (slot.kind === 'idle') {
    return null
  }
  const { arrivesAt, leavesAt, returnsAt } = jobInstantsOf(slot)
  const { region, area, site } = slot.site
  return {
    site: { region, area, site },
    team: { worker: slot.team.worker, truck: slot.team.truck },
    hours: slot.hours,
    pay: { ...slot.pay },
    phase: jobPhaseAt(slot, at),
    sentAt: isoOf(slot.sentAt),
    arrivesAt: isoOf(arrivesAt),
    leavesAt: isoOf(leavesAt),
    returnsAt: isoOf(returnsAt),
    calledBackAt: slot.calledBackAt === undefined ? null : isoOf(slot.calledBackAt),
  }
}
