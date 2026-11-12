package com.emm.mygame.core.network

data class TownGoal(
    val position: Int,
    val count: Int,
    val building: TownBuildingKind,
    val level: Int,
    val state: State,
) {

    sealed interface State {

        data object Underway : State

        data class Pending(val resources: List<TownSnapshot.Cost>, val people: Int) : State
    }
}
