package com.emm.mygame.feature.town.naming

import com.emm.mygame.core.model.town.TownFoundResult
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.feature.town.TownUiState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

internal class NamingRequests(
    private val towns: TownRepository,
    private val scope: CoroutineScope,
    private val naming: () -> TownUiState.Naming?,
    private val onAnswered: (NamingStatus) -> Unit,
    private val onFounded: (TownSnapshot) -> Unit,
) {

    fun found() {
        val asked: TownUiState.Naming = naming() ?: return
        if (asked.status == NamingStatus.Submitting) return
        onAnswered(NamingStatus.Submitting)
        scope.launch {
            when (val answer: TownFoundResult = towns.found(asked.name)) {
                is TownFoundResult.Founded -> onFounded(answer.town)
                is TownFoundResult.Refused -> onAnswered(NamingStatus.Refused(answer.refusal))
                TownFoundResult.Unreachable -> onAnswered(NamingStatus.Unreachable)
            }
        }
    }
}
