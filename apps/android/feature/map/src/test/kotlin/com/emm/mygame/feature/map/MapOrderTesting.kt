package com.emm.mygame.feature.map

import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.MapReadResult
import com.emm.mygame.core.network.ProvinceMap
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.FakeMapRepository

internal fun openOrdersOn(
    fiefs: FakeFiefRepository,
    read: FiefSnapshot = fief(),
    province: ProvinceMap = ordersProvince,
    maps: FakeMapRepository = FakeMapRepository(),
): MapViewModel {
    fiefs.answerRead(FiefReadResult.Read(read))
    val viewModel: MapViewModel = MapViewModel(read.id, maps, fiefs)
    maps.answerRead(MapReadResult.Read(province))
    return viewModel
}

internal fun contentOf(viewModel: MapViewModel): MapUiState.Content = viewModel.state.value as MapUiState.Content

internal fun offeredOn(viewModel: MapViewModel, plot: Int): List<MapUiState.OfferedOrder> =
    contentOf(viewModel).offersOn(plot)
