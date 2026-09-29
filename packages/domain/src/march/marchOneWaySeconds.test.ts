import { describe, expect, it } from 'vitest'
import type { PlotAddress } from '../fief/PlotAddress'
import { plainForage } from '../testing/plainForage'
import { marchOneWaySeconds } from './marchOneWaySeconds'

const plotOf = (province: number, plot: number): PlotAddress => ({ kingdom: 1, province, plot })

describe('marchOneWaySeconds', () => {
  it('times the road by the provinces and the plots crossed', () => {
    expect(marchOneWaySeconds(plotOf(1, 1), plotOf(2, 5), plainForage)).toBe(840)
    expect(marchOneWaySeconds(plotOf(2, 5), plotOf(1, 1), plainForage)).toBe(840)
  })

  it('times the road inside one province by the plots alone', () => {
    expect(marchOneWaySeconds(plotOf(1, 1), plotOf(1, 5), plainForage)).toBe(240)
  })
})
