import { describe, expect, it } from 'vitest'
import type { MarchTerms } from '../fief/Fief'
import type { UnitCountsByKind } from '../fief/FiefUnitCounts'
import type { PlotAddress } from '../fief/PlotAddress'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { marchOneWaySeconds } from './marchOneWaySeconds'

const plotOf = (province: number, plot: number): PlotAddress => ({ kingdom: 1, province, plot })

const partyOf = (infantry: number, cavalry: number): UnitCountsByKind => ({
  infantry,
  cavalry,
  archer: 0,
  settler: 0,
})

const shippedTerms: MarchTerms = { forage: plainForage, units: plainUnits }

const homePlot = plotOf(3, 12)

const uplandsPlot = plotOf(2, 7)

const armyOf = (infantry: number, cavalry: number, archer: number): UnitCountsByKind => ({
  infantry,
  cavalry,
  archer,
  settler: 0,
})

describe('marchOneWaySeconds', () => {
  it('times the road by the provinces and the plots crossed', () => {
    expect(marchOneWaySeconds(plotOf(1, 1), plotOf(2, 5), partyOf(1, 0), shippedTerms, 100)).toBe(
      840,
    )
    expect(marchOneWaySeconds(plotOf(2, 5), plotOf(1, 1), partyOf(1, 0), shippedTerms, 100)).toBe(
      840,
    )
  })

  it('times the road inside one province by the plots alone', () => {
    expect(marchOneWaySeconds(plotOf(1, 1), plotOf(1, 5), partyOf(1, 0), shippedTerms, 100)).toBe(
      240,
    )
  })

  it('times a road by the slowest kind sent', () => {
    expect(marchOneWaySeconds(homePlot, uplandsPlot, partyOf(0, 6), shippedTerms, 100)).toBe(450)
    expect(marchOneWaySeconds(homePlot, uplandsPlot, partyOf(12, 6), shippedTerms, 100)).toBe(900)
  })

  it('rounds a scaled road up to the whole second', () => {
    const plotOf61Seconds: MarchTerms = {
      ...shippedTerms,
      forage: { ...plainForage, secondsPerPlot: 61 },
    }
    expect(
      marchOneWaySeconds(plotOf(1, 1), plotOf(1, 2), partyOf(0, 1), plotOf61Seconds, 100),
    ).toBe(31)
  })

  it('shortens the road by the season road percent', () => {
    const lowlandsPlot = plotOf(4, 12)
    expect(marchOneWaySeconds(homePlot, lowlandsPlot, partyOf(12, 0), shippedTerms, 75)).toBe(450)
    expect(marchOneWaySeconds(homePlot, lowlandsPlot, partyOf(0, 6), shippedTerms, 75)).toBe(225)
  })

  it('rounds the road once over the kind and the season', () => {
    const plotOf61Seconds: MarchTerms = {
      ...shippedTerms,
      forage: { ...plainForage, secondsPerPlot: 61 },
    }
    expect(marchOneWaySeconds(plotOf(1, 1), plotOf(1, 2), partyOf(0, 1), plotOf61Seconds, 75)).toBe(
      23,
    )
  })

  it('times archers at the infantry pace', () => {
    expect(marchOneWaySeconds(homePlot, uplandsPlot, armyOf(0, 0, 10), shippedTerms, 100)).toBe(900)
    expect(marchOneWaySeconds(homePlot, uplandsPlot, armyOf(0, 6, 4), shippedTerms, 100)).toBe(900)
  })
})
