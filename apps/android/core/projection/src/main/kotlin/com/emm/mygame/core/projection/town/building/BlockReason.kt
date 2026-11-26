package com.emm.mygame.core.projection.town.building

import com.emm.mygame.core.model.town.building.NeededWordKind
import com.emm.mygame.core.projection.town.ReadyTime

sealed interface BlockReason {

    data class WaitingListFull(val cap: Int) : BlockReason

    data class PeopleShort(val needed: Int, val free: Int) : BlockReason

    data class WordsShort(val needed: Int, val held: Int, val standing: NeededWordKind) : BlockReason

    data class Resources(val shortfalls: List<Shortfall>, val ready: ReadyTime?) : BlockReason
}
