package com.emm.mygame.core.designsystem

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Modifier
import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first

const val SKELETON_BLOCK: String = "SKELETON_BLOCK"

val SKELETON_PULSE: SemanticsPropertyKey<Float> = SemanticsPropertyKey("SKELETON_PULSE")

private var SemanticsPropertyReceiver.skeletonPulse: Float by SKELETON_PULSE

@Composable
fun MyGameSkeleton(
    isLoading: Boolean,
    loadingLabel: String,
    blocks: MyGameSkeletonBlocks,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    var isRevealed: Boolean by remember { mutableStateOf(false) }
    var isHeld: Boolean by remember { mutableStateOf(false) }
    LaunchedEffect(isLoading) {
        if (isLoading) {
            delay(MyGameTransitions.REVEAL_MILLIS.toLong())
            isRevealed = true
            isHeld = true
        } else {
            snapshotFlow { isHeld }.first { held: Boolean -> !held }
            isRevealed = false
        }
    }
    LaunchedEffect(isHeld) {
        if (!isHeld) return@LaunchedEffect
        delay(MyGameTransitions.HOLD_MILLIS.toLong())
        isHeld = false
    }
    when {
        isRevealed && (isLoading || isHeld) -> SkeletonBlocks(
            loadingLabel = loadingLabel,
            blocks = blocks,
            modifier = modifier,
        )
        isLoading -> Unit
        else -> content()
    }
}

@Composable
private fun SkeletonBlocks(loadingLabel: String, blocks: MyGameSkeletonBlocks, modifier: Modifier = Modifier) {
    val pulse: Float = rememberPulse()
    val colors: MyGameColors = MyGameTheme.colors
    val ground: Color = lerp(colors.surfaceSunken, colors.surface, pulse)
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6),
        modifier = modifier
            .fillMaxWidth()
            .semantics {
                contentDescription = loadingLabel
                liveRegion = LiveRegionMode.Polite
                skeletonPulse = pulse
            },
    ) {
        blocks.heights.forEach { height: Dp ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(height)
                    .testTag(SKELETON_BLOCK)
                    .background(ground, RoundedCornerShape(MyGameRadii.lg)),
            )
        }
    }
}

private const val PULSE_PEAK_TOWARD_SURFACE: Float = 0.5f

@Composable
private fun rememberPulse(): Float {
    val isStill: Boolean = rememberCoroutineScope().coroutineContext[MotionDurationScale]?.scaleFactor == 0f
    if (isStill) return 0f
    val pulse: Float by rememberInfiniteTransition(label = "skeleton").animateFloat(
        initialValue = 0f,
        targetValue = PULSE_PEAK_TOWARD_SURFACE,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = MyGameTransitions.CALM_MILLIS, easing = MyGameTransitions.standard),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "pulse",
    )
    return pulse
}

private val previewBlocks: MyGameSkeletonBlocks =
    MyGameSkeletonBlocks(heights = listOf(MyGameSizes.thumbnail, MyGameSizes.control))

@PreviewMyGame
@Composable
private fun MyGameSkeletonPreview() {
    MyGamePreviewSurface {
        SkeletonBlocks(loadingLabel = "Loading your town", blocks = previewBlocks)
        MyGameSkeleton(isLoading = false, loadingLabel = "Loading your town", blocks = previewBlocks) {
            MyGameText(text = "Maple Hollow", style = MyGameTypography.title, color = MyGameTheme.colors.ink)
        }
    }
}
