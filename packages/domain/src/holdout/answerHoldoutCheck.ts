import type { DomainError } from '../DomainError'
import type { Band } from '../learning/BandStart'
import type { Scaffold } from '../learning/Scaffold'
import { placementQuestionsOf } from '../placement/placementQuestionsOf'
import { type PlacementAnswer, rightWordIdsOf } from '../placement/rightWordIdsOf'
import type { PlayerId } from '../player/PlayerId'
import type { BandStartRepository } from '../ports/BandStartRepository'
import type { Clock } from '../ports/Clock'
import type { PlacementWordCatalog } from '../ports/PlacementWordCatalog'
import { err, ok, type Result } from '../Result'
import { checkOfWeek } from './checkOfWeek'
import { dueBandStartOf } from './dueBandStartOf'
import type { HoldoutCheckWeek, TakenHoldoutCheck } from './HoldoutCheck'

export type AnswerHoldoutCheckCommand = {
  readonly playerId: PlayerId
  readonly band: Band
  readonly week: HoldoutCheckWeek
  readonly answers: ReadonlyArray<PlacementAnswer>
  readonly scaffold: Scaffold
}

export type AnswerHoldoutCheckDependencies = {
  readonly bandStarts: BandStartRepository
  readonly words: PlacementWordCatalog
  readonly clock: Clock
}

export const answerHoldoutCheck = async (
  { playerId, band, week, answers, scaffold }: AnswerHoldoutCheckCommand,
  { bandStarts, words, clock }: AnswerHoldoutCheckDependencies,
): Promise<Result<TakenHoldoutCheck, DomainError>> => {
  const now = clock.now()
  const due = await dueBandStartOf(playerId, band, week, bandStarts, now)
  if (!due.ok) {
    return due
  }
  const begun = checkOfWeek(due.value, week)
  if (begun?.kind !== 'begun') {
    return err({ kind: 'HoldoutCheckNotBegun', band, week })
  }
  const { sample } = begun
  const questions = placementQuestionsOf({ band, wordIds: sample.wordIds }, words, scaffold)
  const right = rightWordIdsOf(questions, answers)
  if (right === undefined) {
    return err({ kind: 'InvalidHoldoutCheckAnswers', band, week })
  }
  const heldOutScore = right.filter((wordId) => sample.heldOutWordIds.includes(wordId)).length
  const taken: TakenHoldoutCheck = {
    ...begun,
    kind: 'taken',
    heldOutScore,
    practisedScore: right.length - heldOutScore,
    takenAt: now,
  }
  const saved = await bandStarts.saveCheck(playerId, band, taken)
  return saved.ok ? ok(taken) : saved
}
