package com.emm.mygame.core.network

sealed interface MapReadResult {

    data class Read(val map: ProvinceMap) : MapReadResult

    data object ProvinceNotFound : MapReadResult

    data object Unreachable : MapReadResult
}
