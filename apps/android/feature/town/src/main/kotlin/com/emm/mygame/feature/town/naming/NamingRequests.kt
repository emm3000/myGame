package com.emm.mygame.feature.town.naming

import com.emm.mygame.core.model.town.TownFoundResult
import com.emm.mygame.core.model.town.TownFoundingRepository
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.feature.town.TownUiState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

internal class NamingRequests(
    private val towns: TownFoundingRepository,
    private val scope: CoroutineScope,
    private val asked: () -> TownUiState.Naming?,
    private val onStatus: (NamingStatus) -> Unit,
    private val onFounded: (TownSnapshot) -> Unit,
) {

    fun found() {
        val current: TownUiState.Naming = asked() ?: return
        if (current.status == NamingStatus.Submitting) return
        onStatus(NamingStatus.Submitting)
        scope.launch {
            when (val answer: TownFoundResult = towns.found(current.name)) {
                is TownFoundResult.Founded -> onFounded(answer.town)
                is TownFoundResult.Refused -> onStatus(NamingStatus.Refused(answer.refusal))
                TownFoundResult.Unreachable -> onStatus(NamingStatus.Unreachable)
            }
        }
    }
}

internal fun MutableStateFlow<TownUiState>.updateNaming(change: (TownUiState.Naming) -> TownUiState.Naming) {
    update { current: TownUiState -> if (current is TownUiState.Naming) change(current) else current }
}
