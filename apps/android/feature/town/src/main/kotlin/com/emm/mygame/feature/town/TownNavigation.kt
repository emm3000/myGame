package com.emm.mygame.feature.town

import com.emm.mygame.core.model.town.building.TownBuildingKind

data class TownNavigation(
    val onPlaceOpen: (TownBuildingKind) -> Unit,
    val onNewsOpen: () -> Unit,
    val onSchoolOpen: () -> Unit,
    val onMapOpen: () -> Unit,
    val onUnnamed: () -> Unit,
    val onNamed: () -> Unit,
)
