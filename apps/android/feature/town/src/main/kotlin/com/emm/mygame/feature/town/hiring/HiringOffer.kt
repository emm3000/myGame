package com.emm.mygame.feature.town.hiring

import com.emm.mygame.core.projection.town.building.CostLine
import kotlin.time.Duration

data class HiringOffer(
    val count: Int,
    val costs: List<CostLine>,
    val people: Long,
    val isPeopleShort: Boolean,
    val duration: Duration,
)
