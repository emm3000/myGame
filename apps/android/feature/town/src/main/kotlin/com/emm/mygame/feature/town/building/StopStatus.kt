package com.emm.mygame.feature.town.building

import com.emm.mygame.core.model.town.building.TownWorkRefusal

sealed interface StopStatus {

    data object Idle : StopStatus

    data class Waiting(val target: WorkTarget) : StopStatus

    data class Refused(val target: WorkTarget, val refusal: TownWorkRefusal) : StopStatus

    data class Unreachable(val target: WorkTarget) : StopStatus
}
