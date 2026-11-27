package com.emm.mygame.core.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.art.MyGameIcon
import com.emm.mygame.core.designsystem.art.MyGameIcons
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.designsystem.theme.PreviewMyGame

val SEASON_MARK_ICON: SemanticsPropertyKey<ImageVector> = SemanticsPropertyKey("SEASON_MARK_ICON")

private var SemanticsPropertyReceiver.seasonMarkIcon: ImageVector by SEASON_MARK_ICON

@Composable
fun SeasonMark(icon: ImageVector, label: MyGameLabel, modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier.semantics { seasonMarkIcon = icon },
    ) {
        MyGameIcon(icon = icon, tint = MyGameTheme.colors.inkMuted)
        MyGameText(label = label, style = MyGameTypography.caption, color = MyGameTheme.colors.inkMuted)
    }
}

@PreviewMyGame
@Composable
private fun SeasonMarkPreview() {
    MyGamePreviewSurface {
        SeasonMark(
            icon = MyGameIcons.summer,
            label = MyGameLabel(
                text = "Summer: 75 % of the hours for building work",
                translation = "Verano: las obras tardan el 75 % del tiempo",
            ),
        )
    }
}
