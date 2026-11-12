package com.emm.mygame.feature.town

import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownHiringResult
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.network.TownSnapshot
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

internal class TownHiring(
    private val towns: TownRepository,
    private val scope: CoroutineScope,
    private val mutations: () -> TownMutations,
    private val onDrawn: (TownMutations) -> Unit,
    private val onAnswered: (TownSnapshot, TownMutations) -> Unit,
) {

    var entries: Map<TownHireKind, String> = emptyMap()
        private set

    fun enter(hire: TownHireKind, entry: String) {
        entries = entries + (hire to entry)
        onDrawn(mutations())
    }

    fun place(hire: TownHireKind) {
        if (mutations().hire is TownUiState.HireStatus.Waiting) return
        val count: Int = hireCountOf(entries[hire] ?: FIRST_HIRE_ENTRY) ?: return
        onDrawn(mutations().copy(hire = TownUiState.HireStatus.Waiting(hire)))
        scope.launch {
            when (val answer: TownHiringResult = towns.placeHiring(hire, count)) {
                is TownHiringResult.Answered -> onAnswered(answer.town, mutations().hireAnswered())
                is TownHiringResult.Refused ->
                    onDrawn(mutations().copy(hire = TownUiState.HireStatus.Refused(hire, answer.refusal)))
                TownHiringResult.Unreachable ->
                    onDrawn(mutations().copy(hire = TownUiState.HireStatus.Unreachable(hire)))
            }
        }
    }

    fun stop(target: TownUiState.HiringTarget) {
        if (mutations().hireStop == TownUiState.HireStopStatus.Waiting) return
        onDrawn(mutations().copy(hireStop = TownUiState.HireStopStatus.Waiting))
        scope.launch {
            when (val answer: TownHiringResult = towns.stopHiring(target.hire, target.startedAt)) {
                is TownHiringResult.Answered -> onAnswered(answer.town, mutations().hireStopAnswered())
                is TownHiringResult.Refused ->
                    onDrawn(mutations().copy(hireStop = TownUiState.HireStopStatus.Refused(answer.refusal)))
                TownHiringResult.Unreachable ->
                    onDrawn(mutations().copy(hireStop = TownUiState.HireStopStatus.Unreachable))
            }
        }
    }
}
