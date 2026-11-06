import { type TypeStyle, type TypeStyleValues, typeScale } from '../tokens'
import type { DesignSystemFile } from './DesignSystemFile'
import { fontWeightNameOf } from './fontWeightNameOf'
import { kotlinPackage } from './kotlinPackage'
import { numberBefore } from './numberBefore'

const styles = Object.keys(typeScale) as ReadonlyArray<TypeStyle>

const stylesAtSubpixelPositions: ReadonlySet<TypeStyle> = new Set<TypeStyle>(['reading'])

function emOf(value: string): string {
  const ems = numberBefore('em', value)
  return ems < 0 ? `(${ems}).em` : `${ems}.em`
}

function copiedArgumentsOf(name: TypeStyle, style: TypeStyleValues): ReadonlyArray<string> {
  return [
    ...(style.letterSpacing === undefined ? [] : [`letterSpacing = ${emOf(style.letterSpacing)}`]),
    ...(style.fontVariantNumeric === undefined ? [] : ['fontFeatureSettings = "tnum"']),
    ...(stylesAtSubpixelPositions.has(name) ? ['textMotion = TextMotion.Animated'] : []),
  ]
}

function styleOf(name: TypeStyle): string {
  const style = typeScale[name]
  const size = numberBefore('px', style.fontSize)
  const weight = fontWeightNameOf(style.fontWeight)
  const declaration = `    val ${name}: TextStyle = style(size = ${size}.sp, lineHeight = ${style.lineHeight}.em, weight = ${weight})`
  const copied = copiedArgumentsOf(name, style)
  return copied.length === 0 ? declaration : `${declaration}\n        .copy(${copied.join(', ')})`
}

export function kotlinTypographyOf(): DesignSystemFile {
  return {
    fileName: 'MyGameTypography.kt',
    contents: `${kotlinPackage}

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextMotion
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

object MyGameTypography {
${styles.map(styleOf).join('\n')}
}

private fun style(size: TextUnit, lineHeight: TextUnit, weight: FontWeight): TextStyle = TextStyle(
    fontFamily = MyGameTypeFamilies.sans,
    fontSize = size,
    lineHeight = lineHeight,
    fontWeight = weight,
)
`,
  }
}
