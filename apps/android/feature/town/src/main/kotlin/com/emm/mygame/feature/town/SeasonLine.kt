package com.emm.mygame.feature.town

import com.emm.mygame.core.model.town.SeasonKind
import kotlin.time.Duration

data class SeasonLine(
    val kind: SeasonKind,
    val year: Int,
    val remaining: Duration,
    val productionMarks: List<ProductionMark>,
)
