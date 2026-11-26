package com.emm.mygame.feature.town.building

import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.projection.town.building.BlockReason
import com.emm.mygame.core.projection.town.building.NextLevelLine

data class PlaceCard(
    val kind: TownBuildingKind,
    val level: Int,
    val raisedFrom: Int?,
    val isInWork: Boolean,
    val next: NextLevelLine?,
    val block: BlockReason?,
)
