package com.emm.mygame.core.network

enum class MarchRefusal {
    NotEnoughUnitsAtHome,
    MarchSlotBusy,
    StayOutOfRange,
    MarchTargetOutOfBounds,
    PlotHeld,
    PlotHasCamp,
    PlotHasNoCamp,
    PlotReserved,
    MarchToOwnPlot,
    UnitUnfitForOrder,
    FiefCapReached,
    BlankFiefName,
    EmptyCargo,
    CargoAboveCarry,
    InsufficientResources,
    FiefNotFound,
    MarchNotFound,
    MarchAlreadyReturning,
    Unrecognized,
}
