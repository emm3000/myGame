package com.emm.mygame.core.network

data class RaisedSkill(
    val resource: TownResourceKind,
    val level: Int,
    val ratePercent: Int,
    val ratePerHourBefore: Double?,
    val ratePerHourAfter: Double?,
)
