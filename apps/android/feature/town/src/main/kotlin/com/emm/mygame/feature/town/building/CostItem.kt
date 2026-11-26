package com.emm.mygame.feature.town.building

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.projection.town.building.CostLine
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.feature.town.shortMarked

@Composable
internal fun CostItem(cost: CostLine, modifier: Modifier = Modifier) {
    val description: String = rememberPlayerCopy().chrome {
        shortMarked(amountLineOf(cost.kind, cost.amount), cost.isShort)
    }.spoken
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier.clearAndSetSemantics { contentDescription = description },
    ) {
        MyGameIcon(
            icon = resourceIconOf(cost.kind),
            tint = MyGameTheme.colors.ink,
            modifier = Modifier.size(MyGameSizes.iconSmall),
        )
        MyGameText(
            text = formatQuantity(cost.amount),
            style = MyGameTypography.caption.withTabularFigures(),
            color = if (cost.isShort) MyGameTheme.colors.warningInk else MyGameTheme.colors.ink,
        )
    }
}
