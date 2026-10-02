import type { DomainError } from '../DomainError'
import type { Fief } from '../fief/Fief'
import type { FiefOfPlayer } from '../fief/FiefOfPlayer'
import { materializeStocks } from '../fief/materializeStocks'
import { nextArtLevelOf } from '../fief/nextArtLevelOf'
import { ownFiefOf } from '../fief/ownFiefOf'
import type { ArtKind, ArtLevel, BuildingCatalog } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { err, ok, type Result } from '../Result'
import { durationPercentAt } from '../season/durationPercentAt'

export type StartStudyCommand = FiefOfPlayer & {
  readonly art: ArtKind
}

export type StartStudyDependencies = {
  readonly fiefs: FiefRepository
  readonly catalog: BuildingCatalog
  readonly clock: Clock
}

const admitStudy = (
  fief: Fief,
  art: ArtKind,
  catalog: BuildingCatalog,
): Result<ArtLevel, DomainError> => {
  const level = fief.artLevels[art]
  const next = nextArtLevelOf(art, level, catalog)
  if (next === undefined) {
    return err({ kind: 'ArtMaxLevelReached', art, level })
  }
  return ok(next)
}

export const startStudy = async (
  command: StartStudyCommand,
  { fiefs, catalog, clock }: StartStudyDependencies,
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

  const line = admitStudy(fief, command.art, catalog)
  if (!line.ok) {
    return line
  }
  const now = clock.now()
  const stocksAtNow = materializeStocks(fief, catalog, now)
  if (!stocksAtNow.ok) {
    return stocksAtNow
  }
  const studying = fief.startStudy(
    line.value,
    stocksAtNow.value,
    now,
    durationPercentAt(now, catalog.fiefSettings()).study,
  )
  if (!studying.ok) {
    return studying
  }
  const saved = await fiefs.save(studying.value)
  if (!saved.ok) {
    return saved
  }
  return ok(studying.value)
}
