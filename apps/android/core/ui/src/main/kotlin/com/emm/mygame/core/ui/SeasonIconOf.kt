package com.emm.mygame.core.ui

import androidx.compose.ui.graphics.vector.ImageVector
import com.emm.mygame.core.designsystem.art.MyGameIcons
import com.emm.mygame.core.model.town.SeasonKind

fun seasonIconOf(kind: SeasonKind): ImageVector = when (kind) {
    SeasonKind.Spring -> MyGameIcons.spring
    SeasonKind.Summer -> MyGameIcons.summer
    SeasonKind.Fall -> MyGameIcons.fall
    SeasonKind.Winter -> MyGameIcons.winter
}
