import { type ColorToken, palette } from '../design/tokens'

const blockTokens: ReadonlyArray<ColorToken> = [
  'block-peach',
  'block-mint',
  'block-periwinkle',
  'block-lavender',
]

const artValueOf = (token: ColorToken): string => palette[token].light

export const windowFill: string = artValueOf('on-block')

export const blockFills: ReadonlySet<string> = new Set(blockTokens.map(artValueOf))

export const artPalette: ReadonlySet<string> = new Set([...blockFills, windowFill])
