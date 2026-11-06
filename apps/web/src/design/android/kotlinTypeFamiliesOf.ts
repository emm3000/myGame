import { typeScale } from '../tokens'
import type { DesignSystemFile } from './DesignSystemFile'
import { fontWeightNameOf } from './fontWeightNameOf'
import { kotlinPackage } from './kotlinPackage'

function weightsInUse(): ReadonlyArray<number> {
  const weights = Object.values(typeScale).map((style) => style.fontWeight)
  return [...new Set(weights)].sort((lighter, heavier) => lighter - heavier)
}

export function kotlinTypeFamiliesOf(): DesignSystemFile {
  return {
    fileName: 'MyGameTypeFamilies.kt',
    contents: `${kotlinPackage}

import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight

object MyGameTypeFamilies {
    val sans: FontFamily = FontFamily(
        listOf(${weightsInUse().map(fontWeightNameOf).join(', ')})
            .map(::sansOf),
    )
}

private fun sansOf(weight: FontWeight): Font = Font(
    resId = R.font.designsystem_schibsted_grotesk,
    weight = weight,
    variationSettings = FontVariation.Settings(FontVariation.weight(weight.weight)),
)
`,
  }
}
