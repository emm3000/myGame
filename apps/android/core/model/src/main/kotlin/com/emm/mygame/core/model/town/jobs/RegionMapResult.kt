package com.emm.mygame.core.model.town.jobs

sealed interface RegionMapResult {

    data class Read(val map: RegionMap) : RegionMapResult

    data object AreaNotFound : RegionMapResult

    data object NoTown : RegionMapResult

    data object Unreachable : RegionMapResult
}
