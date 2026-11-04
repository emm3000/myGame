import {
  Instant,
  type PlayerId,
  type ReviewLog,
  type ReviewLogEntry,
  type StoredMemoryCard,
} from '@mygame/domain'
import { describe, expect, it } from 'vitest'

export type ReviewLogFixture = {
  readonly reviewLog: ReviewLog
  readonly registerPlayers: (playerIds: ReadonlyArray<PlayerId>) => Promise<void>
  readonly loggedEntriesOf: (playerId: PlayerId) => Promise<ReadonlyArray<ReviewLogEntry>>
}

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'

const instantAt = (iso: string): Instant => Instant.fromEpochMilliseconds(Date.parse(iso))

const lessonFinishedAt = instantAt('2026-11-10T09:00:00Z')

const enteredSchool: StoredMemoryCard = {
  state: 'learning',
  step: 0,
  stability: null,
  difficulty: null,
  lastReviewAt: null,
  lastRating: null,
  enteredAt: lessonFinishedAt,
  retainedAt: null,
}

const recognizedSchool: StoredMemoryCard = {
  state: 'learning',
  step: 1,
  stability: 2.3065,
  difficulty: 2.1181,
  lastReviewAt: lessonFinishedAt,
  lastRating: 'good',
  enteredAt: lessonFinishedAt,
  retainedAt: null,
}

const reviewedSchool: StoredMemoryCard = {
  state: 'review',
  step: null,
  stability: 10.971,
  difficulty: 2.1043,
  lastReviewAt: instantAt('2026-11-12T09:10:00Z'),
  lastRating: 'good',
  enteredAt: lessonFinishedAt,
  retainedAt: null,
}

const retainedSchool: StoredMemoryCard = {
  ...reviewedSchool,
  stability: 46.3169,
  difficulty: 2.0975,
  lastReviewAt: instantAt('2026-11-23T09:10:00Z'),
  retainedAt: instantAt('2026-11-23T09:10:00Z'),
}

const firstRecognition: ReviewLogEntry = {
  playerId: ana,
  wordId: 'school',
  reviewedAt: lessonFinishedAt,
  format: 'recognition',
  answer: 'school',
  nearMissAnswer: null,
  hintShown: false,
  rating: 'good',
  elapsedDays: null,
  before: enteredSchool,
  after: recognizedSchool,
}

const retainingRecall: ReviewLogEntry = {
  playerId: ana,
  wordId: 'school',
  reviewedAt: instantAt('2026-11-23T09:10:00Z'),
  format: 'recall',
  answer: 'School ',
  nearMissAnswer: 'scool',
  hintShown: true,
  rating: 'hard',
  elapsedDays: 11,
  before: reviewedSchool,
  after: retainedSchool,
}

export const reviewLogContract = (
  adapter: string,
  arrange: () => Promise<ReviewLogFixture>,
): void => {
  describe(`${adapter} as a ReviewLog`, () => {
    it('logs a first review with no elapsed days and the card before it was reviewed', async () => {
      const { reviewLog, registerPlayers, loggedEntriesOf } = await arrange()
      await registerPlayers([ana])

      await reviewLog.append(firstRecognition)

      expect(await loggedEntriesOf(ana)).toEqual([firstRecognition])
    })

    it('logs a recall with its raw answer, its near-miss, its hint and the card after it', async () => {
      const { reviewLog, registerPlayers, loggedEntriesOf } = await arrange()
      await registerPlayers([ana])

      await reviewLog.append(retainingRecall)

      expect(await loggedEntriesOf(ana)).toEqual([retainingRecall])
    })

    it('keeps every review of a word, never replacing an earlier one', async () => {
      const { reviewLog, registerPlayers, loggedEntriesOf } = await arrange()
      await registerPlayers([ana])

      await reviewLog.append(firstRecognition)
      await reviewLog.append(retainingRecall)

      expect(await loggedEntriesOf(ana)).toEqual([firstRecognition, retainingRecall])
    })

    it('keeps the log of one player from another', async () => {
      const { reviewLog, registerPlayers, loggedEntriesOf } = await arrange()
      await registerPlayers([ana, bruno])

      await reviewLog.append(firstRecognition)

      expect(await loggedEntriesOf(bruno)).toEqual([])
    })
  })
}
