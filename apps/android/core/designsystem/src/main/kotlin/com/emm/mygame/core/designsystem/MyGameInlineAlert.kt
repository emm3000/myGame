package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics

@Composable
fun MyGameInlineAlert(message: String, modifier: Modifier = Modifier) {
    val colors: MyGameColors = MyGameTheme.colors
    Row(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        verticalAlignment = Alignment.Top,
        modifier = modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
    ) {
        MyGameIcon(icon = MyGameIcons.alert, tint = colors.miss)
        MyGameText(text = message, style = MyGameTypography.body, color = colors.miss)
    }
}
