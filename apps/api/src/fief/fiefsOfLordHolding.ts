import {
  type DomainError,
  err,
  type FiefId,
  type FiefOfPlayer,
  type FiefRepository,
  ok,
  type Result,
} from '@mygame/domain'

export const fiefsOfLordHolding = async (
  { playerId, fiefId }: FiefOfPlayer,
  fiefs: Pick<FiefRepository, 'fiefsOf'>,
): Promise<Result<ReadonlyArray<FiefId>, DomainError>> => {
  const lordsFiefs = await fiefs.fiefsOf(playerId)
  return lordsFiefs.includes(fiefId) ? ok(lordsFiefs) : err({ kind: 'FiefNotFound', fiefId })
}
