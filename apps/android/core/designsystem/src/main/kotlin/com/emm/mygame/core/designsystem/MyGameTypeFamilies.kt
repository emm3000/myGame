package com.emm.mygame.core.designsystem

import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight

object MyGameTypeFamilies {
    val sans: FontFamily = FontFamily(
        listOf(FontWeight.Normal, FontWeight.Bold, FontWeight.ExtraBold).flatMap { weight: FontWeight ->
            listOf(
                atkinson(R.font.designsystem_atkinson_hyperlegible_next, weight, FontStyle.Normal),
                atkinson(R.font.designsystem_atkinson_hyperlegible_next_italic, weight, FontStyle.Italic),
            )
        },
    )
}

private fun atkinson(resource: Int, weight: FontWeight, style: FontStyle): Font = Font(
    resId = resource,
    weight = weight,
    style = style,
    variationSettings = FontVariation.Settings(FontVariation.weight(weight.weight)),
)
