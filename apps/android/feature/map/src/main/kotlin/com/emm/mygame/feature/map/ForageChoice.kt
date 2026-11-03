package com.emm.mygame.feature.map

import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.UnitKind

internal data class ForageChoice(
    val target: PlotAddress,
    val entries: Map<UnitKind, String>,
    val hoursEntry: String,
    val send: MapUiState.SendStatus,
)
