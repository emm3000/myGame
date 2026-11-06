import {
  breakpoints,
  heights,
  maxWidths,
  minHeights,
  radii,
  type Size,
  sizes,
  spacing,
  strokeWidths,
} from '../tokens'
import { camelCaseOf } from './camelCaseOf'
import type { DesignSystemFile } from './DesignSystemFile'
import { kotlinPackage } from './kotlinPackage'
import { numberBefore } from './numberBefore'

const pixelsPerRem = 16

function dpLineOf(name: string, dp: number): string {
  return `    val ${name}: Dp = ${dp}.dp`
}

function dpLinesOf(values: Readonly<Record<string, string>>): ReadonlyArray<string> {
  return Object.entries(values).map(([name, value]) => dpLineOf(name, numberBefore('px', value)))
}

function dpObjectOf(name: string, lines: ReadonlyArray<string>): DesignSystemFile {
  return {
    fileName: `${name}.kt`,
    contents: `${kotlinPackage}

import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

object ${name} {
${lines.join('\n')}
}
`,
  }
}

function spacingOf(): DesignSystemFile {
  const steps = Object.entries(spacing).map(([step, value]) => [`step${step}`, value])
  return dpObjectOf('MyGameSpacing', dpLinesOf(Object.fromEntries(steps)))
}

function sizesOf(): DesignSystemFile {
  const named = (Object.keys(sizes) as ReadonlyArray<Size>).map((size) => [
    camelCaseOf(size),
    sizes[size],
  ])
  return dpObjectOf(
    'MyGameSizes',
    dpLinesOf({
      control: minHeights.control,
      action: minHeights.action,
      secondary: minHeights.secondary,
      ...Object.fromEntries(named),
      measureForm: maxWidths.form,
      track: heights.track,
      widthMd: `${numberBefore('rem', breakpoints.md) * pixelsPerRem}px`,
    }),
  )
}

function strokeWidthsOf(): DesignSystemFile {
  const { icon, ...inDp } = strokeWidths
  return dpObjectOf('MyGameStrokeWidths', [
    `    const val ICON: Float = ${icon}f`,
    ...Object.entries(inDp).map(([name, dp]) => dpLineOf(name, dp)),
  ])
}

export function kotlinDimensionsOf(): ReadonlyArray<DesignSystemFile> {
  return [spacingOf(), dpObjectOf('MyGameRadii', dpLinesOf(radii)), sizesOf(), strokeWidthsOf()]
}
