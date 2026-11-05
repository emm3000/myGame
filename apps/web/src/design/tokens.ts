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
  | 'action'
  | 'on-action'
  | 'action-soft'
  | 'gloss'
  | 'gloss-soft'
  | 'right'
  | 'right-soft'
  | 'miss'
  | 'miss-soft'
  | 'hint'
  | 'hint-soft'
  | 'focus'
  | 'badge'
  | 'on-badge'
  | 'money'
  | 'food'
  | 'power'
  | 'material'
  | 'people'
  | 'scene-sky'
  | 'scene-cloud'
  | 'scene-grass'
  | 'scene-grass-deep'
  | 'scene-tree'
  | 'scene-trunk'
  | 'scene-wall'
  | 'scene-brick'
  | 'scene-brick-deep'
  | 'scene-barn'
  | 'scene-roof'
  | 'scene-roof-deep'
  | 'scene-window'
  | 'scene-sun'
  | 'scene-steel'
  | 'scene-path'

function inBothThemes(value: string): Readonly<Record<Theme, string>> {
  return { light: value, dark: value }
}

export const palette: Readonly<Record<ColorToken, Readonly<Record<Theme, string>>>> = {
  surface: { light: '#f3f6f4', dark: '#0f1a1d' },
  'surface-raised': { light: '#ffffff', dark: '#172429' },
  'surface-sunken': { light: '#e4ebe8', dark: '#0a1316' },
  line: { light: '#cfd9d5', dark: '#2b3c42' },
  'line-strong': { light: '#6a7c78', dark: '#7d9198' },
  ink: { light: '#14232a', dark: '#e9f1ef' },
  'ink-muted': { light: '#455860', dark: '#b2c2c3' },
  'ink-faint': { light: '#5a6c72', dark: '#93a5a8' },
  action: { light: '#0b6670', dark: '#5ccfc4' },
  'on-action': { light: '#ffffff', dark: '#062024' },
  'action-soft': { light: '#d6efec', dark: '#11383a' },
  gloss: { light: '#0b6670', dark: '#5ccfc4' },
  'gloss-soft': { light: '#e2f4f1', dark: '#143437' },
  right: { light: '#1f58a8', dark: '#8db8ff' },
  'right-soft': { light: '#e0ebfb', dark: '#152a49' },
  miss: { light: '#9b4708', dark: '#ffad6b' },
  'miss-soft': { light: '#fcebdc', dark: '#3d2412' },
  hint: { light: '#6a5200', dark: '#f0cf5a' },
  'hint-soft': { light: '#fbf1c9', dark: '#342c0c' },
  focus: { light: '#b0157f', dark: '#ff86d6' },
  badge: { light: '#14232a', dark: '#e9f1ef' },
  'on-badge': { light: '#ffffff', dark: '#0f1a1d' },
  money: { light: '#2a7034', dark: '#7fd08a' },
  food: { light: '#b8303f', dark: '#ff8f97' },
  power: { light: '#7a5c00', dark: '#f2c84b' },
  material: { light: '#4f6377', dark: '#a9bed1' },
  people: { light: '#7046ad', dark: '#c3a6f2' },
  'scene-sky': inBothThemes('#cdeaf7'),
  'scene-cloud': inBothThemes('#ffffff'),
  'scene-grass': inBothThemes('#8bcf6a'),
  'scene-grass-deep': inBothThemes('#5fae4f'),
  'scene-tree': inBothThemes('#3f9f5a'),
  'scene-trunk': inBothThemes('#8a5a3c'),
  'scene-wall': inBothThemes('#f7e6c8'),
  'scene-brick': inBothThemes('#e0674a'),
  'scene-brick-deep': inBothThemes('#c24e36'),
  'scene-barn': inBothThemes('#d24a3f'),
  'scene-roof': inBothThemes('#3c5ea8'),
  'scene-roof-deep': inBothThemes('#2f4b8a'),
  'scene-window': inBothThemes('#9fdcf5'),
  'scene-sun': inBothThemes('#ffcf3f'),
  'scene-steel': inBothThemes('#a9b8c4'),
  'scene-path': inBothThemes('#e8e3d6'),
}

export function color(token: ColorToken): string {
  return `var(--${token})`
}

export type TypeFamily = 'sans'

export const typeFamilies: Readonly<Record<TypeFamily, string>> = {
  sans: "'Atkinson Hyperlegible Next', 'Atkinson Hyperlegible', system-ui, -apple-system, 'Segoe UI', sans-serif",
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

export type MinHeight = 'control' | 'plot'

export const minHeights: Readonly<Record<MinHeight, string>> = {
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

export type Size = 'icon' | 'icon-small' | 'thumbnail' | 'place-card'

export const sizes: Readonly<Record<Size, string>> = {
  icon: '24px',
  'icon-small': '20px',
  thumbnail: '96px',
  'place-card': '160px',
}

export type Height = 'track'

export const heights: Readonly<Record<Height, string>> = {
  track: '6px',
}

export type StrokeWidth = 'hairline' | 'control' | 'icon' | 'mark' | 'focus'

export const strokeWidths: Readonly<Record<StrokeWidth, number>> = {
  hairline: 1,
  control: 2,
  icon: 2,
  mark: 2,
  focus: 3,
}

export type Radius = 'sm' | 'md' | 'lg' | 'pill'

export const radii: Readonly<Record<Radius, string>> = {
  sm: '6px',
  md: '12px',
  lg: '20px',
  pill: '999px',
}

export type Shadow = 'ledge'

export const shadows: Readonly<Record<Shadow, Readonly<Record<Theme, string>>>> = {
  ledge: { light: `0 2px 0 ${palette.line.light}`, dark: `0 2px 0 ${palette.line.dark}` },
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

export type Transition = 'track'

export const transitions: Readonly<Record<Transition, string>> = {
  track: `width ${durations.calm} ${easings.standard}`,
}

export type TypeStyle =
  | 'display'
  | 'title'
  | 'heading'
  | 'word'
  | 'reading'
  | 'body'
  | 'gloss'
  | 'button'
  | 'label'
  | 'caption'
  | 'numeral'

export interface TypeStyleValues {
  readonly fontSize: string
  readonly lineHeight: number
  readonly fontWeight: number
  readonly letterSpacing?: string
}

export const typeScale: Readonly<Record<TypeStyle, TypeStyleValues>> = {
  display: { fontSize: '40px', lineHeight: 1.2, fontWeight: 800, letterSpacing: '-0.01em' },
  title: { fontSize: '28px', lineHeight: 1.3, fontWeight: 700 },
  heading: { fontSize: '22px', lineHeight: 1.4, fontWeight: 700 },
  word: { fontSize: '36px', lineHeight: 1.25, fontWeight: 700 },
  reading: { fontSize: '20px', lineHeight: 1.5, fontWeight: 400 },
  body: { fontSize: '18px', lineHeight: 1.5, fontWeight: 400 },
  gloss: { fontSize: '17px', lineHeight: 1.5, fontWeight: 400 },
  button: { fontSize: '18px', lineHeight: 1.33, fontWeight: 700 },
  label: { fontSize: '16px', lineHeight: 1.5, fontWeight: 700 },
  caption: { fontSize: '16px', lineHeight: 1.5, fontWeight: 400 },
  numeral: { fontSize: '18px', lineHeight: 1.33, fontWeight: 700 },
}
