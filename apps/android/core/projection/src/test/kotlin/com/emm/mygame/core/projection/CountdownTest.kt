package com.emm.mygame.core.projection

import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Test

class CountdownTest {

    private val now: Instant = Instant.fromEpochMilliseconds(0)

    @Test
    fun `counts down to the instant the build finishes`() {
        assertEquals(5.minutes, countdownTo(finishesAt = now + 5.minutes, now = now))
    }

    @Test
    fun `stops at zero once the finish has passed`() {
        assertEquals(Duration.ZERO, countdownTo(finishesAt = now - 10.seconds, now = now))
    }
}
