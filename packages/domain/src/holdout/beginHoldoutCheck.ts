import type { DomainError } from '../DomainError'
import type { Band } from '../learning/BandStart'
import type { Scaffold } from '../learning/Scaffold'
import type { PlayerId } from '../player/PlayerId'
import type { BandStartRepository } from '../ports/BandStartRepository'
import type { CardRepository } from '../ports/CardRepository'
import type { Clock } from '../ports/Clock'
import type { RandomSource } from '../ports/RandomSource'
import { ok, type Result } from '../Result'
import { askingViewOf } from './askingViewOf'
import { checkOfWeek } from './checkOfWeek'
import { dueBandStartOf } from './dueBandStartOf'
import type { BegunHoldoutCheck, HoldoutCheckWeek } from './HoldoutCheck'
import type { HoldoutCheckView } from './HoldoutCheckView'
import { type HoldoutCheckContent, holdoutCheckSampleDrawn } from './holdoutCheckSampleDrawn'

export type BeginHoldoutCheckCommand = {
  readonly playerId: PlayerId
  readonly band: Band
  readonly week: HoldoutCheckWeek
  readonly scaffold: Scaffold
}

export type BeginHoldoutCheckDependencies = HoldoutCheckContent & {
  readonly bandStarts: BandStartRepository
  readonly cards: Pick<CardRepository, 'cardsOf'>
  readonly random: RandomSource
  readonly clock: Clock
}

export const beginHoldoutCheck = async (
  { playerId, band, week, scaffold }: BeginHoldoutCheckCommand,
  dependencies: BeginHoldoutCheckDependencies,
): Promise<Result<HoldoutCheckView, DomainError>> => {
  const { bandStarts, cards, random, clock } = dependencies
  const now = clock.now()
  const due = await dueBandStartOf(playerId, band, week, bandStarts, now)
  if (!due.ok) {
    return due
  }
  const start = due.value
  const stored = checkOfWeek(start, week)
  if (stored?.kind === 'begun') {
    return ok(askingViewOf(band, stored, dependencies.words, scaffold))
  }
  const held = await cards.cardsOf(playerId)
  if (!held.ok) {
    return held
  }
  const begun: BegunHoldoutCheck = {
    kind: 'begun',
    week,
    begunAt: now,
    sample: holdoutCheckSampleDrawn(start, held.value, dependencies, random),
  }
  const saved = await bandStarts.saveCheck(playerId, band, begun)
  if (!saved.ok) {
    return saved
  }
  return ok(askingViewOf(band, begun, dependencies.words, scaffold))
}
