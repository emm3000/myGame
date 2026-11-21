import type { ResourceKind } from './ResourceKind'

export type Stocks = Readonly<Record<ResourceKind, number>>

export const stocksOf = (amountOf: (resource: ResourceKind) => number): Stocks => ({
  money: amountOf('money'),
  food: amountOf('food'),
  power: amountOf('power'),
  material: amountOf('material'),
})

export const creditedStocks = (stocks: Stocks, amounts: Stocks): Stocks =>
  stocksOf((resource) => stocks[resource] + amounts[resource])
