package com.emm.mygame.core.designsystem

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role

private const val FULL_TURN_DEGREES: Float = 360f

private const val TOP_DEGREES: Float = -90f

private const val GAP_BETWEEN_WORDS: Float = 0.15f

internal data class RingMark(val startDegrees: Float, val sweepDegrees: Float, val isRetained: Boolean)

internal fun ringMarksOf(count: Int, total: Int): List<RingMark> {
    val wordDegrees: Float = FULL_TURN_DEGREES / total
    return List(total) { position: Int ->
        RingMark(
            startDegrees = TOP_DEGREES + position * wordDegrees,
            sweepDegrees = wordDegrees * (1 - GAP_BETWEEN_WORDS),
            isRetained = position < count,
        )
    }
}

@Composable
fun MyGameRing(count: Int, total: Int, accessibleName: String, modifier: Modifier = Modifier) {
    val retained: Color = MyGameTheme.colors.ink
    val track: Color = MyGameTheme.colors.lineStrong
    Canvas(
        modifier = modifier.size(MyGameSpacing.step8).clearAndSetSemantics {
            contentDescription = accessibleName
            role = Role.Image
        },
    ) {
        val strokeWidth: Float = MyGameStrokeWidths.ring.toPx()
        ringMarksOf(count = count, total = total).forEach { mark: RingMark ->
            drawArc(
                color = if (mark.isRetained) retained else track,
                startAngle = mark.startDegrees,
                sweepAngle = mark.sweepDegrees,
                useCenter = false,
                topLeft = Offset(strokeWidth / 2, strokeWidth / 2),
                size = Size(size.width - strokeWidth, size.height - strokeWidth),
                style = Stroke(width = strokeWidth),
            )
        }
    }
}
