package com.emm.mygame.feature.town.building

import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.building.TownWorkResult
import com.emm.mygame.feature.town.TownRequests
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

internal class BuildingRequests(
    private val towns: TownRepository,
    private val scope: CoroutineScope,
    private val requests: () -> TownRequests,
    private val onDrawn: (TownRequests) -> Unit,
    private val onAnswered: (TownSnapshot, TownRequests) -> Unit,
) {

    fun start(building: TownBuildingKind) {
        if (requests().start is StartStatus.Waiting) return
        onDrawn(requests().copy(start = StartStatus.Waiting(building)))
        scope.launch {
            when (val answer: TownWorkResult = towns.startWork(building)) {
                is TownWorkResult.Answered -> onAnswered(answer.town, requests().startAnswered())
                is TownWorkResult.Refused ->
                    onDrawn(requests().copy(start = StartStatus.Refused(building, answer.refusal)))
                TownWorkResult.Unreachable ->
                    onDrawn(requests().copy(start = StartStatus.Unreachable(building)))
            }
        }
    }

    fun stop(target: WorkTarget) {
        if (requests().stop is StopStatus.Waiting) return
        onDrawn(requests().copy(stop = StopStatus.Waiting(target)))
        scope.launch {
            when (val answer: TownWorkResult = towns.stopWork(target.building, target.level)) {
                is TownWorkResult.Answered -> onAnswered(answer.town, requests().stopAnswered())
                is TownWorkResult.Refused ->
                    onDrawn(requests().copy(stop = StopStatus.Refused(target, answer.refusal)))
                TownWorkResult.Unreachable ->
                    onDrawn(requests().copy(stop = StopStatus.Unreachable(target)))
            }
        }
    }
}
