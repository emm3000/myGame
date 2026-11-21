import { Instant } from '@mygame/domain'
import { describe, expect, it } from 'vitest'
import { accountTokenExpiryFrom } from './accountTokenExpiryFrom'

const issuedAt = Instant.fromEpochMilliseconds(Date.parse('2026-09-28T08:00:00Z'))

describe('accountTokenExpiryFrom', () => {
  it('gives a reset token one hour', () => {
    expect(accountTokenExpiryFrom('reset', issuedAt)).toEqual(
      Instant.fromEpochMilliseconds(Date.parse('2026-09-28T09:00:00Z')),
    )
  })

  it('gives a verify token one day', () => {
    expect(accountTokenExpiryFrom('verify', issuedAt)).toEqual(
      Instant.fromEpochMilliseconds(Date.parse('2026-09-29T08:00:00Z')),
    )
  })
})
