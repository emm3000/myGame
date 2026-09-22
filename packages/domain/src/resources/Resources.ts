export type ResourceKind = 'wood' | 'stone' | 'iron' | 'gold' | 'food'

export type ResourceStock = {
  readonly amount: number
  readonly ratePerHour: number
  readonly capacityUnits: number
}

export type Resources = Readonly<Record<ResourceKind, ResourceStock>>
