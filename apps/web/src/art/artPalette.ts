import { type ColorToken, palette } from '../design/tokens'

const resourceAccents: ReadonlyArray<ColorToken> = ['money', 'food', 'power', 'material', 'people']

const sceneColors = Object.keys(palette).filter((token): token is ColorToken =>
  token.startsWith('scene-'),
)

export const artPalette: ReadonlySet<string> = new Set(
  [...sceneColors, ...resourceAccents].map((token) => palette[token].light),
)
