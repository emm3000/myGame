import { Instant, type PlayerId } from '@mygame/domain'
import { describe, expect, it } from 'vitest'
import type { ReportClosings } from '../town/ReportClosings'

export type ReportClosingsFixture = {
  readonly closings: ReportClosings
  readonly signUp: (playerId: PlayerId, at: Instant) => Promise<void>
}

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'

const hoursAfterSignUp = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(Date.parse('2026-11-05T08:00:00Z') + hours * 3_600_000)

const signedUpAt = hoursAfterSignUp(0)

export const reportClosingsContract = (
  adapter: string,
  arrange: () => Promise<ReportClosingsFixture>,
): void => {
  describe(`${adapter} as Report closings`, () => {
    it('reads the Report as closed at sign-up', async () => {
      const { closings, signUp } = await arrange()
      await signUp(ana, signedUpAt)

      expect(await closings.closedAt(ana)).toEqual(signedUpAt)
    })

    it('stores the close at the instant given', async () => {
      const { closings, signUp } = await arrange()
      await signUp(ana, signedUpAt)

      await closings.close(ana, hoursAfterSignUp(5))

      expect(await closings.closedAt(ana)).toEqual(hoursAfterSignUp(5))
    })

    it('keeps the close of one player from another', async () => {
      const { closings, signUp } = await arrange()
      await signUp(ana, signedUpAt)
      await signUp(bruno, signedUpAt)

      await closings.close(ana, hoursAfterSignUp(5))

      expect(await closings.closedAt(bruno)).toEqual(signedUpAt)
    })

    it('answers no close for an unknown player', async () => {
      const { closings } = await arrange()

      expect(await closings.closedAt(ana)).toBe(undefined)
    })
  })
}
