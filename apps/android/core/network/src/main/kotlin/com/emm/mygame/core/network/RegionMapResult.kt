package com.emm.mygame.core.network

sealed interface RegionMapResult {

    data class Read(val map: RegionMap) : RegionMapResult

    data object AreaNotFound : RegionMapResult

    data object NoTown : RegionMapResult

    data object Unreachable : RegionMapResult
}
