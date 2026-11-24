package com.emm.mygame.feature.town.hiring

import com.emm.mygame.feature.town.ReadyTime
import com.emm.mygame.feature.town.building.Shortfall

sealed interface HiringBlock {

    data object CountNeeded : HiringBlock

    data object Busy : HiringBlock

    data class PeopleShort(val needed: Long, val free: Int) : HiringBlock

    data class Resources(val shortfalls: List<Shortfall>, val ready: ReadyTime?) : HiringBlock
}
