import type { DueReview, ReviewHint, ReviewVerdict } from '@mygame/contracts'
import { useRef, useState } from 'react'
import type { ApiClient, ApiRefusal } from '../api/apiClient'

export type RatedVerdict = Exclude<ReviewVerdict, { readonly kind: 'nearMiss' }>

export type Choice = Extract<DueReview, { readonly mode: 'recognition' }>['choices'][number]

export interface GivenAnswer {
  readonly verdict: RatedVerdict
  readonly given: string
}

interface Session {
  readonly card: DueReview | undefined
  readonly dueCount: number | undefined
  readonly typed: string
  readonly choice: Choice | undefined
  readonly hint: ReviewHint | undefined
  readonly isNearMiss: boolean
  readonly answered: GivenAnswer | undefined
}

const freshSession: Session = {
  card: undefined,
  dueCount: undefined,
  typed: '',
  choice: undefined,
  hint: undefined,
  isNearMiss: false,
  answered: undefined,
}

export interface ReviewHandle {
  readonly card: DueReview | undefined
  readonly dueCount: number
  readonly walked: number
  readonly typed: string
  readonly choice: Choice | undefined
  readonly hint: ReviewHint | undefined
  readonly isNearMiss: boolean
  readonly answered: GivenAnswer | undefined
  readonly isWaiting: boolean
  readonly refusal: ApiRefusal | undefined
  readonly type: (typed: string) => void
  readonly choose: (choice: Choice) => void
  readonly askHint: () => void
  readonly check: () => void
  readonly next: () => void
}

interface Answer {
  readonly sent: string
  readonly given: string
}

function answerOf(card: DueReview, session: Session): Answer | undefined {
  if (card.mode === 'recall') {
    return session.typed === '' ? undefined : { sent: session.typed, given: session.typed }
  }
  if (session.choice === undefined) {
    return undefined
  }
  return { sent: session.choice.choiceId, given: session.choice.gloss }
}

export function useReview(
  apiClient: ApiClient,
  due: ReadonlyArray<DueReview>,
  reread: () => Promise<void>,
): ReviewHandle {
  const [session, setSession] = useState<Session>(freshSession)
  const [walked, setWalked] = useState(0)
  const [isWaiting, setIsWaiting] = useState(false)
  const [refusal, setRefusal] = useState<ApiRefusal>()
  const isInFlight = useRef(false)
  const card = session.card ?? due[0]

  const holding = (change: Partial<Session>): void => {
    setSession((current) => ({
      ...current,
      card: current.card ?? card,
      dueCount: current.dueCount ?? due.length,
      ...change,
    }))
  }

  const sending = async (call: () => Promise<void>): Promise<void> => {
    if (isInFlight.current) {
      return
    }
    isInFlight.current = true
    setIsWaiting(true)
    setRefusal(undefined)
    await call()
    isInFlight.current = false
    setIsWaiting(false)
  }

  const askHint = (): void => {
    if (card === undefined) {
      return
    }
    void sending(async () => {
      const outcome = await apiClient.reviewHint(card.wordId)
      if (!outcome.ok) {
        setRefusal(outcome.refusal)
        return
      }
      holding({ hint: outcome.value })
    })
  }

  const check = (): void => {
    const answer = card === undefined ? undefined : answerOf(card, session)
    if (card === undefined || answer === undefined) {
      return
    }
    void sending(async () => {
      const outcome = await apiClient.answerReview({ wordId: card.wordId, answer: answer.sent })
      if (!outcome.ok) {
        setRefusal(outcome.refusal)
        return
      }
      await reread()
      const { verdict } = outcome.value
      if (verdict.kind === 'nearMiss') {
        holding({ isNearMiss: true })
        return
      }
      holding({ isNearMiss: false, answered: { verdict, given: answer.given } })
    })
  }

  return {
    card,
    dueCount: session.dueCount ?? due.length,
    walked,
    typed: session.typed,
    choice: session.choice,
    hint: session.hint,
    isNearMiss: session.isNearMiss,
    answered: session.answered,
    isWaiting,
    refusal,
    type: (typed) => holding({ typed }),
    choose: (choice) => holding({ choice }),
    askHint,
    check,
    next: () => {
      setSession(freshSession)
      setWalked((count) => count + 1)
      setRefusal(undefined)
    },
  }
}
