package com.emm.mygame.core.network

import kotlin.time.Instant

data class WaitingUpgrade(val building: BuildingKind, val targetLevel: Int, val finishesAt: Instant)
