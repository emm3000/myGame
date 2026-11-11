import { type JobQuote, type SendJob, SendJobSchema, type TownOverview } from '@mygame/contracts'
import { useEffect, useState } from 'react'
import type { TownJob } from './useJob'

interface AnsweredQuote {
  readonly asked: string
  readonly seasonEndsAt: string | undefined
  readonly quote: JobQuote
}

export function useJobQuote(
  quote: TownJob['quote'],
  job: SendJob | undefined,
  season: TownOverview['season'],
): JobQuote | undefined {
  const asked = job === undefined ? undefined : JSON.stringify(job)
  const seasonEndsAt = season?.endsAt
  const [answered, setAnswered] = useState<AnsweredQuote>()

  useEffect(() => {
    if (asked === undefined) {
      return
    }
    let isAskedStill = true
    void quote(SendJobSchema.parse(JSON.parse(asked))).then((outcome) => {
      if (outcome.ok && isAskedStill) {
        setAnswered({ asked, seasonEndsAt, quote: outcome.value })
      }
    })
    return () => {
      isAskedStill = false
    }
  }, [asked, seasonEndsAt, quote])

  const isCurrent = answered?.asked === asked && answered?.seasonEndsAt === seasonEndsAt
  return isCurrent ? answered?.quote : undefined
}
