package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag

const val HAIRLINE: String = "hairline"

@Composable
fun MyGameHairline(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .testTag(HAIRLINE)
            .fillMaxWidth()
            .height(MyGameStrokeWidths.hairline)
            .background(MyGameTheme.colors.line),
    )
}

@PreviewMyGame
@Composable
private fun MyGameHairlinePreview() {
    MyGamePreviewSurface {
        MyGameText(text = "The farm reached level 2.", style = MyGameTypography.body, color = MyGameTheme.colors.ink)
        MyGameHairline()
        MyGameText(text = "Three new words to review.", style = MyGameTypography.body, color = MyGameTheme.colors.ink)
    }
}
