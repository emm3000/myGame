package com.emm.mygame.feature.town.hiring

import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.model.town.hiring.TownHiringRepository
import com.emm.mygame.core.model.town.hiring.TownHiringResult
import com.emm.mygame.feature.town.TownRequests
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

internal class HiringRequests(
    private val towns: TownHiringRepository,
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
        if (requests().hiringPlace is HiringPlaceStatus.Waiting) return
        val count: Int = hireCountOf(entries[hire] ?: FIRST_HIRING_ENTRY) ?: return
        onDrawn(requests().copy(hiringPlace = HiringPlaceStatus.Waiting(hire)))
        scope.launch {
            when (val answer: TownHiringResult = towns.placeHiring(hire, count)) {
                is TownHiringResult.Answered -> onAnswered(answer.town, requests().hiringPlaceAnswered())
                is TownHiringResult.Refused ->
                    onDrawn(requests().copy(hiringPlace = HiringPlaceStatus.Refused(hire, answer.refusal)))
                TownHiringResult.Unreachable ->
                    onDrawn(requests().copy(hiringPlace = HiringPlaceStatus.Unreachable(hire)))
            }
        }
    }

    fun stop(target: HiringTarget) {
        if (requests().hiringStop == HiringStopStatus.Waiting) return
        onDrawn(requests().copy(hiringStop = HiringStopStatus.Waiting))
        scope.launch {
            when (val answer: TownHiringResult = towns.stopHiring(target.hire, target.startedAt)) {
                is TownHiringResult.Answered -> onAnswered(answer.town, requests().hiringStopAnswered())
                is TownHiringResult.Refused ->
                    onDrawn(requests().copy(hiringStop = HiringStopStatus.Refused(answer.refusal)))
                TownHiringResult.Unreachable ->
                    onDrawn(requests().copy(hiringStop = HiringStopStatus.Unreachable))
            }
        }
    }
}
