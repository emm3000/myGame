import { assert, describe, expect, it } from 'vitest'
import type { BandStart } from '../learning/BandStart'
import type { Clock } from '../ports/Clock'
import { inMemoryBandStarts, type OwnedBandStart } from '../testing/inMemoryBandStarts'
import { inMemoryPlacements } from '../testing/inMemoryPlacements'
import { inMemoryPlacementWords, placementWordsOfBand } from '../testing/placementWords'
import { Instant } from '../time/Instant'
import { answerPlacement, type PlacementAnswer } from './answerPlacement'
import type { Placement, TakenPlacement } from './Placement'
import type { PlacementItem } from './PlacementView'
import { readPlacement } from './readPlacement'

const ana = 'player-ana'

const begunAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-12T09:00:00Z'))

const answeredAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-12T09:12:00Z'))

const frozenClock: Clock = { now: () => answeredAt }

const words = inMemoryPlacementWords([
  { band: 1, words: placementWordsOfBand(1, 30) },
  { band: 2, words: placementWordsOfBand(2, 30) },
])

const sampleOf = (band: number) => ({
  band,
  wordIds: placementWordsOfBand(band, 30).map(({ id }) => id),
})

const begunPlacement: TakenPlacement = {
  kind: 'taken',
  begunAt,
  samples: [sampleOf(1), sampleOf(2)],
  scores: [],
}

type AnswerShape = {
  readonly placement?: Placement
  readonly starts?: ReadonlyArray<OwnedBandStart>
}

const placementOf = ({ placement = begunPlacement, starts = [] }: AnswerShape) => {
  const placements = inMemoryPlacements([{ playerId: ana, placement }])
  const dependencies = {
    placements,
    bandStarts: inMemoryBandStarts(starts),
    words,
    clock: frozenClock,
  }
  return { placements, dependencies }
}

const rightChoiceOf = ({ word, choices }: PlacementItem): string =>
  choices.find(({ gloss }) => gloss === `gloss-${word}`)?.choiceId ?? 'missing'

const wrongChoiceOf = ({ word, choices }: PlacementItem): string =>
  choices.find(({ gloss }) => gloss !== `gloss-${word}`)?.choiceId ?? 'missing'

const answersWithRight = async (
  dependencies: ReturnType<typeof placementOf>['dependencies'],
  rightCount: number,
): Promise<ReadonlyArray<PlacementAnswer>> => {
  const view = await readPlacement({ playerId: ana }, dependencies)
  assert(view.ok && view.value.kind === 'asking')
  return view.value.items.map((item, index) => ({
    wordId: item.wordId,
    choiceId: index < rightCount ? rightChoiceOf(item) : wrongChoiceOf(item),
  }))
}

const storedScoresOf = async (
  placements: ReturnType<typeof inMemoryPlacements>,
): Promise<unknown> => {
  const stored = await placements.placementOf(ana)
  assert(stored.ok && stored.value?.kind === 'taken')
  return stored.value.scores
}

describe('answerPlacement', () => {
  it('passes a band at 29 of 30', async () => {
    const { dependencies } = placementOf({})
    const answers = await answersWithRight(dependencies, 29)

    const view = await answerPlacement({ playerId: ana, band: 1, answers }, dependencies)

    assert(view.ok && view.value.kind === 'asking')
    expect(view.value.band).toBe(2)
  })

  it('fails a band at 28 of 30', async () => {
    const { dependencies } = placementOf({})
    const answers = await answersWithRight(dependencies, 28)

    const view = await answerPlacement({ playerId: ana, band: 1, answers }, dependencies)

    expect(view).toEqual({
      ok: true,
      value: { kind: 'closed', scores: [{ band: 1, score: 28, takenAt: answeredAt }] },
    })
  })

  it('stores the band score with the instant of the answer', async () => {
    const { placements, dependencies } = placementOf({})
    const answers = await answersWithRight(dependencies, 30)

    await answerPlacement({ playerId: ana, band: 1, answers }, dependencies)

    expect(await storedScoresOf(placements)).toEqual([{ band: 1, score: 30, takenAt: answeredAt }])
  })

  it('stops at the first band failed', async () => {
    const { dependencies } = placementOf({})
    const answers = await answersWithRight(dependencies, 10)
    await answerPlacement({ playerId: ana, band: 1, answers }, dependencies)

    expect(await answerPlacement({ playerId: ana, band: 2, answers }, dependencies)).toEqual({
      ok: false,
      error: { kind: 'PlacementBandNotAsked', band: 2 },
    })
  })

  it('refuses an answer to a band the check is not asking', async () => {
    const { dependencies } = placementOf({})
    const answers = await answersWithRight(dependencies, 30)

    expect(await answerPlacement({ playerId: ana, band: 2, answers }, dependencies)).toEqual({
      ok: false,
      error: { kind: 'PlacementBandNotAsked', band: 2 },
    })
  })

  it('refuses an answer to a band already answered', async () => {
    const { placements, dependencies } = placementOf({})
    const answers = await answersWithRight(dependencies, 30)
    await answerPlacement({ playerId: ana, band: 1, answers }, dependencies)

    expect(await answerPlacement({ playerId: ana, band: 1, answers }, dependencies)).toEqual({
      ok: false,
      error: { kind: 'PlacementBandNotAsked', band: 1 },
    })
    expect(await storedScoresOf(placements)).toEqual([{ band: 1, score: 30, takenAt: answeredAt }])
  })

  it('refuses an answer from a player who skipped the placement', async () => {
    const { dependencies } = placementOf({ placement: { kind: 'skipped', skippedAt: begunAt } })

    expect(await answerPlacement({ playerId: ana, band: 1, answers: [] }, dependencies)).toEqual({
      ok: false,
      error: { kind: 'PlacementBandNotAsked', band: 1 },
    })
  })

  it('refuses an answer once the band it asks has started', async () => {
    const bandOneStart: BandStart = { band: 1, startedAt: begunAt, heldOutWords: [] }
    const { dependencies } = placementOf({ starts: [{ playerId: ana, start: bandOneStart }] })

    expect(await answerPlacement({ playerId: ana, band: 1, answers: [] }, dependencies)).toEqual({
      ok: false,
      error: { kind: 'PlacementBandNotAsked', band: 1 },
    })
  })

  it('refuses answers that leave a word unanswered, storing no score', async () => {
    const { placements, dependencies } = placementOf({})
    const answers = await answersWithRight(dependencies, 30)

    expect(
      await answerPlacement({ playerId: ana, band: 1, answers: answers.slice(1) }, dependencies),
    ).toEqual({ ok: false, error: { kind: 'InvalidPlacementAnswers', band: 1 } })
    expect(await storedScoresOf(placements)).toEqual([])
  })

  it('refuses answers that answer a word twice', async () => {
    const { dependencies } = placementOf({})
    const answers = await answersWithRight(dependencies, 30)
    const [first] = answers
    assert(first !== undefined)

    expect(
      await answerPlacement(
        { playerId: ana, band: 1, answers: [first, ...answers.slice(0, 29)] },
        dependencies,
      ),
    ).toEqual({ ok: false, error: { kind: 'InvalidPlacementAnswers', band: 1 } })
  })

  it('refuses a choice the word does not offer', async () => {
    const { dependencies } = placementOf({})
    const answers = await answersWithRight(dependencies, 30)
    const [first, ...rest] = answers
    assert(first !== undefined)

    expect(
      await answerPlacement(
        { playerId: ana, band: 1, answers: [{ ...first, choiceId: first.wordId }, ...rest] },
        dependencies,
      ),
    ).toEqual({ ok: false, error: { kind: 'InvalidPlacementAnswers', band: 1 } })
  })
})
