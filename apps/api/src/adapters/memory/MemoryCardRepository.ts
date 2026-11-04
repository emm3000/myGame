import {
  type CardRepository,
  type DomainError,
  type HeldCard,
  ok,
  type PlayerId,
  type Result,
  type WordId,
} from '@mygame/domain'

const byWordId = (left: HeldCard, right: HeldCard): number =>
  left.wordId < right.wordId ? -1 : Number(left.wordId > right.wordId)

export class MemoryCardRepository implements CardRepository {
  private readonly cards = new Map<PlayerId, ReadonlyMap<WordId, HeldCard>>()

  async cardsOf(playerId: PlayerId): Promise<Result<ReadonlyArray<HeldCard>, DomainError>> {
    return ok([...(this.cards.get(playerId)?.values() ?? [])].sort(byWordId))
  }

  async save(playerId: PlayerId, held: HeldCard): Promise<Result<void, DomainError>> {
    this.cards.set(playerId, new Map([...(this.cards.get(playerId) ?? []), [held.wordId, held]]))
    return ok(undefined)
  }
}
