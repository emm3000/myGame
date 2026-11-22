import {
  type CardRepository,
  type DomainError,
  Instant,
  MemoryCard,
  ok,
  type PlayerId,
  type Result,
} from '@mygame/domain'
import { describe, expect, it } from 'vitest'

export type CardRepositoryFixture = {
  readonly cards: CardRepository
  readonly registerPlayers: (playerIds: ReadonlyArray<PlayerId>) => Promise<void>
}

const accepted = <T>(result: Result<T, DomainError>): T => {
  if (!result.ok) {
    throw new Error(`Fixture refused: ${result.error.kind}`)
  }
  return result.value
}

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'

const instantAt = (iso: string): Instant => Instant.fromEpochMilliseconds(Date.parse(iso))

const lessonFinishedAt = instantAt('2026-11-10T09:00:00Z')

const enteredCard = MemoryCard.entered(lessonFinishedAt)

const retainedCard = accepted(
  MemoryCard.restore({
    state: 'review',
    step: null,
    stability: 46.3169,
    difficulty: 2.0975,
    lastReviewAt: instantAt('2026-11-23T09:10:00Z'),
    lastRating: 'good',
    enteredAt: lessonFinishedAt,
    retainedAt: instantAt('2026-11-23T09:10:00Z'),
  }),
)

const relearningCard = accepted(
  MemoryCard.restore({
    state: 'relearning',
    step: 0,
    stability: 0.6077,
    difficulty: 5.3,
    lastReviewAt: instantAt('2026-11-12T09:10:00Z'),
    lastRating: 'again',
    enteredAt: lessonFinishedAt,
    retainedAt: null,
  }),
)

export const cardRepositoryContract = (
  adapter: string,
  arrange: () => Promise<CardRepositoryFixture>,
): void => {
  describe(`${adapter} as a CardRepository`, () => {
    it('answers no card for a player who holds none', async () => {
      const { cards, registerPlayers } = await arrange()
      await registerPlayers([ana])

      expect(await cards.cardsOf(ana)).toEqual(ok([]))
    })

    it('restores a card that entered with its lesson and was never reviewed', async () => {
      const { cards, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await cards.save(ana, { wordId: 'school', card: enteredCard })

      expect(await cards.cardsOf(ana)).toEqual(ok([{ wordId: 'school', card: enteredCard }]))
    })

    it('restores a retained card with every stored value', async () => {
      const { cards, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await cards.save(ana, { wordId: 'school', card: retainedCard })

      expect(await cards.cardsOf(ana)).toEqual(ok([{ wordId: 'school', card: retainedCard }]))
    })

    it('restores a relearning card at its step', async () => {
      const { cards, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await cards.save(ana, { wordId: 'school', card: relearningCard })

      expect(await cards.cardsOf(ana)).toEqual(ok([{ wordId: 'school', card: relearningCard }]))
    })

    it('replaces the card of a word on its next save', async () => {
      const { cards, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await cards.save(ana, { wordId: 'school', card: enteredCard })
      await cards.save(ana, { wordId: 'school', card: retainedCard })

      expect(await cards.cardsOf(ana)).toEqual(ok([{ wordId: 'school', card: retainedCard }]))
    })

    it("reads a player's cards in word order", async () => {
      const { cards, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await cards.save(ana, { wordId: 'school', card: enteredCard })
      await cards.save(ana, { wordId: 'food', card: enteredCard })

      const read = await cards.cardsOf(ana)
      expect(read.ok && read.value.map(({ wordId }) => wordId)).toEqual(['food', 'school'])
    })

    it('keeps the cards of one player from another', async () => {
      const { cards, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])

      await cards.save(ana, { wordId: 'school', card: enteredCard })
      await cards.save(bruno, { wordId: 'school', card: retainedCard })

      expect(await cards.cardsOf(ana)).toEqual(ok([{ wordId: 'school', card: enteredCard }]))
    })
  })
}
