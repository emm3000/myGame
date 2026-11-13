import type { HoldoutCheck } from '../holdout/HoldoutCheck'
import type { BandStart } from '../learning/BandStart'
import type { Lesson } from '../learning/Lesson'
import { MemoryCard } from '../memory/MemoryCard'
import { Instant } from '../time/Instant'
import type { OwnedCard } from './inMemoryCards'
import { lessonOne } from './lessonOne'
import { placementWordsOfBand } from './placementWords'

const MILLISECONDS_PER_WEEK = 7 * 24 * 3_600_000

export const ana = 'player-ana'

export const bandOneStartedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-12T09:00:00Z'))

export const weeksAfterStart = (weeks: number, extraMilliseconds = 0): Instant =>
  Instant.fromEpochMilliseconds(
    bandOneStartedAt.epochMilliseconds + weeks * MILLISECONDS_PER_WEEK + extraMilliseconds,
  )

export const bandOneWords = placementWordsOfBand(1, 10)

const wordAt = (index: number) => {
  const word = bandOneWords[index]
  if (word === undefined) {
    return { id: 'missing', headword: 'missing', word: 'missing', gloss: 'missing' }
  }
  return word
}

const lessonOfWords = (id: string, indexes: ReadonlyArray<number>): Lesson => ({
  ...lessonOne,
  id,
  words: indexes.map((index) => {
    const { id: wordId, headword, gloss } = wordAt(index)
    return {
      id: wordId,
      acceptedForms: [headword],
      gloss,
      definition: `definition of ${gloss}`,
      frames: [{ frame: headword, gappedFrame: '____' }],
    }
  }),
})

export const studiedLesson = lessonOfWords('lesson-17', [0, 1, 2, 3, 4])

export const unstudiedLesson = lessonOfWords('lesson-18', [5, 6, 7, 8, 9])

export const heldOutOfStudied = [wordAt(0), wordAt(1)]

export const practisedOfStudied = [wordAt(2), wordAt(3), wordAt(4)]

export const heldOutOfUnstudied = wordAt(5)

export const studiedCards: ReadonlyArray<OwnedCard> = practisedOfStudied.map(({ id }) => ({
  playerId: ana,
  wordId: id,
  card: MemoryCard.entered(bandOneStartedAt),
}))

export const bandOneStart = (checks: ReadonlyArray<HoldoutCheck> = []): BandStart => ({
  band: 1,
  startedAt: bandOneStartedAt,
  heldOutWords: [...heldOutOfStudied, heldOutOfUnstudied].map(({ headword }) => headword),
  checks,
})
