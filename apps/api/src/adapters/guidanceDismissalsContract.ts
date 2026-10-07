import {
  Coordinates,
  type DomainError,
  Fief,
  FiefName,
  type FiefRepository,
  Instant,
  type PlayerId,
  type Result,
} from '@mygame/domain'
import { describe, expect, it } from 'vitest'
import type { GuidanceDismissals } from '../guidance/GuidanceDismissals'

export type GuidanceDismissalsFixture = {
  readonly dismissals: GuidanceDismissals
  readonly fiefs: FiefRepository
  readonly registerPlayers: (playerIds: ReadonlyArray<PlayerId>) => Promise<void>
}

const accepted = <T>(result: Result<T, DomainError>): T => {
  if (!result.ok) {
    throw new Error(`Fixture refused: ${result.error.kind}`)
  }
  return result.value
}

const foundedAt = Instant.fromEpochMilliseconds(Date.parse('2026-10-06T08:00:00Z'))

const dismissedAt = Instant.fromEpochMilliseconds(Date.parse('2026-10-06T09:00:00Z'))

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'

const anasFirstFiefId = '10000000-0000-4000-8000-000000000001'
const anasSecondFiefId = '10000000-0000-4000-8000-000000000002'

const anasFief = (id: string, plot: number): Fief =>
  Fief.found({
    id,
    playerId: ana,
    name: accepted(FiefName.create(`Valdehierro ${plot}`)),
    coordinates: accepted(Coordinates.create(1, 1, plot)),
    startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
    at: foundedAt,
  })

const dismissedAtOf = async (fiefs: FiefRepository, fiefId: string): Promise<Instant | null> => {
  const fief = accepted(await fiefs.fiefOf(fiefId))
  if (fief === undefined) {
    throw new Error(`Fixture lost fief ${fiefId}`)
  }
  return fief.guidanceDismissedAt
}

const foundAnasFiefs = async ({
  fiefs,
  registerPlayers,
}: GuidanceDismissalsFixture): Promise<void> => {
  await registerPlayers([ana, bruno])
  accepted(await fiefs.save(anasFief(anasFirstFiefId, 1)))
  accepted(await fiefs.save(anasFief(anasSecondFiefId, 2)))
}

export const guidanceDismissalsContract = (
  adapter: string,
  arrange: () => Promise<GuidanceDismissalsFixture>,
): void => {
  describe(`${adapter} as guidance dismissals`, () => {
    it('dismisses guidance for one fief and not the other', async () => {
      const fixture = await arrange()
      await foundAnasFiefs(fixture)

      const dismissal = await fixture.dismissals.dismiss(
        { playerId: ana, fiefId: anasFirstFiefId },
        dismissedAt,
      )

      expect(dismissal).toBe('dismissed')
      expect([
        await dismissedAtOf(fixture.fiefs, anasFirstFiefId),
        await dismissedAtOf(fixture.fiefs, anasSecondFiefId),
      ]).toEqual([dismissedAt, null])
    })

    it('refuses to dismiss guidance on another lord fief', async () => {
      const fixture = await arrange()
      await foundAnasFiefs(fixture)

      const dismissal = await fixture.dismissals.dismiss(
        { playerId: bruno, fiefId: anasFirstFiefId },
        dismissedAt,
      )

      expect(dismissal).toBe('fiefNotFound')
      expect(await dismissedAtOf(fixture.fiefs, anasFirstFiefId)).toBeNull()
    })

    it('refuses to dismiss guidance on an unknown fief', async () => {
      const fixture = await arrange()
      await foundAnasFiefs(fixture)

      const dismissal = await fixture.dismissals.dismiss(
        { playerId: ana, fiefId: '10000000-0000-4000-8000-000000000009' },
        dismissedAt,
      )

      expect(dismissal).toBe('fiefNotFound')
    })
  })
}
