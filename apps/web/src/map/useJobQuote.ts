import type { JobQuote, SendJob } from '@mygame/contracts'
import { useEffect, useRef, useState } from 'react'
import type { TownJob } from './useJob'

interface AnsweredQuote {
  readonly asked: string
  readonly quote: JobQuote
}

export function useJobQuote(
  quote: TownJob['quote'],
  job: SendJob | undefined,
): JobQuote | undefined {
  const asked = job === undefined ? undefined : JSON.stringify(job)
  const [answered, setAnswered] = useState<AnsweredQuote>()
  const shownJob = useRef(job)
  const lastAsked = useRef(asked)
  shownJob.current = job

  useEffect(() => {
    lastAsked.current = asked
    const toQuote = shownJob.current
    if (asked === undefined || toQuote === undefined) {
      return
    }
    void quote(toQuote).then((outcome) => {
      if (outcome.ok && lastAsked.current === asked) {
        setAnswered({ asked, quote: outcome.value })
      }
    })
  }, [asked, quote])

  return answered !== undefined && answered.asked === asked ? answered.quote : undefined
}
