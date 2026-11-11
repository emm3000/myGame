import type { Instant } from '../time/Instant'
import type { Hires } from './Hires'
import type { SiteAddress } from './SiteAddress'
import type { Stocks } from './Stocks'
import type { ProductionPercent } from './TownSettings'
import type { WasteSize } from './WasteSize'

export type JobCleanUp = {
  readonly size: WasteSize
  readonly waste: number
  readonly strength: number
  readonly hasArrived: boolean
}

export type Job = {
  readonly kind: 'out'
  readonly site: SiteAddress
  readonly team: Hires
  readonly hours: number
  readonly sentAt: Instant
  readonly oneWaySeconds: number
  readonly pay: Stocks
  readonly payPercent: ProductionPercent
  readonly calledBackAt?: Instant
  readonly cleanUp?: JobCleanUp
}

export type CleanUpJob = Job & { readonly cleanUp: JobCleanUp }

export type JobSlot = { readonly kind: 'idle' } | Job

export const idleJobSlot: JobSlot = { kind: 'idle' }
