package com.emm.mygame.core.designsystem

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp

internal data class MyGamePillLook(
    val tag: String,
    val height: Dp,
    val sidePadding: Dp,
    val style: TextStyle,
    val ground: Color,
    val ink: Color,
    val edge: Color,
)
