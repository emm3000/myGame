import { assert, describe, expect, it } from 'vitest'
import type { BandStart } from '../learning/BandStart'
import type { Lesson, LessonWord } from '../learning/Lesson'
import { MemoryCard } from '../memory/MemoryCard'
import { firstItemsRandom } from '../testing/firstItemsRandom'
import { inMemoryBandStarts } from '../testing/inMemoryBandStarts'
import { inMemoryBands } from '../testing/inMemoryBands'
import { inMemoryCards, type OwnedCard } from '../testing/inMemoryCards'
import { inMemoryLessonSlots } from '../testing/inMemoryLessonSlots'
import { inMemoryLessons } from '../testing/inMemoryLessons'
import { inMemoryPlacements } from '../testing/inMemoryPlacements'
import { inMemoryTownNews } from '../testing/inMemoryTownNews'
import { inMemoryTowns } from '../testing/inMemoryTowns'
import { lessonOne } from '../testing/lessonOne'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import type { LessonSlot } from '../town/LessonSlot'
import { settleSchoolLesson } from '../town/settleSchoolLesson'
import { startSchoolLesson } from '../town/startSchoolLesson'
import type { HoldoutCheck } from './HoldoutCheck'
import { releasedLessonsOf } from './releasedLessonsOf'

const MILLISECONDS_PER_WEEK = 7 * 24 * 3_600_000

const bandStartedAt = Instant.fromEpochMilliseconds(
  plainTownSettings.seasons.epoch.epochMilliseconds + 3_600_000,
)

const weeksAfterStart = (weeks: number, extraMilliseconds = 0): Instant =>
  Instant.fromEpochMilliseconds(
    bandStartedAt.epochMilliseconds + weeks * MILLISECONDS_PER_WEEK + extraMilliseconds,
  )

const wordOf = (lemma: string): LessonWord => ({
  id: lemma.includes(' ') ? `unit-${lemma.replace(' ', '-')}` : `word-${lemma}`,
  acceptedForms: [lemma],
  gloss: lemma,
  frames: [{ frame: lemma, gappedFrame: '____' }],
})

const lessonOf = (id: string, lemmas: ReadonlyArray<string>): Lesson => ({
  ...lessonOne,
  id,
  words: lemmas.map(wordOf),
})

const firstLesson = lessonOf('lesson-17', ['say', 'make', 'know', 'time', 'year'])

const secondLesson = lessonOf('lesson-18', ['think', 'see', 'come', 'want', 'look'])

const unstudiedLesson = lessonOf('lesson-19', ['use', 'find', 'give', 'tell', 'take'])

const unitLesson = lessonOf('unit-lesson-1', ['look up', 'make up', 'want in'])

const bandWords = [...firstLesson.words, ...secondLesson.words, ...unstudiedLesson.words].map(
  ({ acceptedForms }) => ({ headword: acceptedForms[0], isChrome: false }),
)

const heldOutWords = ['want', 'make', 'give', 'see', 'know', 'come', 'time']

const studiedCards = (enteredAt: Instant): ReadonlyArray<OwnedCard> =>
  ['word-say', 'word-year', 'word-think', 'word-look', 'unit-look-up'].map((wordId) => ({
    playerId: 'player-1',
    wordId,
    card: MemoryCard.entered(enteredAt),
  }))

const skippedRelease: HoldoutCheck = { kind: 'skipped', week: 24, skippedAt: weeksAfterStart(24) }

const takenRelease: HoldoutCheck = {
  kind: 'taken',
  week: 24,
  begunAt: weeksAfterStart(24),
  sample: { wordIds: [], heldOutWordIds: [] },
  heldOutScore: 0,
  practisedScore: 0,
  takenAt: weeksAfterStart(24),
}

type SchoolShape = {
  readonly checks?: ReadonlyArray<HoldoutCheck>
  readonly cards?: ReadonlyArray<OwnedCard>
  readonly slot?: LessonSlot
}

const schoolOf = ({
  checks = [skippedRelease],
  cards = studiedCards(weeksAfterStart(1)),
  slot,
}: SchoolShape) => {
  let now = weeksAfterStart(25)
  const held = inMemoryCards(cards)
  const dependencies = {
    towns: inMemoryTowns([townOf({ storedAt: bandStartedAt })]),
    lessonSlots: inMemoryLessonSlots(slot === undefined ? [] : [{ townId: 'town-1', slot }]),
    cards: held,
    lessons: inMemoryLessons([firstLesson, secondLesson, unstudiedLesson, unitLesson], []),
    bandStarts: inMemoryBandStarts([
      {
        playerId: 'player-1',
        start: { band: 1, startedAt: bandStartedAt, heldOutWords, checks },
      },
    ]),
    bands: inMemoryBands([
      { band: 1, lessonIds: ['lesson-17', 'lesson-18', 'lesson-19'], words: bandWords },
    ]),
    placements: inMemoryPlacements([]),
    random: firstItemsRandom,
    news: inMemoryTownNews(),
    catalog: townCatalogOf(),
    clock: { now: () => now },
  }
  const enteredAfterStudying = async (lessonId: string): Promise<ReadonlyArray<string>> => {
    const before = await held.cardsOf('player-1')
    assert(before.ok)
    const started = await startSchoolLesson({ playerId: 'player-1', lessonId }, dependencies)
    assert(started.ok)
    now = started.value.finishesAt
    assert((await settleSchoolLesson('player-1', dependencies)).ok)
    const after = await held.cardsOf('player-1')
    assert(after.ok)
    return after.value
      .map(({ wordId }) => wordId)
      .filter((wordId) => !before.value.some((card) => card.wordId === wordId))
  }
  return {
    ...dependencies,
    enteredAfterStudying,
    start: (lessonId: string) =>
      startSchoolLesson({ playerId: 'player-1', lessonId }, dependencies),
    settleAt: (at: Instant) => {
      now = at
      return settleSchoolLesson('player-1', dependencies)
    },
    heldWordIds: async (): Promise<ReadonlyArray<string>> => {
      const after = await held.cardsOf('player-1')
      assert(after.ok)
      return after.value.map(({ wordId }) => wordId)
    },
  }
}

describe('the release of the held-out words', () => {
  it.each([
    ['skipped', skippedRelease],
    ['taken', takenRelease],
  ])('releases the held-out words after the 24-week check, %s', async (_, release) => {
    const school = schoolOf({ checks: [release] })

    expect(await school.enteredAfterStudying('released-1-1')).toEqual([
      'word-make',
      'unit-make-up',
      'word-know',
      'word-time',
      'word-see',
      'word-come',
    ])
  })

  it('holds the held-out words back until the 24-week check is taken or skipped', async () => {
    const school = schoolOf({ checks: [] })

    expect(await school.start('released-1-1')).toEqual({
      ok: false,
      error: { kind: 'LessonNotFound', lessonId: 'released-1-1' },
    })
  })

  it('releases the words of studied lessons as lessons of 5 in rank order', async () => {
    const school = schoolOf({})

    await school.enteredAfterStudying('released-1-1')

    expect(await school.enteredAfterStudying('released-1-2')).toEqual(['word-want', 'unit-want-in'])
  })

  it('refuses a released lesson studied before', async () => {
    const school = schoolOf({})
    await school.enteredAfterStudying('released-1-2')

    expect(await school.start('released-1-2')).toEqual({
      ok: false,
      error: { kind: 'LessonAlreadyStudied', lessonId: 'released-1-2' },
    })
  })

  it('enters a word of a lesson unstudied at the release with its own lesson', async () => {
    const school = schoolOf({})

    expect(await school.enteredAfterStudying('lesson-19')).toContain('word-give')
  })

  it('withholds a held-out word from a lesson finished before the release though settled after it', async () => {
    const finishesAt = weeksAfterStart(24, -1)
    const slot: LessonSlot = {
      kind: 'busy',
      lessonId: 'lesson-19',
      startedAt: weeksAfterStart(23),
      finishesAt,
    }
    const school = schoolOf({ slot })

    assert((await school.settleAt(weeksAfterStart(25))).ok)

    expect(await school.heldWordIds()).not.toContain('word-give')
    expect(await school.enteredAfterStudying('released-1-2')).toContain('word-give')
  })
})

describe('releasedLessonsOf', () => {
  const startOf = (
    band: number,
    held: ReadonlyArray<string>,
    checks: ReadonlyArray<HoldoutCheck>,
  ): BandStart => ({ band, startedAt: bandStartedAt, heldOutWords: held, checks })

  const releasedAt = (weeks: number): HoldoutCheck => ({
    kind: 'skipped',
    week: 24,
    skippedAt: weeksAfterStart(weeks),
  })

  const phrasal = lessonOf('unit-lesson-2', ['say so', 'look up'])

  const content = {
    lessons: inMemoryLessons([firstLesson, phrasal], []),
    bands: inMemoryBands([
      { band: 1, lessonIds: ['lesson-17'], words: bandWords },
      { band: 2, lessonIds: [], words: [{ headword: 'so', isChrome: false }] },
    ]),
  }

  const cards = ['word-make', 'unit-look-up'].map((wordId) => ({
    wordId,
    card: MemoryCard.entered(weeksAfterStart(1)),
  }))

  const releasedIdsOf = (starts: ReadonlyArray<BandStart>) =>
    releasedLessonsOf(starts, cards, content).map(({ id, words }) => ({
      id,
      words: words.map(({ id: wordId }) => wordId),
    }))

  it('holds a unit back while another band holding one of its words is not released', () => {
    const starts = [startOf(1, ['say'], [releasedAt(24)]), startOf(2, ['so'], [])]

    expect(releasedIdsOf(starts)).toEqual([{ id: 'released-1-1', words: ['word-say'] }])
  })

  it('releases a unit with the band whose words are released last', () => {
    const starts = [startOf(1, ['say'], [releasedAt(24)]), startOf(2, ['so'], [releasedAt(30)])]

    expect(releasedIdsOf(starts)).toEqual([
      { id: 'released-1-1', words: ['word-say'] },
      { id: 'released-2-1', words: ['unit-say-so'] },
    ])
  })

  it('takes the longest duration and the highest school level of its words’ lessons', () => {
    const slowLesson = { ...phrasal, durationSeconds: 900, requiredSchoolLevel: 3 }
    const [released] = releasedLessonsOf([startOf(1, ['say'], [releasedAt(24)])], cards, {
      ...content,
      lessons: inMemoryLessons([firstLesson, slowLesson], []),
    })

    expect([released?.durationSeconds, released?.requiredSchoolLevel]).toEqual([900, 3])
  })
})
