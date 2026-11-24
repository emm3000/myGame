package com.emm.mygame.feature.town.building

import kotlin.time.Duration

data class NextLevelLine(
    val level: Int,
    val costs: List<CostLine>,
    val duration: Duration,
    val people: Int,
    val wordsNeeded: WordNeedLine?,
)
