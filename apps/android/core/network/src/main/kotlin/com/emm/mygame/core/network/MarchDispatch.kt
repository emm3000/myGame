package com.emm.mygame.core.network

sealed interface MarchDispatch {

    data class Forage(val target: PlotAddress, val party: List<UnitCount>, val stayHours: Int) : MarchDispatch

    data class Attack(val target: PlotAddress, val party: List<UnitCount>) : MarchDispatch

    data class Found(val target: PlotAddress, val name: String) : MarchDispatch

    data class Transport(
        val destination: FiefId,
        val party: List<UnitCount>,
        val cargo: List<ResourceQuantity>,
    ) : MarchDispatch
}
