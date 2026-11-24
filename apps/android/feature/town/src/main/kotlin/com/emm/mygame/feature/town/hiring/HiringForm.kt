package com.emm.mygame.feature.town.hiring

data class HiringForm(
    val entry: String,
    val isEntryDisabled: Boolean,
    val offer: HiringOffer?,
    val block: HiringBlock?,
)
