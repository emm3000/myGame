package com.emm.mygame.core.projection

import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Test

class LevyDeliveryTest {

    private val startedAt: Instant = Instant.fromEpochMilliseconds(0)

    @Test
    fun `delivers one unit per term since the levy started`() {
        assertEquals(
            4,
            deliveredUnitsAt(startedAt = startedAt, perUnit = 1.minutes, count = 12, now = startedAt + 270.seconds),
        )
    }

    @Test
    fun `never delivers more than the levy counts`() {
        assertEquals(
            12,
            deliveredUnitsAt(startedAt = startedAt, perUnit = 1.minutes, count = 12, now = startedAt + 20.minutes),
        )
    }

    @Test
    fun `delivers none before the levy started`() {
        assertEquals(
            0,
            deliveredUnitsAt(startedAt = startedAt, perUnit = 1.minutes, count = 12, now = startedAt - 5.seconds),
        )
    }
}
