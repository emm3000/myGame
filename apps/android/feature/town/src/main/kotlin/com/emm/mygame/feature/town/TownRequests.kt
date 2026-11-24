package com.emm.mygame.feature.town

internal data class TownRequests(
    val start: TownUiState.StartStatus,
    val stop: TownUiState.StopStatus,
    val hiringPlace: TownUiState.HiringPlaceStatus,
    val hiringStop: TownUiState.HiringStopStatus,
) {

    fun keptAfterRead(): TownRequests = TownRequests(
        start = if (start is TownUiState.StartStatus.Waiting) start else TownUiState.StartStatus.Idle,
        stop = if (stop is TownUiState.StopStatus.Waiting) stop else TownUiState.StopStatus.Idle,
        hiringPlace = if (hiringPlace is TownUiState.HiringPlaceStatus.Waiting) {
            hiringPlace
        } else {
            TownUiState.HiringPlaceStatus.Idle
        },
        hiringStop = if (hiringStop == TownUiState.HiringStopStatus.Waiting) {
            hiringStop
        } else {
            TownUiState.HiringStopStatus.Idle
        },
    )

    fun startAnswered(): TownRequests = keptAfterRead().copy(start = TownUiState.StartStatus.Idle)

    fun stopAnswered(): TownRequests = keptAfterRead().copy(stop = TownUiState.StopStatus.Idle)

    fun hiringPlaceAnswered(): TownRequests = keptAfterRead().copy(hiringPlace = TownUiState.HiringPlaceStatus.Idle)

    fun hiringStopAnswered(): TownRequests = keptAfterRead().copy(hiringStop = TownUiState.HiringStopStatus.Idle)

    companion object {
        val none: TownRequests = TownRequests(
            start = TownUiState.StartStatus.Idle,
            stop = TownUiState.StopStatus.Idle,
            hiringPlace = TownUiState.HiringPlaceStatus.Idle,
            hiringStop = TownUiState.HiringStopStatus.Idle,
        )
    }
}
