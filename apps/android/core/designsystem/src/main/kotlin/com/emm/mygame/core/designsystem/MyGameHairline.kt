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
