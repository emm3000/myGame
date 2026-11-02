package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics

@Composable
fun MyGameErrorBanner(message: String, actionLabel: String, onAction: () -> Unit, modifier: Modifier = Modifier) {
    val colors: MyGameColors = MyGameTheme.colors
    Row(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        verticalAlignment = Alignment.Top,
        modifier = modifier
            .fillMaxWidth()
            .background(colors.rustSoft, RoundedCornerShape(MyGameRadii.md))
            .padding(horizontal = MyGameSpacing.step4, vertical = MyGameSpacing.step3),
    ) {
        MyGameIcon(icon = MyGameIcons.alert, tint = colors.rust)
        Column {
            MyGameText(
                text = message,
                style = MyGameTypography.body,
                color = colors.ink,
                modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
            )
            MyGameTextLink(label = actionLabel, onClick = onAction)
        }
    }
}
