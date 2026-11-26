package com.emm.mygame.core.projection.town.building

import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.building.TownWorkRefusal

sealed interface StartStatus {

    data object Idle : StartStatus

    data class Waiting(val building: TownBuildingKind) : StartStatus

    data class Refused(val building: TownBuildingKind, val refusal: TownWorkRefusal) : StartStatus

    data class Unreachable(val building: TownBuildingKind) : StartStatus
}
