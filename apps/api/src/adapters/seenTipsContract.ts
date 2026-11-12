import type { PlayerId, TipKind } from '@mygame/domain'
import { describe, expect, it } from 'vitest'
import type { SeenTips } from '../town/SeenTips'

export type SeenTipsFixture = {
  readonly seenTips: SeenTips
  readonly registerMayors: (playerIds: ReadonlyArray<PlayerId>) => Promise<void>
  readonly seenTipsOf: (playerId: PlayerId) => Promise<ReadonlyArray<TipKind>>
}

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'

export const seenTipsContract = (
  adapter: string,
  arrange: () => Promise<SeenTipsFixture>,
): void => {
  describe(`${adapter} as seen tips`, () => {
    it('answers no seen tip for a player who has seen none', async () => {
      const { registerMayors, seenTipsOf } = await arrange()
      await registerMayors([ana])

      expect(await seenTipsOf(ana)).toEqual([])
    })

    it('marks a tip seen', async () => {
      const { seenTips, registerMayors, seenTipsOf } = await arrange()
      await registerMayors([ana])

      await seenTips.markSeen(ana, 'waitingList')

      expect(await seenTipsOf(ana)).toEqual(['waitingList'])
    })

    it('marks a tip seen once', async () => {
      const { seenTips, registerMayors, seenTipsOf } = await arrange()
      await registerMayors([ana])

      await seenTips.markSeen(ana, 'fullStore')
      await seenTips.markSeen(ana, 'fullStore')

      expect(await seenTipsOf(ana)).toEqual(['fullStore'])
    })

    it('answers the seen tips in the order of the tip kinds', async () => {
      const { seenTips, registerMayors, seenTipsOf } = await arrange()
      await registerMayors([ana])

      await seenTips.markSeen(ana, 'jobs')
      await seenTips.markSeen(ana, 'people')

      expect(await seenTipsOf(ana)).toEqual(['people', 'jobs'])
    })

    it('keeps the seen tips of one player from another', async () => {
      const { seenTips, registerMayors, seenTipsOf } = await arrange()
      await registerMayors([ana, bruno])

      await seenTips.markSeen(ana, 'office')

      expect(await seenTipsOf(bruno)).toEqual([])
    })
  })
}
