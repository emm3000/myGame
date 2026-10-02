import type { FiefOverview } from '@mygame/contracts'
import { useCallback, useRef, useState } from 'react'
import type { ApiOutcome, ApiRefusal } from '../api/apiClient'

export interface RefusedAction<Subject> {
  readonly subject: Subject
  readonly refusal: ApiRefusal
  readonly message: string | undefined
}

export interface FiefAction<Subject> {
  readonly isWaiting: boolean
  readonly refused: RefusedAction<Subject> | undefined
  readonly run: (subject: Subject, call: () => Promise<ApiOutcome<FiefOverview>>) => void
}

interface RefusalOfRead<Subject> extends RefusedAction<Subject> {
  readonly readAt: string | undefined
}

export function useFiefAction<Subject>(
  adopt: (overview: FiefOverview) => void,
  readAt: string | undefined,
): FiefAction<Subject> {
  const [isWaiting, setIsWaiting] = useState(false)
  const [refused, setRefused] = useState<RefusalOfRead<Subject>>()
  const isInFlight = useRef(false)

  const run = useCallback(
    async (subject: Subject, call: () => Promise<ApiOutcome<FiefOverview>>): Promise<void> => {
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
        return
      }
      setRefused({ subject, refusal: outcome.refusal, message: outcome.message, readAt })
    },
    [adopt, readAt],
  )

  return {
    isWaiting,
    refused: refused?.readAt === readAt ? refused : undefined,
    run: (subject, call) => void run(subject, call),
  }
}
