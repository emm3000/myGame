import type { WasteSize } from './WasteSize'

export type WasteSizeTerms = {
  readonly maxWaste: number
  readonly regrowHours: number
}

export type WasteTerms = {
  readonly siteFraction: number
  readonly moneyPerPoint: number
  readonly materialPerPoint: number
  readonly sizes: Readonly<Record<WasteSize, WasteSizeTerms>>
}
