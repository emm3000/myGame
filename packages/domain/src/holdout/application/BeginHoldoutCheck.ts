import { readScaffold } from '#account/application/readScaffold'
import type { DomainError } from '#DomainError'
import type { Band } from '#learning/curriculum/Band'
import type { CardRepository } from '#learning/ports/CardRepository'
import type { Scaffold } from '#learning/scaffold/Scaffold'
import type { Clock } from '#platform/domain/Clock'
import type { RandomSource } from '#platform/domain/RandomSource'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import { resolveDueBandStart } from '../application/resolveDueBandStart'
import { askingViewOf } from '../domain/askingViewOf'
import type { BandStartRepository } from '../domain/BandStartRepository'
import { checkOfWeek } from '../domain/checkOfWeek'
import type { BegunHoldoutCheck } from '../domain/HoldoutCheck'
import type { HoldoutCheckView } from '../domain/HoldoutCheckView'
import type { HoldoutCheckWeek } from '../domain/HoldoutCheckWeek'
import {
  type HoldoutCheckContent,
  holdoutCheckSampleDrawn,
} from '../domain/holdoutCheckSampleDrawn'
import { type MutateHoldoutCheckDependencies, mutateHoldoutCheck } from './mutateHoldoutCheck'

export type BeginHoldoutCheckCommand = {
  readonly playerId: PlayerId
  readonly band: Band
  readonly week: HoldoutCheckWeek
}

type ScaffoldedBegin = BeginHoldoutCheckCommand & {
  readonly scaffold: Scaffold
}

type BeginPorts = HoldoutCheckContent & {
  readonly bandStarts: BandStartRepository
  readonly cards: Pick<CardRepository, 'cardsOf'>
  readonly random: RandomSource
  readonly clock: Clock
}

const beginHoldoutCheckIn = async (
  { playerId, band, week, scaffold }: ScaffoldedBegin,
  dependencies: BeginPorts,
): Promise<Result<HoldoutCheckView, DomainError>> => {
  const { bandStarts, cards, random, clock } = dependencies
  const now = clock.now()
  const due = await resolveDueBandStart(playerId, band, week, bandStarts, now)
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

export type BeginHoldoutCheckDependencies = MutateHoldoutCheckDependencies & {
  readonly random: RandomSource
}

export class BeginHoldoutCheck {
  constructor(private readonly dependencies: BeginHoldoutCheckDependencies) {}

  async execute(
    command: BeginHoldoutCheckCommand,
  ): Promise<Result<ReadonlyArray<HoldoutCheckView>, DomainError>> {
    const { lessons, random } = this.dependencies
    return mutateHoldoutCheck(
      command,
      async (stores, { band, week }, at) =>
        beginHoldoutCheckIn(
          {
            playerId: command.playerId,
            band,
            week,
            scaffold: await readScaffold(command.playerId, stores.accounts),
          },
          {
            bandStarts: stores.bandStarts,
            cards: stores.cards,
            lessons,
            words: lessons,
            random,
            clock: at,
          },
        ),
      this.dependencies,
    )
  }
}
