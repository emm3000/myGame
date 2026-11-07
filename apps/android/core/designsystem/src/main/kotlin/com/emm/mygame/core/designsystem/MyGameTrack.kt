package com.emm.mygame.core.designsystem

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag

internal const val TRACK_FILL: String = "track_fill"

@Composable
fun MyGameTrack(filled: Float, color: Color, modifier: Modifier = Modifier) {
    val shape: RoundedCornerShape = RoundedCornerShape(MyGameRadii.sm)
    val drawn: State<Float> = animateFloatAsState(
        targetValue = filled.coerceIn(0f, 1f),
        animationSpec = tween(
            durationMillis = MyGameTransitions.track.durationMillis,
            easing = MyGameTransitions.track.easing,
        ),
        label = "track",
    )
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(MyGameSizes.track)
            .background(MyGameTheme.colors.surfaceSunken, shape),
    ) {
        Box(
            modifier = Modifier
                .testTag(TRACK_FILL)
                .fillMaxWidth(drawn.value)
                .height(MyGameSizes.track)
                .background(color, shape),
        )
    }
}
