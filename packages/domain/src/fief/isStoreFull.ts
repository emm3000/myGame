import type { ResourceKind } from '../resources/Resources'
import type { Stocks } from './Fief'

export const isStoreFull = (stocks: Stocks, kind: ResourceKind, capacityUnits: number): boolean =>
  stocks[kind] >= capacityUnits
