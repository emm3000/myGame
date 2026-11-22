import type { PlayerId } from '#player/PlayerId'
import { ok } from '#Result'
import type { CardRepository } from '../domain/CardRepository'
import type { HeldCard } from '../domain/HeldCard'
import type { WordId } from '../domain/Lesson'

export type InMemoryCards = CardRepository & {
  heldCardOf(playerId: PlayerId, wordId: WordId): HeldCard | undefined
  enteredWordIdsOf(playerId: PlayerId): ReadonlyArray<WordId>
}

export type OwnedCard = HeldCard & {
  readonly playerId: PlayerId
}

const byWordId = (left: HeldCard, right: HeldCard): number =>
  left.wordId < right.wordId ? -1 : Number(left.wordId > right.wordId)

export const inMemoryCards = (existing: ReadonlyArray<OwnedCard>): InMemoryCards => {
  const keyOf = (playerId: PlayerId, wordId: WordId): string => `${playerId}/${wordId}`
  const cards = new Map(existing.map((owned) => [keyOf(owned.playerId, owned.wordId), owned]))
  return {
    heldCardOf: (playerId, wordId) => cards.get(keyOf(playerId, wordId)),
    enteredWordIdsOf: (playerId) =>
      [...cards.values()]
        .filter((owned) => owned.playerId === playerId)
        .map(({ wordId }) => wordId),
    cardsOf: async (playerId) =>
      ok(
        [...cards.values()]
          .filter((owned) => owned.playerId === playerId)
          .map(({ wordId, card }) => ({ wordId, card }))
          .sort(byWordId),
      ),
    save: async (playerId, held) => {
      cards.set(keyOf(playerId, held.wordId), { playerId, ...held })
      return ok(undefined)
    },
  }
}
