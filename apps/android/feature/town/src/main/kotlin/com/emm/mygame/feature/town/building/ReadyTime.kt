package com.emm.mygame.feature.town.building

import kotlin.time.Duration
import kotlin.time.Instant

data class ReadyTime(val remaining: Duration, val readyAt: Instant)
