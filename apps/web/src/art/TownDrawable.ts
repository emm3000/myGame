export type TownArt = {
  readonly sourcePath: string
  readonly svg: string
}

export type TownDrawable = TownArt & {
  readonly path: string
  readonly contents: string
}
