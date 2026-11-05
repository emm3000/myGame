package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

@Composable
fun MyGameCard(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    val colors: MyGameColors = MyGameTheme.colors
    val shape: RoundedCornerShape = RoundedCornerShape(MyGameRadii.lg)
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(colors.surfaceRaised, shape)
            .border(MyGameStrokeWidths.hairline, colors.line, shape)
            .padding(horizontal = MyGameSpacing.step4, vertical = MyGameSpacing.step1),
    ) {
        content()
    }
}
