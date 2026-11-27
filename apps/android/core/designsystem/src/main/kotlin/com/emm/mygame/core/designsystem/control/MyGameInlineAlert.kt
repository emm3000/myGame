package com.emm.mygame.core.designsystem.control

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.art.MyGameIcon
import com.emm.mygame.core.designsystem.art.MyGameIcons
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameColors
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.designsystem.theme.PreviewMyGame

@Composable
fun MyGameInlineAlert(message: String, modifier: Modifier = Modifier) {
    val colors: MyGameColors = MyGameTheme.colors
    Row(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        verticalAlignment = Alignment.Top,
        modifier = modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
    ) {
        MyGameIcon(icon = MyGameIcons.alert, tint = colors.destructiveInk)
        MyGameText(text = message, style = MyGameTypography.body, color = colors.destructiveInk)
    }
}

@PreviewMyGame
@Composable
private fun MyGameInlineAlertPreview() {
    MyGamePreviewSurface {
        MyGameInlineAlert(message = "We could not reach your town. Try again.")
    }
}
