package com.emm.mygame.core.designsystem

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.testTag
import kotlin.math.abs

const val WORKING_DOTS: String = "WORKING_DOTS"

val WORKING_DOT_ALPHAS: SemanticsPropertyKey<List<Float>> = SemanticsPropertyKey("WORKING_DOT_ALPHAS")

private var SemanticsPropertyReceiver.workingDotAlphas: List<Float> by WORKING_DOT_ALPHAS

private const val DOT_COUNT: Int = 3

private const val VIEWPORT: Float = 24f

private const val DOT_RADIUS: Float = 2.5f

private val dotCentersX: List<Float> = listOf(5f, 12f, 19f)

private const val DOT_CENTER_Y: Float = 12f

private const val RESTING_ALPHA: Float = 0.3f

private const val LIT_CENTER: Float = 0.5f

private const val STILL_ALPHA: Float = 1f

private const val PULSE_MILLIS: Int = MyGameTransitions.CALM_MILLIS * DOT_COUNT

@Composable
fun MyGameWorkingDots(tint: Color, modifier: Modifier = Modifier) {
    val alphas: List<Float> = rememberDotAlphas()
    Canvas(
        modifier = modifier
            .size(MyGameSizes.icon)
            .clearAndSetSemantics {
                testTag = WORKING_DOTS
                workingDotAlphas = alphas
            },
    ) {
        val scale: Float = size.width / VIEWPORT
        dotCentersX.forEachIndexed { index: Int, x: Float ->
            drawCircle(
                color = tint,
                radius = DOT_RADIUS * scale,
                center = Offset(x * scale, DOT_CENTER_Y * scale),
                alpha = alphas[index],
            )
        }
    }
}

@Composable
private fun rememberDotAlphas(): List<Float> {
    val isStill: Boolean = rememberCoroutineScope().coroutineContext[MotionDurationScale]?.scaleFactor == 0f
    if (isStill) return List(DOT_COUNT) { STILL_ALPHA }
    val phase: Float by rememberInfiniteTransition(label = "working dots").animateFloat(
        initialValue = 0f,
        targetValue = DOT_COUNT.toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = PULSE_MILLIS, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "phase",
    )
    return List(DOT_COUNT) { index: Int -> alphaOf(phase = phase, dot = index) }
}

private fun alphaOf(phase: Float, dot: Int): Float {
    val distance: Float = wrapped(phase - dot - LIT_CENTER)
    val lit: Float = (1f - abs(distance)).coerceAtLeast(0f)
    return RESTING_ALPHA + (1f - RESTING_ALPHA) * lit
}

private fun wrapped(distance: Float): Float {
    val half: Float = DOT_COUNT / 2f
    return ((distance + half) % DOT_COUNT + DOT_COUNT) % DOT_COUNT - half
}

@PreviewMyGame
@Composable
private fun MyGameWorkingDotsPreview() {
    MyGamePreviewSurface {
        MyGameWorkingDots(tint = MyGameTheme.colors.ink)
    }
}
