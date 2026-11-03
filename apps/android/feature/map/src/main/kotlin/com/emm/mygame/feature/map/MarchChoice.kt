package com.emm.mygame.feature.map

import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.MarchCamp
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.UnitKind

internal data class MarchChoice(
    val target: PlotAddress,
    val order: ChosenOrder,
    val entries: Map<UnitKind, String>,
    val hoursEntry: String,
    val nameEntry: String,
    val cargoEntries: Map<ResourceKind, String>,
    val send: MapUiState.SendStatus,
)

internal sealed interface ChosenOrder {

    val offered: MapUiState.OfferedOrder

    data object Forage : ChosenOrder {
        override val offered: MapUiState.OfferedOrder = MapUiState.OfferedOrder.Forage
    }

    data class Attack(val camp: MarchCamp) : ChosenOrder {
        override val offered: MapUiState.OfferedOrder = MapUiState.OfferedOrder.Attack
    }

    data object Found : ChosenOrder {
        override val offered: MapUiState.OfferedOrder = MapUiState.OfferedOrder.Found
    }

    data class Transport(val destination: FiefId) : ChosenOrder {
        override val offered: MapUiState.OfferedOrder = MapUiState.OfferedOrder.Transport
    }
}
