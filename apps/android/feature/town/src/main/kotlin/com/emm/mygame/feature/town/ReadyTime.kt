package com.emm.mygame.feature.town

import kotlin.time.Duration
import kotlin.time.Instant

data class ReadyTime(val remaining: Duration, val readyAt: Instant)
