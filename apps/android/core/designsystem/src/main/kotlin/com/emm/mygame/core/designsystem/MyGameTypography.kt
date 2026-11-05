package com.emm.mygame.core.designsystem

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

object MyGameTypography {
    val display: TextStyle = style(size = 40.sp, lineHeight = 1.2.em, weight = FontWeight.ExtraBold)
        .copy(letterSpacing = (-0.01).em)
    val title: TextStyle = style(size = 28.sp, lineHeight = 1.3.em, weight = FontWeight.Bold)
    val heading: TextStyle = style(size = 22.sp, lineHeight = 1.4.em, weight = FontWeight.Bold)
    val word: TextStyle = style(size = 36.sp, lineHeight = 1.25.em, weight = FontWeight.Bold)
    val reading: TextStyle = style(size = 20.sp, lineHeight = 1.5.em, weight = FontWeight.Normal)
    val body: TextStyle = style(size = 18.sp, lineHeight = 1.5.em, weight = FontWeight.Normal)
    val gloss: TextStyle = style(size = 17.sp, lineHeight = 1.5.em, weight = FontWeight.Normal)
    val button: TextStyle = style(size = 18.sp, lineHeight = 1.33.em, weight = FontWeight.Bold)
    val label: TextStyle = style(size = 16.sp, lineHeight = 1.5.em, weight = FontWeight.Bold)
    val caption: TextStyle = style(size = 16.sp, lineHeight = 1.5.em, weight = FontWeight.Normal)
    val numeral: TextStyle = style(size = 18.sp, lineHeight = 1.33.em, weight = FontWeight.Bold)
        .copy(fontFeatureSettings = "tnum")
}

private fun style(size: TextUnit, lineHeight: TextUnit, weight: FontWeight): TextStyle = TextStyle(
    fontFamily = MyGameTypeFamilies.sans,
    fontSize = size,
    lineHeight = lineHeight,
    fontWeight = weight,
)
