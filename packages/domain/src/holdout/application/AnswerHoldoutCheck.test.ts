import { assert, describe, expect, it } from 'vitest'
import { inMemoryAccounts } from '#account/testing/inMemoryAccounts'
import { inMemoryBands } from '#learning/curriculum/testing/inMemoryBands'
import { inMemoryLessons } from '#learning/curriculum/testing/inMemoryLessons'
import type { Scaffold } from '#learning/scaffold/Scaffold'
import type { PlacementItem } from '#placement/domain/PlacementView'
import type { PlacementWordCatalog } from '#placement/domain/PlacementWordCatalog'
import { inMemoryPlacementWords } from '#placement/testing/placementWords'
import type { Clock } from '#platform/domain/Clock'
import { inMemoryUnitOfWork } from '#platform/testing/inMemoryUnitOfWork'
import type { PlayerId } from '#player/PlayerId'
import type { Instant } from '#time/Instant'
import { inMemoryTownStores } from '#town/testing/inMemoryTownStores'
import type { HoldoutCheck } from '../domain/HoldoutCheck'
import {
  ana,
  bandOneStart,
  bandOneWords,
  heldOutOfStudied,
  practisedOfStudied,
  weeksAfterStart,
} from '../testing/holdoutFixtures'
import { inMemoryBandStarts } from '../testing/inMemoryBandStarts'
import { AnswerHoldoutCheck, type AnswerHoldoutCheckCommand } from './AnswerHoldoutCheck'
import { ReadHoldoutChecks } from './ReadHoldoutChecks'

type CheckFixture = {
  readonly bandStarts: ReturnType<typeof inMemoryBandStarts>
  readonly words: PlacementWordCatalog
  readonly clock: Clock
}

const unitOfWorkOf = ({ bandStarts }: CheckFixture, scaffold: Scaffold) =>
  inMemoryUnitOfWork(
    inMemoryTownStores({
      bandStarts,
      accounts: inMemoryAccounts([
        {
          id: ana,
          email: `${ana}@example.com`,
          passwordHash: 'argon2id-hash',
          emailVerified: true,
          scaffold,
          scaffoldVersion: 0,
        },
      ]),
    }),
  )

const answerHoldoutCheck = (
  { scaffold, ...command }: AnswerHoldoutCheckCommand & { readonly scaffold: Scaffold },
  fixture: CheckFixture,
): ReturnType<AnswerHoldoutCheck['execute']> =>
  new AnswerHoldoutCheck({
    unitOfWork: unitOfWorkOf(fixture, scaffold),
    lessons: { ...inMemoryLessons([], []), ...inMemoryBands([]), ...fixture.words },
    clock: fixture.clock,
  }).execute(command)

const readHoldoutChecks = (
  { playerId, scaffold }: { readonly playerId: PlayerId; readonly scaffold: Scaffold },
  fixture: CheckFixture,
): ReturnType<ReadHoldoutChecks['execute']> =>
  new ReadHoldoutChecks({
    unitOfWork: unitOfWorkOf(fixture, scaffold),
    lessons: fixture.words,
    clock: fixture.clock,
  }).execute({ playerId })

const heldOutIds = heldOutOfStudied.map(({ id }) => id)

const askedIds = [...heldOutIds, ...practisedOfStudied.slice(0, 2).map(({ id }) => id)]

const begunAt = weeksAfterStart(8)

const begunCheck: HoldoutCheck = {
  kind: 'begun',
  week: 8,
  begunAt,
  sample: { wordIds: askedIds, heldOutWordIds: heldOutIds },
}

const words = inMemoryPlacementWords([{ band: 1, words: bandOneWords }])

const checkOf = (checks: ReadonlyArray<HoldoutCheck>, now: Instant) => {
  const bandStarts = inMemoryBandStarts([{ playerId: ana, start: bandOneStart(checks) }])
  return { bandStarts, words, clock: { now: () => now } }
}

const rightChoiceOf = ({ word, choices }: PlacementItem): string =>
  choices.find(({ gloss }) => gloss === `gloss-${word}`)?.choiceId ?? 'missing'

const wrongChoiceOf = ({ word, choices }: PlacementItem): string =>
  choices.find(({ gloss }) => gloss !== `gloss-${word}`)?.choiceId ?? 'missing'

const askedItemsOf = async (
  dependencies: ReturnType<typeof checkOf>,
): Promise<ReadonlyArray<PlacementItem>> => {
  const read = await readHoldoutChecks({ playerId: ana, scaffold: 'es' }, dependencies)
  assert(read.ok)
  const [asking] = read.value
  assert(asking?.kind === 'asking')
  return asking.items
}

const storedCheckOf = async (dependencies: ReturnType<typeof checkOf>) => {
  const stored = await dependencies.bandStarts.bandStartsOf(ana)
  assert(stored.ok)
  return stored.value[0]?.checks.find(({ week }) => week === 8)
}

describe('AnswerHoldoutCheck', () => {
  it('stores the held-out score apart from the practised score', async () => {
    const takenAt = weeksAfterStart(8, 60_000)
    const dependencies = checkOf([begunCheck], takenAt)
    const items = await askedItemsOf(dependencies)
    const answers = items.map((item) => ({
      wordId: item.wordId,
      choiceId: item.wordId === heldOutIds[0] ? wrongChoiceOf(item) : rightChoiceOf(item),
    }))
    const answered = await answerHoldoutCheck(
      { playerId: ana, scaffold: 'es', band: 1, week: 8, answers },
      dependencies,
    )
    assert(answered.ok)
    expect(await storedCheckOf(dependencies)).toEqual({
      ...begunCheck,
      kind: 'taken',
      heldOutScore: 1,
      practisedScore: 2,
      takenAt,
    })
  })

  it('refuses answers that leave an asked word unanswered', async () => {
    const dependencies = checkOf([begunCheck], weeksAfterStart(9))
    const [first] = await askedItemsOf(dependencies)
    assert(first !== undefined)
    const answered = await answerHoldoutCheck(
      {
        playerId: ana,
        scaffold: 'es',
        band: 1,
        week: 8,
        answers: [{ wordId: first.wordId, choiceId: rightChoiceOf(first) }],
      },
      dependencies,
    )
    expect(answered).toEqual({
      ok: false,
      error: { kind: 'InvalidHoldoutCheckAnswers', band: 1, week: 8 },
    })
    expect(await storedCheckOf(dependencies)).toEqual(begunCheck)
  })

  it('refuses answers to a check due but not begun', async () => {
    const answered = await answerHoldoutCheck(
      { playerId: ana, scaffold: 'es', band: 1, week: 8, answers: [] },
      checkOf([], weeksAfterStart(9)),
    )
    expect(answered).toEqual({
      ok: false,
      error: { kind: 'HoldoutCheckNotBegun', band: 1, week: 8 },
    })
  })

  it('refuses answers to a begun check that lapsed at 24 weeks', async () => {
    const answered = await answerHoldoutCheck(
      { playerId: ana, scaffold: 'es', band: 1, week: 8, answers: [] },
      checkOf([begunCheck], weeksAfterStart(24)),
    )
    expect(answered).toEqual({ ok: false, error: { kind: 'HoldoutCheckNotDue', band: 1, week: 8 } })
  })

  it('grades under none a choice that only the definitions offer', async () => {
    const [heldOutId, , practisedId] = askedIds
    const sharedGlossWords = bandOneWords.map((word) =>
      word.id === heldOutId || word.id === practisedId ? { ...word, gloss: 'casa' } : word,
    )
    const takenAt = weeksAfterStart(8, 60_000)
    const bandStarts = inMemoryBandStarts([{ playerId: ana, start: bandOneStart([begunCheck]) }])
    const dependencies = {
      bandStarts,
      words: inMemoryPlacementWords([{ band: 1, words: sharedGlossWords }]),
      clock: { now: () => takenAt },
    }
    const read = await readHoldoutChecks({ playerId: ana, scaffold: 'none' }, dependencies)
    assert(read.ok && read.value[0]?.kind === 'asking')
    const definitionOf = (wordId: string | undefined): string | undefined =>
      sharedGlossWords.find(({ id }) => id === wordId)?.definition
    const answers = read.value[0].items.map(({ wordId, choices }) => {
      const chosen = definitionOf(wordId === heldOutId ? practisedId : wordId)
      return {
        wordId,
        choiceId: choices.find(({ gloss }) => gloss === chosen)?.choiceId ?? 'missing',
      }
    })

    const answered = await answerHoldoutCheck(
      { playerId: ana, scaffold: 'none', band: 1, week: 8, answers },
      dependencies,
    )

    assert(answered.ok)
    const taken = await storedCheckOf(dependencies)
    assert(taken?.kind === 'taken')
    expect({
      heldOut: taken.heldOutScore,
      practised: taken.practisedScore,
    }).toEqual({
      heldOut: 1,
      practised: 2,
    })
  })
})
