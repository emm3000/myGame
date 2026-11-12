import type { DomainError } from '../DomainError'
import type { Band, BandStart } from '../learning/BandStart'
import type { WordId } from '../learning/Lesson'
import type { PlayerId } from '../player/PlayerId'
import type { BandStartRepository } from '../ports/BandStartRepository'
import type { Clock } from '../ports/Clock'
import type { PlacementRepository } from '../ports/PlacementRepository'
import type { PlacementWordCatalog } from '../ports/PlacementWordCatalog'
import { err, ok, type Result } from '../Result'
import { askedSampleOf } from './askedSampleOf'
import type { PlacementSample, TakenPlacement } from './Placement'
import type { PlacementView } from './PlacementView'
import { type PlacementQuestion, placementQuestionsOf } from './placementQuestionsOf'
import { placementViewOf } from './placementViewOf'

export type PlacementAnswer = {
  readonly wordId: WordId
  readonly choiceId: string
}

export type AnswerPlacementCommand = {
  readonly playerId: PlayerId
  readonly band: Band
  readonly answers: ReadonlyArray<PlacementAnswer>
}

export type AnswerPlacementDependencies = {
  readonly placements: PlacementRepository
  readonly bandStarts: Pick<BandStartRepository, 'bandStartsOf'>
  readonly words: PlacementWordCatalog
  readonly clock: Clock
}

type AskedPlacement = {
  readonly placement: TakenPlacement
  readonly sample: PlacementSample
  readonly starts: ReadonlyArray<BandStart>
}

const askedPlacementOf = async (
  { playerId, band }: AnswerPlacementCommand,
  { placements, bandStarts }: AnswerPlacementDependencies,
): Promise<Result<AskedPlacement, DomainError>> => {
  const stored = await placements.placementOf(playerId)
  if (!stored.ok) {
    return stored
  }
  const starts = await bandStarts.bandStartsOf(playerId)
  if (!starts.ok) {
    return starts
  }
  const placement = stored.value
  const sample = placement?.kind === 'taken' ? askedSampleOf(placement, starts.value) : undefined
  if (placement?.kind !== 'taken' || sample?.band !== band) {
    return err({ kind: 'PlacementBandNotAsked', band })
  }
  return ok({ placement, sample, starts: starts.value })
}

const isOffered = (question: PlacementQuestion, answer: PlacementAnswer | undefined): boolean =>
  question.choices.some(({ choiceId }) => choiceId === answer?.choiceId)

const isRight = (question: PlacementQuestion, answer: PlacementAnswer | undefined): boolean =>
  question.choices.find(({ choiceId }) => choiceId === answer?.choiceId)?.word.id ===
  question.word.id

const scoreOf = (
  questions: ReadonlyArray<PlacementQuestion>,
  answers: ReadonlyArray<PlacementAnswer>,
): number | undefined => {
  const answerOf = (question: PlacementQuestion): PlacementAnswer | undefined =>
    answers.find(({ wordId }) => wordId === question.word.id)
  const isComplete =
    answers.length === questions.length &&
    new Set(answers.map(({ wordId }) => wordId)).size === answers.length &&
    questions.every((question) => isOffered(question, answerOf(question)))
  if (!isComplete) {
    return undefined
  }
  return questions.filter((question) => isRight(question, answerOf(question))).length
}

export const answerPlacement = async (
  command: AnswerPlacementCommand,
  dependencies: AnswerPlacementDependencies,
): Promise<Result<PlacementView, DomainError>> => {
  const asked = await askedPlacementOf(command, dependencies)
  if (!asked.ok) {
    return asked
  }
  const { placement, sample, starts } = asked.value
  const score = scoreOf(placementQuestionsOf(sample, dependencies.words), command.answers)
  if (score === undefined) {
    return err({ kind: 'InvalidPlacementAnswers', band: command.band })
  }
  const scored: TakenPlacement = {
    ...placement,
    scores: [...placement.scores, { band: command.band, score, takenAt: dependencies.clock.now() }],
  }
  const saved = await dependencies.placements.save(command.playerId, scored)
  if (!saved.ok) {
    return saved
  }
  return ok(placementViewOf(scored, starts, dependencies.words))
}
