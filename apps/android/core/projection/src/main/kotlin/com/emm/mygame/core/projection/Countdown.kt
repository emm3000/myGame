package com.emm.mygame.core.projection

import kotlin.time.Duration
import kotlin.time.Instant

fun countdownTo(finishesAt: Instant, now: Instant): Duration = (finishesAt - now).coerceAtLeast(Duration.ZERO)
