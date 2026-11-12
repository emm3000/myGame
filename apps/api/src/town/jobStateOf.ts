import type { TownOverview } from '@mygame/contracts'
import { type Instant, type Job, jobInstantsOf, jobPhaseAt, type Town } from '@mygame/domain'
import { isoOf } from '../http/isoOf'

type TownJob = NonNullable<TownOverview['job']>

type OutFields = Omit<TownJob, 'kind' | 'hours' | 'size' | 'waste'>

const outFieldsOf = (job: Job, at: Instant): OutFields => {
  const { arrivesAt, leavesAt, returnsAt } = jobInstantsOf(job)
  const { region, area, site } = job.site
  return {
    site: { region, area, site },
    team: { worker: job.team.worker, truck: job.team.truck },
    pay: { ...job.pay },
    phase: jobPhaseAt(job, at),
    sentAt: isoOf(job.sentAt),
    arrivesAt: isoOf(arrivesAt),
    leavesAt: isoOf(leavesAt),
    returnsAt: isoOf(returnsAt),
    calledBackAt: job.calledBackAt === undefined ? null : isoOf(job.calledBackAt),
  }
}

export const jobStateOf = (town: Town, at: Instant): TownOverview['job'] => {
  const slot = town.jobSlot
  if (slot.kind === 'idle') {
    return null
  }
  const out = outFieldsOf(slot, at)
  const { cleanUp } = slot
  return cleanUp === undefined
    ? { kind: 'job', ...out, hours: slot.hours }
    : { kind: 'cleanUp', ...out, size: cleanUp.size, waste: cleanUp.waste }
}
