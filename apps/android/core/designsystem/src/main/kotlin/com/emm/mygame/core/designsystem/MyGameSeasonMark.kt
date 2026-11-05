package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector

@Composable
fun MyGameSeasonMark(icon: ImageVector, words: String, modifier: Modifier = Modifier) {
    val colors: MyGameColors = MyGameTheme.colors
    Row(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .background(colors.surfaceSunken, RoundedCornerShape(MyGameRadii.sm))
            .padding(horizontal = MyGameSpacing.step2),
    ) {
        MyGameIcon(icon = icon, tint = colors.inkMuted)
        MyGameText(
            text = words,
            style = MyGameTypography.label,
            color = colors.ink,
        )
    }
}
