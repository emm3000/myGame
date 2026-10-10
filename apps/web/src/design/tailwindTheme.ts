import plugin from 'tailwindcss/plugin'
import {
  breakpoints,
  type ColorToken,
  color,
  heights,
  maxHeights,
  maxWidths,
  minHeights,
  palette,
  radii,
  type Shadow,
  scrollMargins,
  shadows,
  sizes,
  spacing,
  type Theme,
  transitions,
  typeFamilies,
  typeScale,
  widths,
} from './tokens'

function isColorToken(key: string): key is ColorToken {
  return key in palette
}

const colorTokens = Object.keys(palette).filter(isColorToken)

function isShadow(key: string): key is Shadow {
  return key in shadows
}

const shadowTokens = Object.keys(shadows).filter(isShadow)

function variables(theme: Theme): Record<string, string> {
  return Object.fromEntries([
    ...colorTokens.map((token) => [`--${token}`, palette[token][theme]]),
    ...shadowTokens.map((token) => [`--shadow-${token}`, shadows[token][theme]]),
  ])
}

const fontSize = Object.fromEntries(
  Object.entries(typeScale).map(([style, { fontSize, ...settings }]) => [
    style,
    [fontSize, { ...settings, fontWeight: String(settings.fontWeight) }],
  ]),
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
  },
  {
    theme: {
      colors: Object.fromEntries(colorTokens.map((token) => [token, color(token)])),
      spacing,
      minHeight: minHeights,
      width: widths,
      size: sizes,
      borderRadius: radii,
      boxShadow: Object.fromEntries(shadowTokens.map((token) => [token, `var(--shadow-${token})`])),
      fontFamily: typeFamilies,
      fontSize,
      extend: {
        height: heights,
        maxWidth: maxWidths,
        maxHeight: maxHeights,
        scrollMargin: scrollMargins,
        screens: breakpoints,
      },
    },
  },
)
