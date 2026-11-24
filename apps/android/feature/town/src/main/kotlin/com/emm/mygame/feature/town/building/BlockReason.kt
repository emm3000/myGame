package com.emm.mygame.feature.town.building

sealed interface BlockReason {

    data class WaitingListFull(val cap: Int) : BlockReason

    data class PeopleShort(val needed: Int, val free: Int) : BlockReason

    data class Resources(val shortfalls: List<Shortfall>, val ready: ReadyTime?) : BlockReason
}
