package com.emm.mygame.feature.map

import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.MapPlot
import com.emm.mygame.core.network.MarchCamp
import com.emm.mygame.core.network.PlotHolder
import com.emm.mygame.core.network.ProvinceMap

internal fun FiefSnapshot.offersOn(map: ProvinceMap): List<MapUiState.PlotOffer> = map.plots.flatMap { plot: MapPlot ->
    ordersOn(plot.holder).map { order: MapUiState.OfferedOrder -> MapUiState.PlotOffer(plot.plot, order) }
}

internal fun chosenOrderOf(holder: PlotHolder, offered: MapUiState.OfferedOrder): ChosenOrder? = when (offered) {
    MapUiState.OfferedOrder.Forage -> ChosenOrder.Forage
    MapUiState.OfferedOrder.Found -> ChosenOrder.Found
    MapUiState.OfferedOrder.Attack ->
        (holder as? PlotHolder.Camp)?.let { camp: PlotHolder.Camp ->
            ChosenOrder.Attack(MarchCamp(camp.tier, camp.strength))
        }
    MapUiState.OfferedOrder.Transport ->
        (holder as? PlotHolder.Own)?.fief?.let { destination: FiefId -> ChosenOrder.Transport(destination) }
}

private fun FiefSnapshot.ordersOn(holder: PlotHolder): List<MapUiState.OfferedOrder> = when (holder) {
    PlotHolder.Free -> listOfNotNull(
        MapUiState.OfferedOrder.Forage,
        MapUiState.OfferedOrder.Found.takeIf { settlersAtHome() >= 1 },
    )
    is PlotHolder.Camp -> listOf(MapUiState.OfferedOrder.Attack)
    is PlotHolder.Own -> listOfNotNull(
        MapUiState.OfferedOrder.Transport.takeIf { holder.fief != null && holder.fief != id },
    )
    is PlotHolder.Held, is PlotHolder.Reserved -> emptyList()
}
