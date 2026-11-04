package com.emm.mygame.core.designsystem

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

object MyGameTypography {
    val brand: TextStyle = TextStyle(
        fontFamily = MyGameTypeFamilies.display,
        fontSize = 24.sp,
        lineHeight = 28.sp,
        fontWeight = FontWeight.SemiBold,
    )
    val title: TextStyle = TextStyle(
        fontFamily = MyGameTypeFamilies.display,
        fontSize = 36.sp,
        lineHeight = 40.sp,
        fontWeight = FontWeight.Medium,
    )
    val numeral: TextStyle = TextStyle(
        fontFamily = MyGameTypeFamilies.utility,
        fontSize = 16.sp,
        lineHeight = 20.sp,
        fontWeight = FontWeight.SemiBold,
        fontFeatureSettings = "tnum",
    )
    val label: TextStyle = TextStyle(
        fontFamily = MyGameTypeFamilies.utility,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 0.06.em,
    )
    val caption: TextStyle = TextStyle(
        fontFamily = MyGameTypeFamilies.utility,
        fontSize = 13.sp,
        lineHeight = 18.sp,
        fontWeight = FontWeight.Normal,
    )
    val body: TextStyle = TextStyle(
        fontFamily = MyGameTypeFamilies.utility,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        fontWeight = FontWeight.Normal,
    )
    val action: TextStyle = TextStyle(
        fontFamily = MyGameTypeFamilies.utility,
        fontSize = 16.sp,
        lineHeight = 20.sp,
        fontWeight = FontWeight.SemiBold,
    )
}
