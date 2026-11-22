import { readScaffold } from '#account/application/readScaffold'
import type { DomainError } from '#DomainError'
import type { BandStart } from '#holdout/domain/BandStart'
import type { BandStartRepository } from '#holdout/domain/BandStartRepository'
import type { Band } from '#learning/curriculum/domain/Band'
import type { BandCatalog } from '#learning/curriculum/domain/BandCatalog'
import type { Scaffold } from '#learning/scaffold/domain/Scaffold'
import type { Clock } from '#platform/domain/Clock'
import type { PlayerId } from '#player/PlayerId'
import { err, ok, type Result } from '#Result'
import { type MutateTownDependencies, mutateTown } from '#town/application/mutateTown'
import { askedSampleOf } from '../domain/askedSampleOf'
import type { PlacementSample, TakenPlacement } from '../domain/Placement'
import type { PlacementRepository } from '../domain/PlacementRepository'
import type { PlacementView } from '../domain/PlacementView'
import type { PlacementWordCatalog } from '../domain/PlacementWordCatalog'
import { placementQuestionsOf } from '../domain/placementQuestionsOf'
import { placementViewOf } from '../domain/placementViewOf'
import { type PlacementAnswer, rightWordIdsOf } from '../domain/rightWordIdsOf'

export type AnswerPlacementCommand = {
  readonly playerId: PlayerId
  readonly band: Band
  readonly answers: ReadonlyArray<PlacementAnswer>
}

type ScaffoldedAnswers = AnswerPlacementCommand & {
  readonly scaffold: Scaffold
}

type AnswerPorts = {
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

const readAskedPlacement = async (
  { playerId, band }: AnswerPlacementCommand,
  { placements, bandStarts }: AnswerPorts,
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

const answerPlacementIn = async (
  command: ScaffoldedAnswers,
  dependencies: AnswerPorts,
): Promise<Result<PlacementView, DomainError>> => {
  const asked = await readAskedPlacement(command, dependencies)
  if (!asked.ok) {
    return asked
  }
  const { placement, sample, starts } = asked.value
  const right = rightWordIdsOf(
    placementQuestionsOf(sample, dependencies.words, command.scaffold),
    command.answers,
  )
  if (right === undefined) {
    return err({ kind: 'InvalidPlacementAnswers', band: command.band })
  }
  const scored: TakenPlacement = {
    ...placement,
    scores: [
      ...placement.scores,
      { band: command.band, score: right.length, takenAt: dependencies.clock.now() },
    ],
  }
  const saved = await dependencies.placements.save(command.playerId, scored)
  if (!saved.ok) {
    return saved
  }
  return ok(placementViewOf(scored, starts, dependencies.words, command.scaffold))
}

export type AnswerPlacementDependencies = MutateTownDependencies & {
  readonly lessons: PlacementWordCatalog & Pick<BandCatalog, 'wordsOfBand' | 'hasLessons'>
}

export class AnswerPlacement {
  constructor(private readonly dependencies: AnswerPlacementDependencies) {}

  async execute(command: AnswerPlacementCommand): Promise<Result<PlacementView, DomainError>> {
    const { lessons } = this.dependencies
    return mutateTown(
      command.playerId,
      async (stores, clock) => {
        const scaffold = await readScaffold(command.playerId, stores.accounts)
        if (!scaffold.ok) {
          return scaffold
        }
        return answerPlacementIn(
          { ...command, scaffold: scaffold.value },
          { placements: stores.placements, bandStarts: stores.bandStarts, words: lessons, clock },
        )
      },
      this.dependencies,
    )
  }
}
