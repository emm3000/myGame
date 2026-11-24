package com.emm.mygame.core.model.town.building

import com.emm.mygame.core.model.town.ResourceCost
import kotlin.time.Duration

data class NextLevel(val level: Int, val cost: List<ResourceCost>, val duration: Duration, val peasants: Int)
