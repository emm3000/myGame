import type { DomainError } from '../DomainError'
import type { Fief, TransportOrder } from '../fief/Fief'
import type { FiefOfPlayer } from '../fief/FiefOfPlayer'
import { materializeStocks } from '../fief/materializeStocks'
import { ownFiefOf } from '../fief/ownFiefOf'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { err, ok, type Result } from '../Result'
import { marchSeasonAt } from '../season/marchSeasonAt'

export type DispatchTransportCommand = TransportOrder & FiefOfPlayer

export type DispatchTransportDependencies = {
  readonly fiefs: Pick<FiefRepository, 'fiefOf' | 'save'>
  readonly catalog: BuildingCatalog
  readonly clock: Clock
}

const destinationOf = async (
  command: DispatchTransportCommand,
  fiefs: DispatchTransportDependencies['fiefs'],
): Promise<Result<Fief, DomainError>> => {
  if (command.toFiefId === command.fiefId) {
    return err({ kind: 'MarchToOwnPlot' })
  }
  const stored = await fiefs.fiefOf(command.toFiefId)
  if (!stored.ok) {
    return stored
  }
  return ownFiefOf(stored.value, { playerId: command.playerId, fiefId: command.toFiefId })
}

export const dispatchTransport = async (
  command: DispatchTransportCommand,
  { fiefs, catalog, clock }: DispatchTransportDependencies,
): Promise<Result<Fief, DomainError>> => {
  const stored = await fiefs.fiefOf(command.fiefId)
  if (!stored.ok) {
    return stored
  }
  const owned = ownFiefOf(stored.value, command)
  if (!owned.ok) {
    return owned
  }
  const fief = owned.value
  const room = fief.roomForTransport(command)
  if (!room.ok) {
    return room
  }
  const destination = await destinationOf(command, fiefs)
  if (!destination.ok) {
    return destination
  }
  const now = clock.now()
  const stocksAtNow = materializeStocks(fief, catalog, now)
  if (!stocksAtNow.ok) {
    return stocksAtNow
  }
  const settings = catalog.fiefSettings()
  const transport = fief.dispatchTransport(
    command,
    destination.value,
    stocksAtNow.value,
    now,
    settings,
    marchSeasonAt(now, settings),
  )
  if (!transport.ok) {
    return transport
  }
  const { origin } = transport.value
  const savedOrigin = await fiefs.save(origin)
  if (!savedOrigin.ok) {
    return savedOrigin
  }
  const savedDestination = await fiefs.save(transport.value.destination)
  if (!savedDestination.ok) {
    return savedDestination
  }
  return ok(origin)
}
