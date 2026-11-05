package com.emm.mygame.core.network

sealed interface TownWorkRefusal {

    data class WaitingListFull(val cap: Int) : TownWorkRefusal

    data class TopLevelReached(val level: Int) : TownWorkRefusal

    data class NotEnoughPeople(val required: Int, val free: Int) : TownWorkRefusal

    data object NotEnoughResources : TownWorkRefusal

    data class BuildingWorkNotFound(val level: Int) : TownWorkRefusal

    data object TownNotFound : TownWorkRefusal

    data object Unrecognized : TownWorkRefusal
}
