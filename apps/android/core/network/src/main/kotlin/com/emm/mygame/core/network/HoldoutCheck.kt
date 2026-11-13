package com.emm.mygame.core.network

sealed interface HoldoutCheck {

    val band: PlacementBand

    val week: HoldoutCheckWeek

    data class Due(override val band: PlacementBand, override val week: HoldoutCheckWeek) : HoldoutCheck

    data class Asking(
        override val band: PlacementBand,
        override val week: HoldoutCheckWeek,
        val items: List<PlacementItem>,
    ) : HoldoutCheck
}
