import { describe, expect, it } from 'vitest'
import { designSystemFilesOf } from './designSystemFilesOf'

function contentsOf(fileName: string): string {
  const file = designSystemFilesOf().find((candidate) => candidate.fileName === fileName)
  if (file === undefined) {
    throw new Error(`${fileName} is not generated`)
  }
  return file.contents
}

describe('MyGameColors', () => {
  it('declares one field per palette token, 20 in all', () => {
    expect(contentsOf('MyGameColors.kt').match(/^ {4}val \w+: Color,$/gm)).toHaveLength(20)
  })

  it('writes a token in camelCase with its light and its dark value', () => {
    const [light, dark] = contentsOf('MyGameColors.kt').split('internal val darkColors')

    expect(light).toContain('surfaceRaised = Color(0xFFFBFAF9),')
    expect(dark).toContain('surfaceRaised = Color(0xFF1E1D24),')
  })

  it('keeps a block at one value in both themes', () => {
    const [light, dark] = contentsOf('MyGameColors.kt').split('internal val darkColors')

    expect(light).toContain('blockPeach = Color(0xFFF5C9A8),')
    expect(dark).toContain('blockPeach = Color(0xFFF5C9A8),')
  })
})

describe('MyGameTypography', () => {
  it('sets a style in sp, em and its named weight', () => {
    expect(contentsOf('MyGameTypography.kt')).toContain(
      'val gloss: TextStyle = style(size = 17.sp, lineHeight = 1.5.em, weight = FontWeight.Normal)\n',
    )
  })

  it('places the glyphs of reading at subpixel positions, and of no other style', () => {
    const typography = contentsOf('MyGameTypography.kt')

    expect(typography).toContain(
      'val reading: TextStyle = style(size = 20.sp, lineHeight = 1.5.em, weight = FontWeight.Normal)\n' +
        '        .copy(textMotion = TextMotion.Animated)\n',
    )
    expect(typography.match(/textMotion =/g)).toHaveLength(1)
    expect(typography).toContain('import androidx.compose.ui.text.style.TextMotion\n')
  })

  it('keeps word at its size below md', () => {
    expect(contentsOf('MyGameTypography.kt')).toContain(
      'val word: TextStyle = style(size = 44.sp, lineHeight = 1.05.em, weight = FontWeight.ExtraBold)\n' +
        '        .copy(letterSpacing = (-0.02).em)\n',
    )
  })

  it('writes the size word grows to from md as a style of its own', () => {
    expect(contentsOf('MyGameTypography.kt')).toContain(
      'val wordFromMd: TextStyle = style(size = 52.sp, lineHeight = 1.05.em, weight = FontWeight.ExtraBold)\n' +
        '        .copy(letterSpacing = (-0.02).em)\n',
    )
  })

  it('writes a positive tracking without parentheses', () => {
    expect(contentsOf('MyGameTypography.kt')).toContain(
      'val meta: TextStyle = style(size = 14.sp, lineHeight = 1.3.em, weight = FontWeight.Medium)\n' +
        '        .copy(letterSpacing = 0.12.em)\n',
    )
  })

  it('sets tabular figures on numeral alone', () => {
    const typography = contentsOf('MyGameTypography.kt')

    expect(typography).toContain(
      'val numeral: TextStyle = style(size = 26.sp, lineHeight = 1.15.em, weight = FontWeight.Bold)\n' +
        '        .copy(letterSpacing = (-0.02).em, fontFeatureSettings = "tnum")\n',
    )
    expect(typography.match(/tnum/g)).toHaveLength(1)
  })
})

describe('MyGameTypeFamilies', () => {
  it('declares every weight of the type scale, lightest first', () => {
    expect(contentsOf('MyGameTypeFamilies.kt')).toContain(
      'listOf(FontWeight.Normal, FontWeight.Medium, FontWeight.SemiBold, FontWeight.Bold, FontWeight.ExtraBold)',
    )
  })

  it('reads the one roman file and no italic', () => {
    const families = contentsOf('MyGameTypeFamilies.kt')

    expect(families).toContain('R.font.designsystem_schibsted_grotesk')
    expect(families).not.toMatch(/italic/i)
  })
})

describe('the dimensions', () => {
  it('names a spacing step by its index', () => {
    const spacing = contentsOf('MyGameSpacing.kt')

    expect(spacing).toContain('val step0: Dp = 0.dp\n')
    expect(spacing).toContain('val step12: Dp = 48.dp\n')
  })

  it('writes the radii', () => {
    const radii = contentsOf('MyGameRadii.kt')

    expect(radii).toContain('val sm: Dp = 8.dp\n')
    expect(radii).toContain('val md: Dp = 16.dp\n')
    expect(radii).toContain('val lg: Dp = 28.dp\n')
    expect(radii).toContain('val pill: Dp = 999.dp\n')
  })

  it('gathers the sizes from every family the screens read', () => {
    const sizes = contentsOf('MyGameSizes.kt')

    expect(sizes).toContain('val control: Dp = 48.dp\n')
    expect(sizes).toContain('val action: Dp = 60.dp\n')
    expect(sizes).toContain('val secondary: Dp = 52.dp\n')
    expect(sizes).toContain('val iconSmall: Dp = 20.dp\n')
    expect(sizes).toContain('val placeCard: Dp = 160.dp\n')
    expect(sizes).toContain('val measureForm: Dp = 640.dp\n')
    expect(sizes).toContain('val track: Dp = 3.dp\n')
    expect(sizes).toContain('val dash: Dp = 4.dp\n')
  })

  it('reads the md step as a width in dp', () => {
    expect(contentsOf('MyGameSizes.kt')).toContain('val widthMd: Dp = 768.dp\n')
  })

  it('writes the icon stroke as a float on the viewport and the others in dp', () => {
    const strokeWidths = contentsOf('MyGameStrokeWidths.kt')

    expect(strokeWidths).toContain('const val ICON: Float = 2f\n')
    expect(strokeWidths).toContain('val hairline: Dp = 1.dp\n')
    expect(strokeWidths).toContain('val focus: Dp = 3.dp\n')
    expect(strokeWidths).not.toContain('val icon: Dp')
  })
})

describe('MyGameTransitions', () => {
  it('writes the durations in milliseconds', () => {
    const transitions = contentsOf('MyGameTransitions.kt')

    expect(transitions).toContain('const val INSTANT_MILLIS: Int = 0\n')
    expect(transitions).toContain('const val CALM_MILLIS: Int = 320\n')
  })

  it('writes the skeleton reveal delay and minimum hold in milliseconds', () => {
    const transitions = contentsOf('MyGameTransitions.kt')

    expect(transitions).toContain('const val REVEAL_MILLIS: Int = 400\n')
    expect(transitions).toContain('const val HOLD_MILLIS: Int = 250\n')
  })

  it('writes the easings as cubic beziers', () => {
    const transitions = contentsOf('MyGameTransitions.kt')

    expect(transitions).toContain('val standard: Easing = CubicBezierEasing(0.2f, 0f, 0f, 1f)\n')
    expect(transitions).toContain('val exit: Easing = CubicBezierEasing(0.3f, 0f, 1f, 1f)\n')
  })

  it('writes a transition from its duration and its easing', () => {
    expect(contentsOf('MyGameTransitions.kt')).toContain(
      'val track: MyGameTransition = MyGameTransition(durationMillis = CALM_MILLIS, easing = standard)\n',
    )
  })
})

it('carries no comment in any generated file', () => {
  for (const file of designSystemFilesOf()) {
    expect(file.contents).not.toMatch(/\/\/|\/\*/)
  }
})
