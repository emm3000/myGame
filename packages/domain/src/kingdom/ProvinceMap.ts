import type { Terrain } from '../fief/Terrain'

export type ProvincePlot = {
  readonly plot: number
  readonly fief: { readonly name: string; readonly isOwn: boolean } | undefined
}

export type ProvinceMap = {
  readonly kingdom: number
  readonly province: number
  readonly lastProvince: number
  readonly terrain: Terrain
  readonly plots: ReadonlyArray<ProvincePlot>
}
