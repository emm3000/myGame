import { describe, expect, it } from 'vitest'
import { NoPlacedOutBands } from './NoPlacedOutBands'

describe('NoPlacedOutBands', () => {
  it('answers no placed-out band, since no player can be placed yet', async () => {
    expect(await new NoPlacedOutBands().placedOutBandsOf()).toEqual({
      ok: true,
      value: [],
    })
  })
})
