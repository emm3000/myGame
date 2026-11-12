import type { TownOverview } from '@mygame/contracts'
import { useEffect, useState } from 'react'
import type { ZodType } from 'zod'
import type { ApiOutcome } from '../api/apiClient'

const unreachableRetryMs = 5000

interface AnsweredQuote<Answer> {
  readonly asked: string
  readonly seasonEndsAt: string | undefined
  readonly outcome: ApiOutcome<Answer>
}

const isUnreachable = <Answer>(outcome: ApiOutcome<Answer>): boolean =>
  !outcome.ok && outcome.refusal === 'Unexpected'

export function useQuote<Asked, Answer>(
  quote: (asked: Asked) => Promise<ApiOutcome<Answer>>,
  schema: ZodType<Asked>,
  request: Asked | undefined,
  season: TownOverview['season'],
): ApiOutcome<Answer> | undefined {
  const asked = request === undefined ? undefined : JSON.stringify(request)
  const seasonEndsAt = season?.endsAt
  const [answered, setAnswered] = useState<AnsweredQuote<Answer>>()

  useEffect(() => {
    if (asked === undefined) {
      return
    }
    let isAskedStill = true
    let retry: ReturnType<typeof setTimeout> | undefined
    const ask = (): void => {
      void quote(schema.parse(JSON.parse(asked))).then((outcome) => {
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
  }, [asked, seasonEndsAt, quote, schema])

  const isCurrent = answered?.asked === asked && answered?.seasonEndsAt === seasonEndsAt
  return isCurrent ? answered?.outcome : undefined
}
