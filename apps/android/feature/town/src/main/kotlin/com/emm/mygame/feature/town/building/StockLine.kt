package com.emm.mygame.feature.town.building

import com.emm.mygame.core.model.town.TownResourceKind

data class StockLine(
    val kind: TownResourceKind,
    val amount: Long,
    val capacity: Long,
    val ratePerHour: Long,
    val skillLevel: Int,
    val fill: FillTime?,
) {

    val isFull: Boolean
        get() = amount >= capacity
}
