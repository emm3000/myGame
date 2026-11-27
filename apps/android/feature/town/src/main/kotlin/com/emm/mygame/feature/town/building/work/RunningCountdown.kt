package com.emm.mygame.feature.town.building.work

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.control.MyGameWorkingDots
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.text.withTabularFigures
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography

@Composable
internal fun RunningCountdown(label: MyGameLabel, modifier: Modifier = Modifier) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier,
    ) {
        MyGameWorkingDots(tint = MyGameTheme.colors.inkMuted)
        MyGameText(
            label = label,
            style = MyGameTypography.title.withTabularFigures(),
            color = MyGameTheme.colors.ink,
        )
    }
}
