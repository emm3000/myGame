package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier

@Composable
fun MyGameBackLink(label: String, isEnabled: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val colors: MyGameColors = MyGameTheme.colors
    MyGameTextTarget(isEnabled = isEnabled, onClick = onClick, modifier = modifier) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            MyGameIcon(icon = MyGameIcons.back, tint = colors.inkMuted)
            MyGameMetaText(text = label, color = colors.inkMuted)
        }
    }
}
