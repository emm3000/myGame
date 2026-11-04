package com.emm.mygame.core.network

sealed interface MarchRefusal {

    data class NotEnoughUnitsAtHome(val unit: UnitKind, val count: Int, val atHome: Int) : MarchRefusal

    data class StayOutOfRange(val maxStayHours: Int) : MarchRefusal

    data class FiefCapReached(val cap: Int) : MarchRefusal

    data class CargoAboveCarry(val cargo: Int, val carry: Int) : MarchRefusal

    data object MarchSlotBusy : MarchRefusal

    data object MarchTargetOutOfBounds : MarchRefusal

    data object PlotHeld : MarchRefusal

    data object PlotHasCamp : MarchRefusal

    data object PlotHasNoCamp : MarchRefusal

    data object PlotReserved : MarchRefusal

    data object MarchToOwnPlot : MarchRefusal

    data object UnitUnfitForOrder : MarchRefusal

    data object BlankFiefName : MarchRefusal

    data object EmptyCargo : MarchRefusal

    data object InsufficientResources : MarchRefusal

    data object FiefNotFound : MarchRefusal

    data object MarchNotFound : MarchRefusal

    data object MarchAlreadyReturning : MarchRefusal

    data object Unrecognized : MarchRefusal
}
