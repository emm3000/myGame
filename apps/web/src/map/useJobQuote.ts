import { type JobQuote, type SendJob, SendJobSchema, type TownOverview } from '@mygame/contracts'
import { useEffect, useState } from 'react'
import type { ApiOutcome } from '../api/apiClient'
import type { TownJob } from './useJob'

const unreachableRetryMs = 5000

interface AnsweredQuote {
  readonly asked: string
  readonly seasonEndsAt: string | undefined
  readonly outcome: ApiOutcome<JobQuote>
}

const isUnreachable = (outcome: ApiOutcome<JobQuote>): boolean =>
  !outcome.ok && outcome.refusal === 'Unexpected'

export function useJobQuote(
  quote: TownJob['quote'],
  job: SendJob | undefined,
  season: TownOverview['season'],
): ApiOutcome<JobQuote> | undefined {
  const asked = job === undefined ? undefined : JSON.stringify(job)
  const seasonEndsAt = season?.endsAt
  const [answered, setAnswered] = useState<AnsweredQuote>()

  useEffect(() => {
    if (asked === undefined) {
      return
    }
    let isAskedStill = true
    let retry: ReturnType<typeof setTimeout> | undefined
    const ask = (): void => {
      void quote(SendJobSchema.parse(JSON.parse(asked))).then((outcome) => {
        if (!isAskedStill) {
          return
        }
        setAnswered({ asked, seasonEndsAt, outcome })
        if (isUnreachable(outcome)) {
          retry = setTimeout(ask, unreachableRetryMs)
        }
      })
    }
    ask()
    return () => {
      isAskedStill = false
      clearTimeout(retry)
    }
  }, [asked, seasonEndsAt, quote])

  const isCurrent = answered?.asked === asked && answered?.seasonEndsAt === seasonEndsAt
  return isCurrent ? answered?.outcome : undefined
}
