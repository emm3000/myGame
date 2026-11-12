import type { ArtFamily } from './ArtFamily'

export type TownArt = {
  readonly sourcePath: string
  readonly svg: string
  readonly family: ArtFamily
}

export type TownDrawable = TownArt & {
  readonly path: string
  readonly contents: string
}
