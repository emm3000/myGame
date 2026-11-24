package com.emm.mygame.feature.town.hiring

import com.emm.mygame.core.model.town.hiring.TownHiringRefusal

sealed interface HiringStopStatus {

    data object Idle : HiringStopStatus

    data object Waiting : HiringStopStatus

    data class Refused(val refusal: TownHiringRefusal) : HiringStopStatus

    data object Unreachable : HiringStopStatus
}
