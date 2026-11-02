package com.emm.mygame.core.network

import kotlin.time.Instant

sealed interface BuildSlot {

    data object Idle : BuildSlot

    data class Busy(val building: BuildingKind, val targetLevel: Int, val finishesAt: Instant) : BuildSlot
}
