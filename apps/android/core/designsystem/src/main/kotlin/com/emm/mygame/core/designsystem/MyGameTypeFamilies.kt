package com.emm.mygame.core.designsystem

import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight

object MyGameTypeFamilies {
    val sans: FontFamily = FontFamily(
        listOf(FontWeight.Normal, FontWeight.Medium, FontWeight.SemiBold, FontWeight.Bold, FontWeight.ExtraBold)
            .map(::sansOf),
    )
}

private fun sansOf(weight: FontWeight): Font = Font(
    resId = R.font.designsystem_schibsted_grotesk,
    weight = weight,
    variationSettings = FontVariation.Settings(FontVariation.weight(weight.weight)),
)
