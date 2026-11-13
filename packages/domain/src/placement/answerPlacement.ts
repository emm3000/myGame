import type { DomainError } from '../DomainError'
import type { Band, BandStart } from '../learning/BandStart'
import type { Scaffold } from '../learning/Scaffold'
import type { PlayerId } from '../player/PlayerId'
import type { BandStartRepository } from '../ports/BandStartRepository'
import type { Clock } from '../ports/Clock'
import type { PlacementRepository } from '../ports/PlacementRepository'
import type { PlacementWordCatalog } from '../ports/PlacementWordCatalog'
import { err, ok, type Result } from '../Result'
import { askedSampleOf } from './askedSampleOf'
import type { PlacementSample, TakenPlacement } from './Placement'
import type { PlacementView } from './PlacementView'
import { placementQuestionsOf } from './placementQuestionsOf'
import { placementViewOf } from './placementViewOf'
import { type PlacementAnswer, rightWordIdsOf } from './rightWordIdsOf'

export type AnswerPlacementCommand = {
  readonly playerId: PlayerId
  readonly band: Band
  readonly answers: ReadonlyArray<PlacementAnswer>
  readonly scaffold: Scaffold
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

export const answerPlacement = async (
  command: AnswerPlacementCommand,
  dependencies: AnswerPlacementDependencies,
): Promise<Result<PlacementView, DomainError>> => {
  const asked = await askedPlacementOf(command, dependencies)
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
