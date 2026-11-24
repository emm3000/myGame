package com.emm.mygame.core.model.learning

import com.emm.mygame.core.model.town.TownResourceKind

data class RaisedSkill(
    val resource: TownResourceKind,
    val level: Int,
    val ratePercent: Int,
    val ratePerHourBefore: Double?,
    val ratePerHourAfter: Double?,
    val words: List<String>,
)
