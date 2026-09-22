export type Theme = 'light' | 'dark'

export type ColorToken =
  | 'surface'
  | 'surface-raised'
  | 'surface-sunken'
  | 'line'
  | 'line-strong'
  | 'ink'
  | 'ink-muted'
  | 'ink-faint'
  | 'ochre'
  | 'umber'
  | 'on-umber'
  | 'slate'
  | 'moss'
  | 'moss-soft'
  | 'river'
  | 'rust'
  | 'rust-soft'
  | 'wood'
  | 'stone'
  | 'iron'
  | 'gold'
  | 'food'

export const palette: Readonly<Record<ColorToken, Readonly<Record<Theme, string>>>> = {
  surface: { light: '#f1e7d0', dark: '#1e1811' },
  'surface-raised': { light: '#f9f3e4', dark: '#2a2219' },
  'surface-sunken': { light: '#e6d9bc', dark: '#171209' },
  line: { light: '#cdbb97', dark: '#4a3c2b' },
  'line-strong': { light: '#8c7554', dark: '#7d6a50' },
  ink: { light: '#2a2017', dark: '#efe4cf' },
  'ink-muted': { light: '#6b5b45', dark: '#b3a389' },
  'ink-faint': { light: '#9a8a6f', dark: '#7f7058' },
  ochre: { light: '#b8862a', dark: '#d9a848' },
  umber: { light: '#6b4a2b', dark: '#a8784f' },
  'on-umber': { light: '#f9f3e4', dark: '#1e1811' },
  slate: { light: '#5c6670', dark: '#98a3ad' },
  moss: { light: '#5b7a3a', dark: '#8fb05f' },
  'moss-soft': { light: '#dfe6c8', dark: '#2d3a1f' },
  river: { light: '#3f6f8c', dark: '#7aaac6' },
  rust: { light: '#a8442c', dark: '#e0765a' },
  'rust-soft': { light: '#f0d6cc', dark: '#43201a' },
  wood: { light: '#c4862a', dark: '#e0a24a' },
  stone: { light: '#8f8a80', dark: '#c2bdb2' },
  iron: { light: '#46586a', dark: '#8ea2b6' },
  gold: { light: '#c9a21e', dark: '#e9c53f' },
  food: { light: '#7f9a32', dark: '#a9c45a' },
}

export function color(token: ColorToken): string {
  return `var(--${token})`
}

function declarations(theme: Theme): string {
  return Object.entries(palette)
    .map(([token, values]) => `--${token}:${values[theme]};`)
    .join('')
}

export function paletteStyleSheet(): string {
  return [
    `:root{color-scheme:light dark;${declarations('light')}}`,
    `@media (prefers-color-scheme: dark){:root{${declarations('dark')}}}`,
  ].join('')
}

export type TypeFamily = 'display' | 'body' | 'utility'

export const typeFamilies: Readonly<Record<TypeFamily, string>> = {
  display: "'Cormorant Garamond', 'Palatino Linotype', Georgia, serif",
  body: "Alegreya, Georgia, 'Times New Roman', serif",
  utility: "'Alegreya Sans', 'Gill Sans', 'Trebuchet MS', sans-serif",
}
