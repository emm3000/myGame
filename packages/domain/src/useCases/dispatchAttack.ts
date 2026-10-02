import { campOf } from '../camp/campOf'
import { campStrengthAt } from '../camp/campStrengthAt'
import type { DomainError } from '../DomainError'
import type { AttackOrder, Fief } from '../fief/Fief'
import type { FiefOfPlayer } from '../fief/FiefOfPlayer'
import { ownFiefOf } from '../fief/ownFiefOf'
import { refuseUnreachableTarget } from '../march/refuseUnreachableTarget'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import type { CampRegistry } from '../ports/CampRegistry'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import type { KingdomMapReader } from '../ports/KingdomMapReader'
import { err, ok, type Result } from '../Result'
import { marchSeasonAt } from '../season/marchSeasonAt'

export type DispatchAttackCommand = AttackOrder & FiefOfPlayer

export type DispatchAttackDependencies = {
  readonly fiefs: FiefRepository
  readonly map: KingdomMapReader
  readonly camps: CampRegistry
  readonly catalog: BuildingCatalog
  readonly clock: Clock
}

export const dispatchAttack = async (
  command: DispatchAttackCommand,
  { fiefs, map, camps, catalog, clock }: DispatchAttackDependencies,
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
  const room = fief.roomForAttack(command)
  if (!room.ok) {
    return room
  }
  const settings = catalog.fiefSettings()
  const reachable = await refuseUnreachableTarget(fief, command, map, settings.plotsPerProvince)
  if (!reachable.ok) {
    return reachable
  }
  const { province, plot } = command
  const address = { kingdom: fief.coordinates.kingdom, province, plot }
  const camp = campOf(address, settings.camps)
  if (camp === undefined) {
    return err({ kind: 'PlotHasNoCamp', province, plot })
  }
  const now = clock.now()
  const lastBattle = await camps.lastBattleOf(address)
  const strength = campStrengthAt(settings.camps.tiers[camp.tier], lastBattle, now)
  const attacking = fief.dispatchAttack(
    command,
    { tier: camp.tier, strength },
    now,
    settings,
    marchSeasonAt(now, settings),
  )
  if (!attacking.ok) {
    return attacking
  }
  const saved = await fiefs.save(attacking.value)
  if (!saved.ok) {
    return saved
  }
  return ok(attacking.value)
}
