import type { PlayerId } from '@mygame/domain'
import { describe, expect, it } from 'vitest'
import type { SeenHints } from '../hint/SeenHints'

export type SeenHintsFixture = {
  readonly seenHints: SeenHints
  readonly registerPlayers: (playerIds: ReadonlyArray<PlayerId>) => Promise<void>
}

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'

export const seenHintsContract = (
  adapter: string,
  arrange: () => Promise<SeenHintsFixture>,
): void => {
  describe(`${adapter} as seen hints`, () => {
    it('answers no hint for a player who has seen none', async () => {
      const { seenHints, registerPlayers } = await arrange()
      await registerPlayers([ana])

      expect(await seenHints.seenHintsOf(ana)).toEqual([])
    })

    it('answers the seen hints in the order the lord meets them', async () => {
      const { seenHints, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await seenHints.markSeen(ana, 'fullStore')
      await seenHints.markSeen(ana, 'peasants')

      expect(await seenHints.seenHintsOf(ana)).toEqual(['peasants', 'fullStore'])
    })

    it('stores a hint once however often it is dismissed', async () => {
      const { seenHints, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await seenHints.markSeen(ana, 'queue')
      await seenHints.markSeen(ana, 'queue')

      expect(await seenHints.seenHintsOf(ana)).toEqual(['queue'])
    })

    it('keeps the hints of one player from another', async () => {
      const { seenHints, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])

      await seenHints.markSeen(ana, 'seasons')

      expect(await seenHints.seenHintsOf(bruno)).toEqual([])
    })
  })
}
