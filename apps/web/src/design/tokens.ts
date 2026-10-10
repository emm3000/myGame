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
  | 'on-moss'
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
  | 'peasants'

const umber = { light: '#6b4a2b', dark: '#b08057' }

const onUmber = { light: '#f9f3e4', dark: '#1e1811' }

export const palette: Readonly<Record<ColorToken, Readonly<Record<Theme, string>>>> = {
  surface: { light: '#f1e7d0', dark: '#1e1811' },
  'surface-raised': { light: '#f9f3e4', dark: '#2a2219' },
  'surface-sunken': { light: '#e6d9bc', dark: '#171209' },
  line: { light: '#cdbb97', dark: '#4a3c2b' },
  'line-strong': { light: '#8c7554', dark: '#7d6a50' },
  ink: { light: '#2a2017', dark: '#efe4cf' },
  'ink-muted': { light: '#6b5b45', dark: '#b3a389' },
  'ink-faint': { light: '#736651', dark: '#99876c' },
  ochre: { light: '#b8862a', dark: '#d9a848' },
  umber,
  'on-umber': onUmber,
  slate: { light: '#5c6670', dark: '#98a3ad' },
  moss: { light: '#516d34', dark: '#8fb05f' },
  'on-moss': onUmber,
  'moss-soft': { light: '#dfe6c8', dark: '#2d3a1f' },
  river: { light: '#3f6f8c', dark: '#7aaac6' },
  rust: { light: '#a8442c', dark: '#e0765a' },
  'rust-soft': { light: '#f0d6cc', dark: '#43201a' },
  wood: { light: '#966520', dark: '#e0a24a' },
  stone: { light: '#736f67', dark: '#c2bdb2' },
  iron: { light: '#46586a', dark: '#8ea2b6' },
  gold: { light: '#886c14', dark: '#e9c53f' },
  food: { light: '#617727', dark: '#a9c45a' },
  peasants: umber,
}

export function color(token: ColorToken): string {
  return `var(--${token})`
}

export type TypeFamily = 'display' | 'body' | 'utility'

export const typeFamilies: Readonly<Record<TypeFamily, string>> = {
  display: "'Cormorant Garamond', 'Palatino Linotype', Georgia, serif",
  body: "Alegreya, Georgia, 'Times New Roman', serif",
  utility: "'Alegreya Sans', 'Gill Sans', 'Trebuchet MS', sans-serif",
}

export type SpaceStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 12

export const spacing: Readonly<Record<SpaceStep, string>> = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  12: '48px',
}

export type MinHeight = 'control' | 'plot'

export const minHeights: Readonly<Record<MinHeight, string>> = {
  control: '44px',
  plot: '96px',
}

export type Width = 'numeral' | 'switch'

export const widths: Readonly<Record<Width, string>> = {
  numeral: '74px',
  switch: '44px',
}

export type MaxWidth = 'form'

export const maxWidths: Readonly<Record<MaxWidth, string>> = {
  form: '640px',
}

export type MaxHeight = 'band'

export const maxHeights: Readonly<Record<MaxHeight, string>> = {
  band: '240px',
}

export type Breakpoint = 'md' | 'lg'

export const breakpoints: Readonly<Record<Breakpoint, string>> = {
  md: '48rem',
  lg: '64rem',
}

export const statusBlockHeightProperty = '--status-block-height'

export type ScrollMargin = 'status'

export const scrollMargins: Readonly<Record<ScrollMargin, string>> = {
  status: `calc(var(${statusBlockHeightProperty}) + 1px)`,
}

export type Size = 'icon' | 'roundel' | 'roundel-sm'

export const sizes: Readonly<Record<Size, string>> = {
  icon: '20px',
  roundel: '40px',
  'roundel-sm': '28px',
}

export type Height = 'track'

export const heights: Readonly<Record<Height, string>> = {
  track: '6px',
}

export type StrokeWidth = 'icon'

export const strokeWidths: Readonly<Record<StrokeWidth, number>> = {
  icon: 1.5,
}

export type Radius = 'sm' | 'md' | 'pill'

export const radii: Readonly<Record<Radius, string>> = {
  sm: '4px',
  md: '8px',
  pill: '999px',
}

export type Shadow = 'card'

export const shadows: Readonly<Record<Shadow, Readonly<Record<Theme, string>>>> = {
  card: { light: '0 1px 3px #2a20171a', dark: '0 0 0 1px #efe4cf24' },
}

export type Transition = 'track'

export const transitions: Readonly<Record<Transition, string>> = {
  track: 'width 400ms ease-out',
}

export type TypeStyle =
  | 'display-xl'
  | 'title'
  | 'heading'
  | 'body'
  | 'caption'
  | 'numeral-lg'
  | 'numeral'
  | 'label'
  | 'button'

export interface TypeStyleValues {
  readonly fontSize: string
  readonly lineHeight: string
  readonly fontWeight: number
  readonly letterSpacing?: string
}

export const typeScale: Readonly<Record<TypeStyle, TypeStyleValues>> = {
  'display-xl': { fontSize: '36px', lineHeight: '40px', fontWeight: 500 },
  title: { fontSize: '24px', lineHeight: '28px', fontWeight: 600 },
  heading: { fontSize: '18px', lineHeight: '24px', fontWeight: 700 },
  body: { fontSize: '16px', lineHeight: '24px', fontWeight: 400 },
  caption: { fontSize: '13px', lineHeight: '18px', fontWeight: 400 },
  'numeral-lg': { fontSize: '22px', lineHeight: '26px', fontWeight: 700 },
  numeral: { fontSize: '16px', lineHeight: '20px', fontWeight: 600 },
  label: {
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: 600,
    letterSpacing: '0.06em',
  },
  button: { fontSize: '15px', lineHeight: '20px', fontWeight: 600 },
}
