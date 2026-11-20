package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun ReadyLine(ready: TownUiState.ReadyTime, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val color: Color = MyGameTheme.colors.inkMuted
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier.semantics(mergeDescendants = true) {},
    ) {
        MyGameText(label = copy.chrome { readyWordsOf(ready) }, style = MyGameTypography.caption, color = color)
        MyGameText(
            label = copy.chrome { readyTimeOf(ready) },
            style = MyGameTypography.caption.withTabularFigures(),
            color = color,
        )
    }
}
