package com.emm.mygame.core.designsystem.control

import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.theme.MyGameStrokeWidths

internal fun Modifier.focusRingAround(
    isFocused: Boolean,
    color: Color,
    horizontalReach: Dp,
    verticalReach: Dp,
    radius: Dp,
): Modifier {
    if (!isFocused) return this
    return drawWithContent {
        drawContent()
        val x: Float = horizontalReach.toPx()
        val y: Float = verticalReach.toPx()
        drawRoundRect(
            color = color,
            topLeft = Offset(x = -x, y = -y),
            size = Size(width = size.width + x * 2, height = size.height + y * 2),
            cornerRadius = CornerRadius(radius.toPx()),
            style = Stroke(width = MyGameStrokeWidths.focus.toPx()),
        )
    }
}
