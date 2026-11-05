import {
  type BuildingCatalog,
  type Clock,
  type DomainError,
  type FiefOfPlayer,
  type IdGenerator,
  type ResolvedFief,
  type Result,
  resolveUpgrade,
} from '@mygame/domain'
import type { TransactionStores } from '../adapters/postgres/postgresTransaction'

export type ResolveInTransactionDependencies = {
  readonly buildingCatalog: BuildingCatalog
  readonly ids: IdGenerator
}

export type ResolvingStores = Pick<TransactionStores, 'fiefs' | 'chronicle' | 'camps'>

export const resolveFiefInTransaction = (
  fiefOfPlayer: FiefOfPlayer,
  { fiefs, chronicle, camps }: ResolvingStores,
  clock: Clock,
  { buildingCatalog, ids }: ResolveInTransactionDependencies,
): Promise<Result<ResolvedFief, DomainError>> =>
  resolveUpgrade(fiefOfPlayer, {
    fiefs,
    chronicle,
    camps,
    catalog: buildingCatalog,
    clock,
    ids,
  })
