import { useState } from 'react'

export interface WalkChoice {
  readonly choiceId: string
  readonly gloss: string
}

export interface WalkItem {
  readonly wordId: string
  readonly word: string
  readonly choices: ReadonlyArray<WalkChoice>
}

export interface ChosenAnswer {
  readonly wordId: string
  readonly choiceId: string
}

export interface ChoiceWalkState {
  readonly shown: WalkItem | undefined
  readonly shownIndex: number
  readonly chosenForShown: string | undefined
  readonly isLastShown: boolean
  readonly choose: (choiceId: string) => void
  readonly next: () => void
  readonly answers: () => ReadonlyArray<ChosenAnswer> | undefined
}

export function useChoiceWalk(items: ReadonlyArray<WalkItem>): ChoiceWalkState {
  const [shownIndex, setShownIndex] = useState(0)
  const [chosen, setChosen] = useState<Readonly<Record<string, string>>>({})
  const shown = items[shownIndex]
  const chosenForShown = shown === undefined ? undefined : chosen[shown.wordId]
  const isLastShown = shownIndex >= items.length - 1
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
      const answers = items.flatMap(({ wordId }) => {
        const choiceId = chosen[wordId]
        return choiceId === undefined ? [] : [{ wordId, choiceId }]
      })
      return answers.length === items.length ? answers : undefined
    },
  }
}
