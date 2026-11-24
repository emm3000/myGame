package com.emm.mygame.feature.town

internal data class TownRequests(
    val start: TownUiState.StartStatus,
    val stop: TownUiState.StopStatus,
    val hiring: TownUiState.HiringStatus,
    val hiringStop: TownUiState.HiringStopStatus,
) {

    fun keptAfterRead(): TownRequests = TownRequests(
        start = if (start is TownUiState.StartStatus.Waiting) start else TownUiState.StartStatus.Idle,
        stop = if (stop is TownUiState.StopStatus.Waiting) stop else TownUiState.StopStatus.Idle,
        hiring = if (hiring is TownUiState.HiringStatus.Waiting) hiring else TownUiState.HiringStatus.Idle,
        hiringStop = if (hiringStop == TownUiState.HiringStopStatus.Waiting) {
            hiringStop
        } else {
            TownUiState.HiringStopStatus.Idle
        },
    )

    fun startAnswered(): TownRequests = keptAfterRead().copy(start = TownUiState.StartStatus.Idle)

    fun stopAnswered(): TownRequests = keptAfterRead().copy(stop = TownUiState.StopStatus.Idle)

    fun hiringAnswered(): TownRequests = keptAfterRead().copy(hiring = TownUiState.HiringStatus.Idle)

    fun hiringStopAnswered(): TownRequests = keptAfterRead().copy(hiringStop = TownUiState.HiringStopStatus.Idle)

    companion object {
        val none: TownRequests = TownRequests(
            start = TownUiState.StartStatus.Idle,
            stop = TownUiState.StopStatus.Idle,
            hiring = TownUiState.HiringStatus.Idle,
            hiringStop = TownUiState.HiringStopStatus.Idle,
        )
    }
}
