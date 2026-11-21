import { type HoldoutChecks, PlacementBandSchema } from '@mygame/contracts'
import type { HoldoutCheckView } from '@mygame/domain'

type HoldoutCheckState = HoldoutChecks['checks'][number]

const checkStateOf = (view: HoldoutCheckView): HoldoutCheckState => {
  const band = PlacementBandSchema.parse(view.band)
  switch (view.kind) {
    case 'due':
      return { kind: 'due', band, week: view.week }
    case 'asking':
      return {
        kind: 'asking',
        band,
        week: view.week,
        items: view.items.map(({ wordId, word, choices }) => ({
          wordId,
          word,
          choices: choices.map(({ choiceId, gloss }) => ({ choiceId, gloss })),
        })),
      }
  }
}

export const holdoutChecksBodyOf = (views: ReadonlyArray<HoldoutCheckView>): HoldoutChecks => ({
  checks: views.map(checkStateOf),
})
