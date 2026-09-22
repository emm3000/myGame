import plugin from 'tailwindcss/plugin'
import {
  type ColorToken,
  color,
  palette,
  radii,
  shadows,
  spacing,
  type Theme,
  typeFamilies,
  typeScale,
} from './tokens'

function isColorToken(key: string): key is ColorToken {
  return key in palette
}

const colorTokens = Object.keys(palette).filter(isColorToken)

function variables(theme: Theme): Record<string, string> {
  return Object.fromEntries(colorTokens.map((token) => [`--${token}`, palette[token][theme]]))
}

const fontSize = Object.fromEntries(
  Object.entries(typeScale).map(([style, { fontSize, ...settings }]) => [
    style,
    [fontSize, { ...settings, fontWeight: String(settings.fontWeight) }],
  ]),
)

export default plugin(
  ({ addBase }) => {
    addBase({
      ':root': { 'color-scheme': 'light dark', ...variables('light') },
      '@media (prefers-color-scheme: dark)': { ':root': variables('dark') },
    })
  },
  {
    theme: {
      colors: Object.fromEntries(colorTokens.map((token) => [token, color(token)])),
      spacing,
      borderRadius: radii,
      boxShadow: shadows,
      fontFamily: typeFamilies,
      fontSize,
    },
  },
)
