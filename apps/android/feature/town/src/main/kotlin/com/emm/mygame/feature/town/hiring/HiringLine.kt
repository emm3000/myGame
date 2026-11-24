package com.emm.mygame.feature.town.hiring

import com.emm.mygame.feature.town.DurationMark

data class HiringLine(
    val order: HiringOrderLine,
    val hires: List<HiringCard>,
    val hireMark: DurationMark?,
    val place: HiringPlaceStatus,
    val stop: HiringStopStatus,
)
