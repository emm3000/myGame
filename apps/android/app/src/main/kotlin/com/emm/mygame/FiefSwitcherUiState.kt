package com.emm.mygame

import com.emm.mygame.core.network.FiefAddress
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FreeSlot
import com.emm.mygame.core.network.ResourceKind

internal sealed interface FiefSwitcherUiState {

    data object Unlisted : FiefSwitcherUiState

    data class Listed(val entries: List<Entry>) : FiefSwitcherUiState

    data class Entry(
        val fief: FiefId,
        val name: String,
        val address: FiefAddress,
        val isCurrent: Boolean,
        val badges: List<Badge>,
    )

    sealed interface Badge {

        data class Idle(val slot: FreeSlot) : Badge

        data class FullStore(val resource: ResourceKind) : Badge
    }
}
