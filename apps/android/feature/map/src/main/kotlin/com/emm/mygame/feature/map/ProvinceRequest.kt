package com.emm.mygame.feature.map

sealed interface ProvinceRequest {

    data object Own : ProvinceRequest

    data class Numbered(val province: Int) : ProvinceRequest
}
