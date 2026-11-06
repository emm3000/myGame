import { type ColorToken, palette, type Theme } from '../tokens'
import { camelCaseOf } from './camelCaseOf'
import type { DesignSystemFile } from './DesignSystemFile'
import { kotlinPackage } from './kotlinPackage'

const tokens = Object.keys(palette) as ReadonlyArray<ColorToken>

function colorOf(hex: string): string {
  return `Color(0xFF${hex.slice(1).toUpperCase()})`
}

function themeOf(name: string, theme: Theme): string {
  const fields = tokens.map(
    (token) => `    ${camelCaseOf(token)} = ${colorOf(palette[token][theme])},`,
  )
  return [`internal val ${name}: MyGameColors = MyGameColors(`, ...fields, ')'].join('\n')
}

export function kotlinColorsOf(): DesignSystemFile {
  const fields = tokens.map((token) => `    val ${camelCaseOf(token)}: Color,`)
  return {
    fileName: 'MyGameColors.kt',
    contents: `${kotlinPackage}

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color

@Immutable
data class MyGameColors(
${fields.join('\n')}
)

${themeOf('lightColors', 'light')}

${themeOf('darkColors', 'dark')}
`,
  }
}
