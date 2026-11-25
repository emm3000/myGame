package com.emm.mygame.core.model.town

import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Instant

fun serverNow(clock: Clock, gap: Duration): Instant = clock.now() + gap

fun gapOf(readAt: Instant, clock: Clock): Duration = readAt - clock.now()
