package com.emm.mygame.feature.town.building

import com.emm.mygame.core.model.town.building.TownBuildingKind
import kotlin.time.Duration
import kotlin.time.Instant

data class WaitingLine(
    val building: TownBuildingKind,
    val level: Int,
    val remaining: Duration,
    val finishesAt: Instant,
)
