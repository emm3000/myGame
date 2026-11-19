package com.emm.mygame.core.designsystem

import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp

internal fun Modifier.outerFocusRing(color: Color, corner: Dp): Modifier = drawBehind {
    val ring: Float = MyGameStrokeWidths.focus.toPx()
    val reach: Float = MyGameSpacing.step1.toPx() + ring / 2
    val radius: Float = corner.toPx() + reach
    drawRoundRect(
        color = color,
        topLeft = Offset(-reach, -reach),
        size = Size(size.width + reach * 2, size.height + reach * 2),
        cornerRadius = CornerRadius(radius, radius),
        style = Stroke(width = ring),
    )
}
