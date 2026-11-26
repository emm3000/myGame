package com.emm.mygame.feature.town

import com.emm.mygame.core.projection.town.building.StartStatus
import com.emm.mygame.feature.town.building.work.StopStatus
import com.emm.mygame.feature.town.hiring.HiringPlaceStatus
import com.emm.mygame.feature.town.hiring.HiringStopStatus

internal data class TownRequests(
    val start: StartStatus,
    val stop: StopStatus,
    val hiringPlace: HiringPlaceStatus,
    val hiringStop: HiringStopStatus,
) {

    fun keptAfterRead(): TownRequests = TownRequests(
        start = if (start is StartStatus.Waiting) start else StartStatus.Idle,
        stop = if (stop is StopStatus.Waiting) stop else StopStatus.Idle,
        hiringPlace = if (hiringPlace is HiringPlaceStatus.Waiting) {
            hiringPlace
        } else {
            HiringPlaceStatus.Idle
        },
        hiringStop = if (hiringStop == HiringStopStatus.Waiting) {
            hiringStop
        } else {
            HiringStopStatus.Idle
        },
    )

    fun startAnswered(): TownRequests = keptAfterRead().copy(start = StartStatus.Idle)

    fun stopAnswered(): TownRequests = keptAfterRead().copy(stop = StopStatus.Idle)

    fun hiringPlaceAnswered(): TownRequests = keptAfterRead().copy(hiringPlace = HiringPlaceStatus.Idle)

    fun hiringStopAnswered(): TownRequests = keptAfterRead().copy(hiringStop = HiringStopStatus.Idle)

    companion object {
        val none: TownRequests = TownRequests(
            start = StartStatus.Idle,
            stop = StopStatus.Idle,
            hiringPlace = HiringPlaceStatus.Idle,
            hiringStop = HiringStopStatus.Idle,
        )
    }
}
