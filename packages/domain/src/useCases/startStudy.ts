import type { DomainError } from '../DomainError'
import type { Fief } from '../fief/Fief'
import { materializeStocks } from '../fief/materializeStocks'
import type { PlayerId } from '../player/PlayerId'
import type { ArtKind, ArtLevel, BuildingCatalog } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { err, ok, type Result } from '../Result'

export type StartStudyCommand = {
  readonly playerId: PlayerId
  readonly art: ArtKind
}

export type StartStudyDependencies = {
  readonly fiefs: FiefRepository
  readonly catalog: BuildingCatalog
  readonly clock: Clock
}

const nextArtLevelOf = (
  fief: Fief,
  art: ArtKind,
  catalog: BuildingCatalog,
): Result<ArtLevel, DomainError> => {
  const level = fief.artLevels[art]
  const next = catalog.artLevelOf(art, level + 1)
  if (next === undefined || next.art !== art) {
    return err({ kind: 'ArtMaxLevelReached', art, level })
  }
  return ok(next)
}

export const startStudy = async (
  command: StartStudyCommand,
  { fiefs, catalog, clock }: StartStudyDependencies,
): Promise<Result<Fief, DomainError>> => {
  const stored = await fiefs.fiefOf(command.playerId)
  if (!stored.ok) {
    return stored
  }
  const fief = stored.value
  if (fief === undefined) {
    return err({ kind: 'FiefNotFound', playerId: command.playerId })
  }

  const line = nextArtLevelOf(fief, command.art, catalog)
  if (!line.ok) {
    return line
  }
  const now = clock.now()
  const stocksAtNow = materializeStocks(fief, catalog, now)
  if (!stocksAtNow.ok) {
    return stocksAtNow
  }
  const studying = fief.startStudy(line.value, stocksAtNow.value, now)
  if (!studying.ok) {
    return studying
  }
  const saved = await fiefs.save(studying.value)
  if (!saved.ok) {
    return saved
  }
  return ok(studying.value)
}
