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
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.feature.town.building.ReadyTime

@Composable
internal fun ReadyLine(ready: ReadyTime, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val color: Color = MyGameTheme.colors.inkMuted
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        modifier = modifier.semantics(mergeDescendants = true) {},
    ) {
        MyGameText(label = copy.chrome { readyWordsOf(ready) }, style = MyGameTypography.caption, color = color)
        FiguredCaption(label = copy.chrome { readyTimeLabelOf(ready) }, color = color)
    }
}
