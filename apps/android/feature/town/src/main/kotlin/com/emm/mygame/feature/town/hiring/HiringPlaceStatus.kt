package com.emm.mygame.feature.town.hiring

import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.model.town.hiring.TownHiringRefusal

sealed interface HiringPlaceStatus {

    data object Idle : HiringPlaceStatus

    data class Waiting(val hire: TownHireKind) : HiringPlaceStatus

    data class Refused(val hire: TownHireKind, val refusal: TownHiringRefusal) : HiringPlaceStatus

    data class Unreachable(val hire: TownHireKind) : HiringPlaceStatus
}
