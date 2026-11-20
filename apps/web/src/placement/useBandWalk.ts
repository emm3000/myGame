import type { Placement, PlacementAnswers } from '@mygame/contracts'
import { useState } from 'react'

export type AskingPlacement = Extract<Placement, { readonly kind: 'asking' }>

export type PlacementItem = AskingPlacement['items'][number]

export interface BandWalk {
  readonly shown: PlacementItem | undefined
  readonly shownIndex: number
  readonly chosenForShown: string | undefined
  readonly isLastShown: boolean
  readonly choose: (choiceId: string) => void
  readonly next: () => void
  readonly answers: () => PlacementAnswers | undefined
}

export function useBandWalk(asking: AskingPlacement): BandWalk {
  const [shownIndex, setShownIndex] = useState(0)
  const [chosen, setChosen] = useState<Readonly<Record<string, string>>>({})
  const shown = asking.items[shownIndex]
  const chosenForShown = shown === undefined ? undefined : chosen[shown.wordId]
  const isLastShown = shownIndex >= asking.items.length - 1
  return {
    shown,
    shownIndex,
    chosenForShown,
    isLastShown,
    choose: (choiceId) => {
      if (shown !== undefined) {
        setChosen({ ...chosen, [shown.wordId]: choiceId })
      }
    },
    next: () => {
      if (chosenForShown !== undefined && !isLastShown) {
        setShownIndex(shownIndex + 1)
      }
    },
    answers: () => {
      const answers = asking.items.flatMap(({ wordId }) => {
        const choiceId = chosen[wordId]
        return choiceId === undefined ? [] : [{ wordId, choiceId }]
      })
      return answers.length === asking.items.length ? { band: asking.band, answers } : undefined
    },
  }
}
