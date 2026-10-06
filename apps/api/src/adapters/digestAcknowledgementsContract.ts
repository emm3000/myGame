import { Instant, type PlayerId } from '@mygame/domain'
import { describe, expect, it } from 'vitest'
import type { DigestAcknowledgements } from '../digest/DigestAcknowledgements'

export type DigestAcknowledgementsFixture = {
  readonly acknowledgements: DigestAcknowledgements
  readonly signUp: (playerId: PlayerId, at: Instant) => Promise<void>
}

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'

const hoursAfterSignUp = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(Date.parse('2026-10-06T08:00:00Z') + hours * 3_600_000)

const signedUpAt = hoursAfterSignUp(0)

export const digestAcknowledgementsContract = (
  adapter: string,
  arrange: () => Promise<DigestAcknowledgementsFixture>,
): void => {
  describe(`${adapter} as digest acknowledgements`, () => {
    it('acknowledges a new player at sign-up', async () => {
      const { acknowledgements, signUp } = await arrange()
      await signUp(ana, signedUpAt)

      expect(await acknowledgements.acknowledgedAt(ana)).toEqual(signedUpAt)
    })

    it('stores the acknowledgement at the clock instant', async () => {
      const { acknowledgements, signUp } = await arrange()
      await signUp(ana, signedUpAt)

      await acknowledgements.acknowledge(ana, hoursAfterSignUp(5))

      expect(await acknowledgements.acknowledgedAt(ana)).toEqual(hoursAfterSignUp(5))
    })

    it('keeps the acknowledgement of one player from another', async () => {
      const { acknowledgements, signUp } = await arrange()
      await signUp(ana, signedUpAt)
      await signUp(bruno, signedUpAt)

      await acknowledgements.acknowledge(ana, hoursAfterSignUp(5))

      expect(await acknowledgements.acknowledgedAt(bruno)).toEqual(signedUpAt)
    })

    it('answers no acknowledgement for an unknown player', async () => {
      const { acknowledgements } = await arrange()

      expect(await acknowledgements.acknowledgedAt(ana)).toBe(undefined)
    })
  })
}
