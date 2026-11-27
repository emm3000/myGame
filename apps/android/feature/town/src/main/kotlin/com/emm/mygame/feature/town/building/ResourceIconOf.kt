package com.emm.mygame.feature.town.building

import androidx.compose.ui.graphics.vector.ImageVector
import com.emm.mygame.core.designsystem.art.MyGameIcons
import com.emm.mygame.core.model.town.TownResourceKind

internal fun resourceIconOf(kind: TownResourceKind): ImageVector = when (kind) {
    TownResourceKind.Money -> MyGameIcons.money
    TownResourceKind.Food -> MyGameIcons.food
    TownResourceKind.Power -> MyGameIcons.power
    TownResourceKind.Material -> MyGameIcons.material
}
