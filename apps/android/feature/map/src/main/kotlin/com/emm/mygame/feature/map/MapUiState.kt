package com.emm.mygame.feature.map

import com.emm.mygame.core.network.ProvinceMap

sealed interface MapUiState {

    data object Loading : MapUiState

    data class Failed(val request: ProvinceRequest) : MapUiState

    data object ProvinceNotFound : MapUiState

    data class Content(val map: ProvinceMap, val jumpEntry: String) : MapUiState {

        val hasPrevious: Boolean
            get() = map.province > 1

        val hasNext: Boolean
            get() = map.province < map.lastProvince
    }
}
