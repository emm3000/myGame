import type { ApiError, TownOverview } from '@mygame/contracts'
import { useCallback, useRef, useState } from 'react'
import type { ApiOutcome, ApiRefusal } from '../api/apiClient'

export interface RefusedTownAction<Subject> {
  readonly subject: Subject
  readonly refusal: ApiRefusal
  readonly error: ApiError | undefined
}

export interface TownAction<Subject> {
  readonly isWaiting: boolean
  readonly refused: RefusedTownAction<Subject> | undefined
  readonly run: (
    subject: Subject,
    call: () => Promise<ApiOutcome<TownOverview>>,
    onAdopted?: () => void,
  ) => void
}

interface RefusalOfRead<Subject> extends RefusedTownAction<Subject> {
  readonly readAt: string
}

export function useTownAction<Subject>(
  adopt: (overview: TownOverview) => void,
  readAt: string,
): TownAction<Subject> {
  const [isWaiting, setIsWaiting] = useState(false)
  const [refused, setRefused] = useState<RefusalOfRead<Subject>>()
  const isInFlight = useRef(false)

  const run = useCallback(
    async (
      subject: Subject,
      call: () => Promise<ApiOutcome<TownOverview>>,
      onAdopted: (() => void) | undefined,
    ): Promise<void> => {
      if (isInFlight.current) {
        return
      }
      isInFlight.current = true
      setIsWaiting(true)
      setRefused(undefined)
      const outcome = await call()
      isInFlight.current = false
      setIsWaiting(false)
      if (outcome.ok) {
        adopt(outcome.value)
        onAdopted?.()
        return
      }
      setRefused({ subject, refusal: outcome.refusal, error: outcome.error, readAt })
    },
    [adopt, readAt],
  )

  return {
    isWaiting,
    refused: refused?.readAt === readAt ? refused : undefined,
    run: (subject, call, onAdopted) => void run(subject, call, onAdopted),
  }
}
