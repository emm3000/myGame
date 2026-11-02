package com.emm.mygame.feature.fief

import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.ResourceKind
import kotlin.time.Duration

sealed interface FiefUiState {

    data object Loading : FiefUiState

    data object Failed : FiefUiState

    data class Content(val name: String, val resources: List<ResourceLine>, val slot: SlotLine) : FiefUiState

    data class ResourceLine(val kind: ResourceKind, val amount: Long, val capacity: Long, val ratePerHour: Long) {

        val isFull: Boolean
            get() = amount >= capacity
    }

    sealed interface SlotLine {

        data object Idle : SlotLine

        data class Busy(val building: BuildingKind, val targetLevel: Int, val remaining: Duration) : SlotLine
    }
}
