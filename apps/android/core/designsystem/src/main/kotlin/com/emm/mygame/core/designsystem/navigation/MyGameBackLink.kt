package com.emm.mygame.core.designsystem.navigation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import com.emm.mygame.core.designsystem.art.MyGameIcon
import com.emm.mygame.core.designsystem.art.MyGameIcons
import com.emm.mygame.core.designsystem.control.MyGameTextTarget
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameColors
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.designsystem.theme.PreviewMyGame

const val BACK_LINK_CHEVRON: String = "back_link_chevron"

@Composable
fun MyGameBackLink(label: String, isEnabled: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    MyGameBackLink(
        label = MyGameLabel(text = label, translation = null),
        isEnabled = isEnabled,
        onClick = onClick,
        modifier = modifier,
    )
}

@Composable
fun MyGameBackLink(label: MyGameLabel, isEnabled: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val colors: MyGameColors = MyGameTheme.colors
    val color: Color = if (isEnabled) colors.ink else colors.inkMuted
    MyGameTextTarget(isEnabled = isEnabled, onClick = onClick, modifier = modifier) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            MyGameIcon(icon = MyGameIcons.back, tint = color, modifier = Modifier.testTag(BACK_LINK_CHEVRON))
            MyGameText(label = label, style = MyGameTypography.label, color = color)
        }
    }
}

@PreviewMyGame
@Composable
private fun MyGameBackLinkPreview() {
    MyGamePreviewSurface {
        MyGameBackLink(label = "Town", isEnabled = true, onClick = {})
        MyGameBackLink(label = "Town", isEnabled = false, onClick = {})
    }
}
