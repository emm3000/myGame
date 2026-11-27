package com.emm.mygame.feature.town.building.work

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.feature.town.FiguredCaption
import com.emm.mygame.feature.town.R

@Composable
internal fun WorkLevel(level: Int, modifier: Modifier = Modifier) {
    FiguredCaption(
        label = chromeResource(R.string.town_level, "level" to level.toString()),
        color = MyGameTheme.colors.inkMuted,
        modifier = modifier,
    )
}
