package com.emm.mygame.feature.town

internal data class TownMutations(val start: TownUiState.StartStatus, val stop: TownUiState.StopStatus) {

    fun keptAfterRead(): TownMutations = TownMutations(
        start = if (start is TownUiState.StartStatus.Waiting) start else TownUiState.StartStatus.Idle,
        stop = if (stop is TownUiState.StopStatus.Waiting) stop else TownUiState.StopStatus.Idle,
    )

    fun startAnswered(): TownMutations = keptAfterRead().copy(start = TownUiState.StartStatus.Idle)

    fun stopAnswered(): TownMutations = keptAfterRead().copy(stop = TownUiState.StopStatus.Idle)

    companion object {
        val none: TownMutations = TownMutations(TownUiState.StartStatus.Idle, TownUiState.StopStatus.Idle)
    }
}
