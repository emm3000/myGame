import type { HoldoutChecks } from '@mygame/contracts'
import type { HoldoutCheckView } from '@mygame/domain'

type HoldoutCheckState = HoldoutChecks['checks'][number]

const checkStateOf = (view: HoldoutCheckView): HoldoutCheckState => {
  switch (view.kind) {
    case 'due':
      return { kind: 'due', band: view.band, week: view.week }
    case 'asking':
      return {
        kind: 'asking',
        band: view.band,
        week: view.week,
        items: view.items.map(({ wordId, word, choices }) => ({
          wordId,
          word,
          choices: choices.map(({ choiceId, gloss }) => ({ choiceId, gloss })),
        })),
      }
  }
}

export const presentHoldoutChecks = (views: ReadonlyArray<HoldoutCheckView>): HoldoutChecks => ({
  checks: views.map(checkStateOf),
})
