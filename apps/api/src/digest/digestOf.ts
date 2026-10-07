import { type Digest, type FiefContent, ResourceKindSchema } from '@mygame/contracts'
import {
  type BuildingCatalog,
  type DomainError,
  deriveFullAt,
  deriveWarehouseCapacity,
  err,
  type Fief,
  type FiefEvent,
  type Instant,
  ok,
  type PlayerId,
  type Result,
} from '@mygame/domain'
import type { ChronicleReader } from '../fief/ChronicleReader'
import type { CurrentFiefDependencies } from '../fief/currentFiefOf'
import { currentFiefsOfPlayer } from '../fief/currentFiefsOfPlayer'
import { fiefChronicleOf } from '../fief/fiefChronicleOf'
import { isoOf } from '../http/isoOf'
import type { Refusal } from '../http/Refusal'
import type { DigestAcknowledgements } from './DigestAcknowledgements'

export type DigestReadDependencies = CurrentFiefDependencies & {
  readonly chronicle: ChronicleReader
  readonly digestAcknowledgements: DigestAcknowledgements
  readonly digestTerms: FiefContent['digest']
}

type DigestFief = Digest['fiefs'][number]

type FilledStore = DigestFief['stores'][number]

const millisecondsPerSecond = 1000

const isAfter = (instant: Instant, threshold: Instant): boolean =>
  instant.epochMilliseconds > threshold.epochMilliseconds

const filledStoresOf = (
  fief: Fief,
  catalog: BuildingCatalog,
  acknowledgedAt: Instant,
): Result<ReadonlyArray<FilledStore>, DomainError> => {
  const capacityUnits = deriveWarehouseCapacity(fief.buildingLevels.warehouse, catalog)
  if (!capacityUnits.ok) {
    return capacityUnits
  }
  const fullAt = deriveFullAt(fief, catalog)
  if (!fullAt.ok) {
    return fullAt
  }
  return ok(
    ResourceKindSchema.options.flatMap((resource) => {
      const fullSince = fullAt.value[resource]
      const isFull = fief.stocks[resource] >= capacityUnits.value
      return isFull && fullSince !== null && isAfter(fullSince, acknowledgedAt)
        ? [{ resource, fullSince: isoOf(fullSince) }]
        : []
    }),
  )
}

const digestFiefOf = (
  fief: Fief,
  events: ReadonlyArray<FiefEvent>,
  catalog: BuildingCatalog,
  acknowledgedAt: Instant,
): Result<DigestFief, DomainError> => {
  const stores = filledStoresOf(fief, catalog, acknowledgedAt)
  if (!stores.ok) {
    return stores
  }
  const eventsSince = events.filter(({ occurredAt }) => isAfter(occurredAt, acknowledgedAt))
  return ok({
    id: fief.id,
    name: fief.name.value,
    events: fiefChronicleOf(eventsSince).events,
    stores: [...stores.value],
  })
}

const hasNews = ({ events, stores }: DigestFief): boolean => events.length > 0 || stores.length > 0

const isAbsenceOver = (
  acknowledgedAt: Instant,
  now: Instant,
  { absenceSeconds }: FiefContent['digest'],
): boolean =>
  now.epochMilliseconds - acknowledgedAt.epochMilliseconds >= absenceSeconds * millisecondsPerSecond

export const digestOf = async (
  playerId: PlayerId,
  dependencies: DigestReadDependencies,
): Promise<Result<Digest, Refusal>> => {
  const acknowledgedAt = await dependencies.digestAcknowledgements.acknowledgedAt(playerId)
  if (acknowledgedAt === undefined) {
    return err({ kind: 'SignedOut' })
  }
  const now = dependencies.clock.now()
  const fiefs = await currentFiefsOfPlayer(playerId, dependencies)
  if (!fiefs.ok) {
    return fiefs
  }
  const digestFiefs = await Promise.all(
    fiefs.value.map(async (fief) =>
      digestFiefOf(
        fief,
        await dependencies.chronicle.eventsOf(fief.id),
        dependencies.buildingCatalog,
        acknowledgedAt,
      ),
    ),
  )
  const entries: Array<DigestFief> = []
  for (const digestFief of digestFiefs) {
    if (!digestFief.ok) {
      return digestFief
    }
    entries.push(digestFief.value)
  }
  return ok({
    acknowledgedAt: isoOf(acknowledgedAt),
    isDue: entries.some(hasNews) && isAbsenceOver(acknowledgedAt, now, dependencies.digestTerms),
    fiefs: entries,
  })
}
