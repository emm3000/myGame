const sceneColors: ReadonlyArray<string> = [
  '#cdeaf7',
  '#ffffff',
  '#8bcf6a',
  '#5fae4f',
  '#3f9f5a',
  '#8a5a3c',
  '#f7e6c8',
  '#e0674a',
  '#c24e36',
  '#d24a3f',
  '#3c5ea8',
  '#2f4b8a',
  '#9fdcf5',
  '#ffcf3f',
  '#a9b8c4',
  '#e8e3d6',
]

const resourceAccents: ReadonlyArray<string> = [
  '#2a7034',
  '#b8303f',
  '#7a5c00',
  '#4f6377',
  '#7046ad',
]

export const artPalette: ReadonlySet<string> = new Set([...sceneColors, ...resourceAccents])
