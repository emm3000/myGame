package com.emm.mygame.core.testing

import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.PlacementAnswer
import com.emm.mygame.core.network.PlacementBand

sealed interface HoldoutCheckChange {

    val band: PlacementBand

    val week: HoldoutCheckWeek

    data class Begin(override val band: PlacementBand, override val week: HoldoutCheckWeek) : HoldoutCheckChange

    data class Skip(override val band: PlacementBand, override val week: HoldoutCheckWeek) : HoldoutCheckChange

    data class Answer(
        override val band: PlacementBand,
        override val week: HoldoutCheckWeek,
        val answers: List<PlacementAnswer>,
    ) : HoldoutCheckChange
}
