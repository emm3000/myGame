package com.emm.mygame.core.designsystem

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextMotion
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

object MyGameTypography {
    val word: TextStyle = style(size = 44.sp, lineHeight = 1.05.em, weight = FontWeight.ExtraBold)
        .copy(letterSpacing = (-0.02).em)
    val display: TextStyle = style(size = 40.sp, lineHeight = 1.05.em, weight = FontWeight.ExtraBold)
        .copy(letterSpacing = (-0.02).em)
    val numeral: TextStyle = style(size = 26.sp, lineHeight = 1.15.em, weight = FontWeight.Bold)
        .copy(letterSpacing = (-0.02).em, fontFeatureSettings = "tnum")
    val reading: TextStyle = style(size = 20.sp, lineHeight = 1.5.em, weight = FontWeight.Normal)
        .copy(textMotion = TextMotion.Animated)
    val heading: TextStyle = style(size = 20.sp, lineHeight = 1.35.em, weight = FontWeight.SemiBold)
    val button: TextStyle = style(size = 18.sp, lineHeight = 1.33.em, weight = FontWeight.Bold)
    val title: TextStyle = style(size = 17.sp, lineHeight = 1.35.em, weight = FontWeight.SemiBold)
    val gloss: TextStyle = style(size = 17.sp, lineHeight = 1.5.em, weight = FontWeight.Normal)
    val body: TextStyle = style(size = 16.sp, lineHeight = 1.5.em, weight = FontWeight.Normal)
    val label: TextStyle = style(size = 15.sp, lineHeight = 1.4.em, weight = FontWeight.SemiBold)
    val caption: TextStyle = style(size = 15.sp, lineHeight = 1.5.em, weight = FontWeight.Normal)
    val meta: TextStyle = style(size = 14.sp, lineHeight = 1.3.em, weight = FontWeight.Medium)
        .copy(letterSpacing = 0.12.em)
}

private fun style(size: TextUnit, lineHeight: TextUnit, weight: FontWeight): TextStyle = TextStyle(
    fontFamily = MyGameTypeFamilies.sans,
    fontSize = size,
    lineHeight = lineHeight,
    fontWeight = weight,
)
