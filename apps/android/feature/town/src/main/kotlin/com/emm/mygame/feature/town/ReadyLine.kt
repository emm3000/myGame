package com.emm.mygame.feature.town

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun ReadyLine(ready: TownUiState.ReadyTime, modifier: Modifier = Modifier) {
    MyGameText(
        label = rememberPlayerCopy().chrome { readyLabelOf(ready) },
        style = MyGameTypography.caption.withTabularFigures(),
        color = MyGameTheme.colors.inkMuted,
        modifier = modifier,
    )
}
