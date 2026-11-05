package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color

@Composable
fun MyGameTrack(filled: Float, color: Color, modifier: Modifier = Modifier) {
    val shape: RoundedCornerShape = RoundedCornerShape(MyGameRadii.sm)
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(MyGameSizes.track)
            .background(MyGameTheme.colors.surfaceSunken, shape),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(filled.coerceIn(0f, 1f))
                .height(MyGameSizes.track)
                .background(color, shape),
        )
    }
}
