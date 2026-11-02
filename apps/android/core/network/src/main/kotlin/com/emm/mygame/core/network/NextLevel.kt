package com.emm.mygame.core.network

import kotlin.time.Duration

data class NextLevel(val level: Int, val cost: List<ResourceCost>, val duration: Duration, val peasants: Int)
