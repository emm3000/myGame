package com.emm.mygame.feature.map

import androidx.compose.ui.graphics.vector.ImageVector
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.network.SeasonKind

internal fun seasonIconOf(kind: SeasonKind): ImageVector = when (kind) {
    SeasonKind.Spring -> MyGameIcons.spring
    SeasonKind.Summer -> MyGameIcons.summer
    SeasonKind.Fall -> MyGameIcons.fall
    SeasonKind.Winter -> MyGameIcons.winter
}

internal fun seasonSelectorOf(kind: SeasonKind): String = when (kind) {
    SeasonKind.Spring -> "spring"
    SeasonKind.Summer -> "summer"
    SeasonKind.Fall -> "fall"
    SeasonKind.Winter -> "winter"
}
