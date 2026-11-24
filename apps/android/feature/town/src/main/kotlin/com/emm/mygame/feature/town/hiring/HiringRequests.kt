package com.emm.mygame.feature.town.hiring

import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.model.town.hiring.TownHiringResult
import com.emm.mygame.feature.town.TownRequests
import com.emm.mygame.feature.town.TownUiState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

internal class HiringRequests(
    private val towns: TownRepository,
    private val scope: CoroutineScope,
    private val requests: () -> TownRequests,
    private val onDrawn: (TownRequests) -> Unit,
    private val onAnswered: (TownSnapshot, TownRequests) -> Unit,
) {

    var entries: Map<TownHireKind, String> = emptyMap()
        private set

    fun enter(hire: TownHireKind, entry: String) {
        entries = entries + (hire to entry)
        onDrawn(requests())
    }

    fun place(hire: TownHireKind) {
        if (requests().hiring is TownUiState.HiringStatus.Waiting) return
        val count: Int = hireCountOf(entries[hire] ?: FIRST_HIRE_ENTRY) ?: return
        onDrawn(requests().copy(hiring = TownUiState.HiringStatus.Waiting(hire)))
        scope.launch {
            when (val answer: TownHiringResult = towns.placeHiring(hire, count)) {
                is TownHiringResult.Answered -> onAnswered(answer.town, requests().hiringAnswered())
                is TownHiringResult.Refused ->
                    onDrawn(requests().copy(hiring = TownUiState.HiringStatus.Refused(hire, answer.refusal)))
                TownHiringResult.Unreachable ->
                    onDrawn(requests().copy(hiring = TownUiState.HiringStatus.Unreachable(hire)))
            }
        }
    }

    fun stop(target: TownUiState.HiringTarget) {
        if (requests().hiringStop == TownUiState.HiringStopStatus.Waiting) return
        onDrawn(requests().copy(hiringStop = TownUiState.HiringStopStatus.Waiting))
        scope.launch {
            when (val answer: TownHiringResult = towns.stopHiring(target.hire, target.startedAt)) {
                is TownHiringResult.Answered -> onAnswered(answer.town, requests().hiringStopAnswered())
                is TownHiringResult.Refused ->
                    onDrawn(requests().copy(hiringStop = TownUiState.HiringStopStatus.Refused(answer.refusal)))
                TownHiringResult.Unreachable ->
                    onDrawn(requests().copy(hiringStop = TownUiState.HiringStopStatus.Unreachable))
            }
        }
    }
}
