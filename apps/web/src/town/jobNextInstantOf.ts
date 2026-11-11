import type { TownOverview } from '@mygame/contracts'

type JobState = NonNullable<TownOverview['job']>

export function jobNextInstantOf(job: JobState): string {
  switch (job.phase) {
    case 'outbound':
      return job.arrivesAt
    case 'working':
      return job.leavesAt
    case 'returning':
      return job.returnsAt
    default: {
      const unreachable: never = job.phase
      return unreachable
    }
  }
}
