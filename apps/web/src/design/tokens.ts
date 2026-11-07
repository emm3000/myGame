export type Theme = 'light' | 'dark'

export type ColorToken =
  | 'surface'
  | 'surface-raised'
  | 'surface-sunken'
  | 'line'
  | 'line-strong'
  | 'ink'
  | 'ink-muted'
  | 'action'
  | 'on-action'
  | 'focus'
  | 'warning-ink'
  | 'warning-soft'
  | 'destructive-ink'
  | 'destructive-soft'
  | 'block-peach'
  | 'block-mint'
  | 'block-periwinkle'
  | 'block-lavender'
  | 'on-block'
  | 'on-block-muted'

function inBothThemes(value: string): Readonly<Record<Theme, string>> {
  return { light: value, dark: value }
}

export const palette: Readonly<Record<ColorToken, Readonly<Record<Theme, string>>>> = {
  surface: { light: '#f4f3f1', dark: '#15141a' },
  'surface-raised': { light: '#fbfaf9', dark: '#1e1d24' },
  'surface-sunken': { light: '#e9e7e3', dark: '#2b2a32' },
  line: { light: '#dad9d8', dark: '#2e2d35' },
  'line-strong': { light: '#858389', dark: '#85838c' },
  ink: { light: '#15141a', dark: '#f4f3f1' },
  'ink-muted': { light: '#5f5d65', dark: '#aeacb4' },
  action: { light: '#15141a', dark: '#f4f3f1' },
  'on-action': { light: '#f4f3f1', dark: '#15141a' },
  focus: { light: '#15141a', dark: '#f4f3f1' },
  'warning-ink': { light: '#7f5210', dark: '#e8bf74' },
  'warning-soft': { light: '#f3e6c8', dark: '#3a2e16' },
  'destructive-ink': { light: '#a33a3a', dark: '#f0a6a6' },
  'destructive-soft': { light: '#f3dada', dark: '#3f2224' },
  'block-peach': inBothThemes('#f5c9a8'),
  'block-mint': inBothThemes('#bfe3cb'),
  'block-periwinkle': inBothThemes('#c6d3f5'),
  'block-lavender': inBothThemes('#dcc8f0'),
  'on-block': inBothThemes('#15141a'),
  'on-block-muted': inBothThemes('#45444c'),
}

export function color(token: ColorToken): string {
  return `var(--${token})`
}

export type TypeFamily = 'sans'

export const typeFamilies: Readonly<Record<TypeFamily, string>> = {
  sans: "'Schibsted Grotesk', system-ui, -apple-system, 'Segoe UI', sans-serif",
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

const controlMin = '48px'

export type MinHeight = 'action' | 'secondary' | 'control' | 'plot'

export const minHeights: Readonly<Record<MinHeight, string>> = {
  action: '60px',
  secondary: '52px',
  control: controlMin,
  plot: '96px',
}

export type Width = 'numeral' | 'control'

export const widths: Readonly<Record<Width, string>> = {
  numeral: '74px',
  control: controlMin,
}

export type MaxWidth = 'form' | 'reading'

export const maxWidths: Readonly<Record<MaxWidth, string>> = {
  form: '640px',
  reading: '65ch',
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

export type Size = 'icon' | 'icon-small' | 'thumbnail' | 'place-card' | 'dash'

export const sizes: Readonly<Record<Size, string>> = {
  icon: '24px',
  'icon-small': '20px',
  thumbnail: '96px',
  'place-card': '160px',
  dash: '4px',
}

export type Height = 'track'

export const heights: Readonly<Record<Height, string>> = {
  track: '3px',
}

export type StrokeWidth = 'hairline' | 'control' | 'icon' | 'mark' | 'focus' | 'ring'

export const strokeWidths: Readonly<Record<StrokeWidth, number>> = {
  hairline: 1,
  control: 2,
  icon: 2,
  mark: 2,
  focus: 3,
  ring: 4,
}

export type Radius = 'sm' | 'md' | 'lg' | 'pill'

export const radii: Readonly<Record<Radius, string>> = {
  sm: '8px',
  md: '16px',
  lg: '28px',
  pill: '999px',
}

export type Duration = 'instant' | 'quick' | 'base' | 'calm'

export const durations: Readonly<Record<Duration, string>> = {
  instant: '0ms',
  quick: '120ms',
  base: '200ms',
  calm: '320ms',
}

export type Easing = 'standard' | 'exit'

export const easings: Readonly<Record<Easing, string>> = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  exit: 'cubic-bezier(0.3, 0, 1, 1)',
}

export type Transition = 'track' | 'window' | 'hue' | 'deal' | 'ring' | 'rate'

export const transitions: Readonly<Record<Transition, string>> = {
  track: `width ${durations.calm} ${easings.standard}`,
  window: `scale ${durations.calm} ${easings.standard}`,
  hue: `fill ${durations.calm} ${easings.standard}`,
  deal: `rotate ${durations.calm} ${easings.standard}`,
  ring: `stroke ${durations.calm} ${easings.standard}`,
  rate: `opacity ${durations.calm} ${easings.standard}`,
}

export type TypeStyle =
  | 'word'
  | 'display'
  | 'numeral'
  | 'reading'
  | 'heading'
  | 'button'
  | 'title'
  | 'gloss'
  | 'body'
  | 'label'
  | 'caption'
  | 'meta'

export interface TypeStyleValues {
  readonly fontSize: string
  readonly fontSizeFromMd?: string
  readonly lineHeight: number
  readonly fontWeight: number
  readonly letterSpacing?: string
  readonly textTransform?: 'uppercase'
  readonly fontVariantNumeric?: 'tabular-nums'
}

export const typeScale: Readonly<Record<TypeStyle, TypeStyleValues>> = {
  word: {
    fontSize: '44px',
    fontSizeFromMd: '52px',
    lineHeight: 1.05,
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  display: { fontSize: '40px', lineHeight: 1.05, fontWeight: 800, letterSpacing: '-0.02em' },
  numeral: {
    fontSize: '26px',
    lineHeight: 1.15,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
  },
  reading: { fontSize: '20px', lineHeight: 1.5, fontWeight: 400 },
  heading: { fontSize: '20px', lineHeight: 1.35, fontWeight: 600 },
  button: { fontSize: '18px', lineHeight: 1.33, fontWeight: 700 },
  title: { fontSize: '17px', lineHeight: 1.35, fontWeight: 600 },
  gloss: { fontSize: '17px', lineHeight: 1.5, fontWeight: 400 },
  body: { fontSize: '16px', lineHeight: 1.5, fontWeight: 400 },
  label: { fontSize: '15px', lineHeight: 1.4, fontWeight: 600 },
  caption: { fontSize: '15px', lineHeight: 1.5, fontWeight: 400 },
  meta: {
    fontSize: '14px',
    lineHeight: 1.3,
    fontWeight: 500,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
}
