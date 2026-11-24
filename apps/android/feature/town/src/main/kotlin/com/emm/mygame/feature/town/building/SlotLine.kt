package com.emm.mygame.feature.town.building

import com.emm.mygame.core.model.town.building.TownBuildingKind
import kotlin.time.Duration
import kotlin.time.Instant

sealed interface SlotLine {

    data object Idle : SlotLine

    data class Busy(
        val building: TownBuildingKind,
        val level: Int,
        val remaining: Duration,
        val total: Duration,
        val finishesAt: Instant,
    ) : SlotLine

    data class Done(val building: TownBuildingKind, val level: Int) : SlotLine
}
