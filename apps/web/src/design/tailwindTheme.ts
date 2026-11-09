import plugin from 'tailwindcss/plugin'
import {
  breakpoints,
  type ColorToken,
  color,
  durations,
  easings,
  heights,
  maxWidths,
  minHeights,
  palette,
  radii,
  scrollMargins,
  sizes,
  spacing,
  type Theme,
  type TypeStyleValues,
  transitions,
  typeFamilies,
  typeScale,
  widths,
} from './tokens'

function isColorToken(key: string): key is ColorToken {
  return key in palette
}

const colorTokens = Object.keys(palette).filter(isColorToken)

function colorsOf(tokens: ReadonlyArray<ColorToken>): Record<string, string> {
  return Object.fromEntries(tokens.map((token) => [token, color(token)]))
}

function variables(theme: Theme): Record<string, string> {
  return Object.fromEntries(colorTokens.map((token) => [`--${token}`, palette[token][theme]]))
}

const fontSize = Object.fromEntries(
  Object.entries(typeScale).map(([style, { fontSize, lineHeight, fontWeight, letterSpacing }]) => [
    style,
    [
      fontSize,
      {
        lineHeight: String(lineHeight),
        fontWeight: String(fontWeight),
        ...(letterSpacing === undefined ? {} : { letterSpacing }),
      },
    ],
  ]),
)

type TypeExtras = Record<string, string | Record<string, string>>

function typeExtrasOf({
  fontSizeFromMd,
  textTransform,
  fontVariantNumeric,
}: TypeStyleValues): TypeExtras {
  return {
    ...(textTransform === undefined ? {} : { 'text-transform': textTransform }),
    ...(fontVariantNumeric === undefined ? {} : { 'font-variant-numeric': fontVariantNumeric }),
    ...(fontSizeFromMd === undefined
      ? {}
      : { [`@media (min-width: ${breakpoints.md})`]: { 'font-size': fontSizeFromMd } }),
  }
}

const skeletonPulsePeakTowardSurface = '50%'

const skeletonPulse = {
  '@keyframes skeleton-pulse': {
    from: { 'background-color': color('surface-sunken') },
    to: {
      'background-color': `color-mix(in srgb, ${color('surface-sunken')}, ${color('surface')} ${skeletonPulsePeakTowardSurface})`,
    },
  },
}

const typeExtras = Object.fromEntries(
  Object.entries(typeScale)
    .map(([style, values]) => [`.text-${style}`, typeExtrasOf(values)] as const)
    .filter(([, extras]) => Object.keys(extras).length > 0),
)

export default plugin(
  ({ addBase, addUtilities }) => {
    addBase({
      ':root': { 'color-scheme': 'light dark', ...variables('light') },
      '@media (prefers-color-scheme: dark)': { ':root': variables('dark') },
    })
    addUtilities(
      Object.fromEntries(
        Object.entries(transitions).map(([name, transition]) => [
          `.transition-${name}`,
          { transition },
        ]),
      ),
    )
    addUtilities(typeExtras)
    addBase(skeletonPulse)
    addUtilities({
      '.animate-skeleton-pulse': {
        animation: `skeleton-pulse ${durations.calm} ${easings.standard} infinite alternate`,
      },
    })
  },
  {
    theme: {
      colors: colorsOf(colorTokens),
      spacing,
      minHeight: minHeights,
      width: widths,
      size: sizes,
      borderRadius: radii,
      fontFamily: typeFamilies,
      fontSize,
      extend: {
        height: heights,
        maxWidth: maxWidths,
        scrollMargin: scrollMargins,
        screens: breakpoints,
      },
    },
  },
)
