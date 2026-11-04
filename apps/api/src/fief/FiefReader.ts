import type { DomainError, Fief, FiefId, FiefRepository, HeldCard, Result } from '@mygame/domain'

export type FiefWithCards = {
  readonly fief: Fief
  readonly cards: ReadonlyArray<HeldCard>
}

export interface FiefReader extends Omit<FiefRepository, 'save'> {
  fiefWithCardsOf(fiefId: FiefId): Promise<Result<FiefWithCards | undefined, DomainError>>
}
