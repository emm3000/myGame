package com.emm.mygame.core.designsystem

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.role
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider

private const val FULL_TURN_DEGREES: Float = 360f

private const val TOP_DEGREES: Float = -90f

private const val GAP_BETWEEN_WORDS: Float = 0.15f

internal data class RingMark(
    val startDegrees: Float,
    val sweepDegrees: Float,
    val isRetained: Boolean,
    val isNewlyRetained: Boolean,
)

internal fun ringMarksOf(count: Int, total: Int, countBefore: Int): List<RingMark> {
    val wordDegrees: Float = FULL_TURN_DEGREES / total
    return List(total) { position: Int ->
        RingMark(
            startDegrees = TOP_DEGREES + position * wordDegrees,
            sweepDegrees = wordDegrees * (1 - GAP_BETWEEN_WORDS),
            isRetained = position < count,
            isNewlyRetained = position in countBefore..<count,
        )
    }
}

@Composable
fun MyGameRing(count: Int, total: Int, countBefore: Int, accessibleName: String, modifier: Modifier = Modifier) {
    val isRising: Boolean = countBefore < count
    val fraction: Float =
        if (isRising) rememberRegisteredFraction(MyGameRegisteredRow.Ring, countBefore to count) else 1f
    val retained: Color = MyGameTheme.colors.ink
    val track: Color = MyGameTheme.colors.lineStrong
    Canvas(
        modifier = modifier.size(MyGameSpacing.step8).clearAndSetSemantics {
            contentDescription = accessibleName
            role = Role.Image
            if (isRising) {
                liveRegion = LiveRegionMode.Polite
                registering = MyGameRegistering(MyGameRegisteredRow.Ring, fraction)
            }
        },
    ) {
        val strokeWidth: Float = MyGameStrokeWidths.ring.toPx()
        ringMarksOf(count = count, total = total, countBefore = countBefore).forEach { mark: RingMark ->
            drawArc(
                color = when {
                    mark.isNewlyRetained -> lerp(track, retained, fraction)
                    mark.isRetained -> retained
                    else -> track
                },
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

private data class RingState(val count: Int, val total: Int, val countBefore: Int)

private class RingStates : PreviewParameterProvider<RingState> {

    override val values: Sequence<RingState> = sequenceOf(
        RingState(count = 0, total = 5, countBefore = 0),
        RingState(count = 3, total = 5, countBefore = 3),
        RingState(count = 3, total = 5, countBefore = 2),
        RingState(count = 5, total = 5, countBefore = 5),
    )
}

@PreviewMyGame
@Composable
private fun MyGameRingPreview(@PreviewParameter(RingStates::class) state: RingState) {
    MyGamePreviewSurface {
        MyGameRing(
            count = state.count,
            total = state.total,
            countBefore = state.countBefore,
            accessibleName = "${state.count} of ${state.total} words kept",
        )
    }
}
