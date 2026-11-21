import type { DomainError } from '#DomainError'
import type { Band } from '#learning/curriculum/BandStart'
import type { Scaffold } from '#learning/scaffold/Scaffold'
import { placementQuestionsOf } from '#placement/placementQuestionsOf'
import type { PlacementWordCatalog } from '#placement/ports/PlacementWordCatalog'
import { type PlacementAnswer, rightWordIdsOf } from '#placement/rightWordIdsOf'
import type { PlayerId } from '#player/PlayerId'
import type { Clock } from '#ports/Clock'
import { err, ok, type Result } from '#Result'
import { checkOfWeek } from '../checkOfWeek'
import type { TakenHoldoutCheck } from '../HoldoutCheck'
import type { HoldoutCheckWeek } from '../HoldoutCheckWeek'
import type { BandStartRepository } from '../ports/BandStartRepository'
import { resolveDueBandStart } from '../services/resolveDueBandStart'

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
  const due = await resolveDueBandStart(playerId, band, week, bandStarts, now)
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
