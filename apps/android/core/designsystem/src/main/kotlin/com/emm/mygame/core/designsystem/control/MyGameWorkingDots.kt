package com.emm.mygame.core.designsystem.control

import androidx.compose.animation.core.EaseInOut
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
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.MyGameSizes
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTransitions
import com.emm.mygame.core.designsystem.theme.PreviewMyGame
import kotlin.math.abs

const val WORKING_DOTS: String = "WORKING_DOTS"

val WORKING_DOT_ALPHAS: SemanticsPropertyKey<List<Float>> = SemanticsPropertyKey("WORKING_DOT_ALPHAS")

private var SemanticsPropertyReceiver.workingDotAlphas: List<Float> by WORKING_DOT_ALPHAS

val WORKING_DOT_OFFSETS: SemanticsPropertyKey<List<Dp>> = SemanticsPropertyKey("WORKING_DOT_OFFSETS")

private var SemanticsPropertyReceiver.workingDotOffsets: List<Dp> by WORKING_DOT_OFFSETS

val WORKING_DOT_SCALES: SemanticsPropertyKey<List<Float>> = SemanticsPropertyKey("WORKING_DOT_SCALES")

private var SemanticsPropertyReceiver.workingDotScales: List<Float> by WORKING_DOT_SCALES

val WORKING_DOT_TINT: SemanticsPropertyKey<Color> = SemanticsPropertyKey("WORKING_DOT_TINT")

private var SemanticsPropertyReceiver.workingDotTint: Color by WORKING_DOT_TINT

internal const val WORKING_DOT_STAGGER_MILLIS: Int = 160

internal const val WORKING_DOT_PEAK_MILLIS: Int = MyGameTransitions.CALM_MILLIS

private const val DOT_COUNT: Int = 3

private const val SWELL_MILLIS: Int = WORKING_DOT_PEAK_MILLIS * 2

private const val WAVE_MILLIS: Int = WORKING_DOT_STAGGER_MILLIS * DOT_COUNT + SWELL_MILLIS

private const val VIEWPORT: Float = 24f

private const val DOT_RADIUS: Float = 2.5f

private val dotCentersX: List<Float> = listOf(5f, 12f, 19f)

private const val DOT_CENTER_Y: Float = 12f

private const val RESTING_ALPHA: Float = 0.3f

private const val PEAK_ALPHA: Float = 1f

private const val RESTING_SCALE: Float = 1f

private const val PEAK_SCALE: Float = 1.25f

private val peakRise: Dp = 3.dp

private class DotPoses(val offsets: List<Dp>, val scales: List<Float>, val alphas: List<Float>)

private val stillPoses: DotPoses = DotPoses(
    offsets = List(DOT_COUNT) { 0.dp },
    scales = List(DOT_COUNT) { RESTING_SCALE },
    alphas = List(DOT_COUNT) { PEAK_ALPHA },
)

@Composable
fun MyGameWorkingDots(tint: Color, modifier: Modifier = Modifier) {
    val poses: DotPoses = rememberDotPoses()
    Canvas(
        modifier = modifier
            .size(MyGameSizes.icon)
            .clearAndSetSemantics {
                testTag = WORKING_DOTS
                workingDotOffsets = poses.offsets
                workingDotScales = poses.scales
                workingDotAlphas = poses.alphas
                workingDotTint = tint
            },
    ) {
        val unit: Float = size.width / VIEWPORT
        dotCentersX.forEachIndexed { index: Int, x: Float ->
            drawCircle(
                color = tint,
                radius = DOT_RADIUS * unit * poses.scales[index],
                center = Offset(x * unit, DOT_CENTER_Y * unit + poses.offsets[index].toPx()),
                alpha = poses.alphas[index],
            )
        }
    }
}

@Composable
private fun rememberDotPoses(): DotPoses {
    val isStill: Boolean = rememberCoroutineScope().coroutineContext[MotionDurationScale]?.scaleFactor == 0f
    if (isStill) return stillPoses
    val waveMillis: Float by rememberInfiniteTransition(label = "working dots").animateFloat(
        initialValue = 0f,
        targetValue = WAVE_MILLIS.toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = WAVE_MILLIS, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "wave",
    )
    val swells: List<Float> = List(DOT_COUNT) { dot: Int -> swellOf(waveMillis = waveMillis, dot = dot) }
    return DotPoses(
        offsets = swells.map { swell: Float -> -peakRise * swell },
        scales = swells.map { swell: Float -> RESTING_SCALE + (PEAK_SCALE - RESTING_SCALE) * swell },
        alphas = swells.map { swell: Float -> RESTING_ALPHA + (PEAK_ALPHA - RESTING_ALPHA) * swell },
    )
}

private fun swellOf(waveMillis: Float, dot: Int): Float {
    val sinceStart: Float = waveMillis - dot * WORKING_DOT_STAGGER_MILLIS
    if (sinceStart < 0f || sinceStart > SWELL_MILLIS) return 0f
    val towardPeak: Float = 1f - abs(sinceStart - WORKING_DOT_PEAK_MILLIS) / WORKING_DOT_PEAK_MILLIS
    return EaseInOut.transform(towardPeak)
}

@PreviewMyGame
@Composable
private fun MyGameWorkingDotsPreview() {
    MyGamePreviewSurface {
        MyGameWorkingDots(tint = MyGameTheme.colors.ink)
    }
}
