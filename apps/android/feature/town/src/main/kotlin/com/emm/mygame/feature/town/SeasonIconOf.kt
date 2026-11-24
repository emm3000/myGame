package com.emm.mygame.feature.town

import androidx.compose.ui.graphics.vector.ImageVector
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.model.town.SeasonKind

internal fun seasonIconOf(kind: SeasonKind): ImageVector = when (kind) {
    SeasonKind.Spring -> MyGameIcons.spring
    SeasonKind.Summer -> MyGameIcons.summer
    SeasonKind.Fall -> MyGameIcons.fall
    SeasonKind.Winter -> MyGameIcons.winter
}
