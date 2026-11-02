package com.emm.mygame.core.projection

import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class ResourceStockTest {

    private val readAt: Instant = Instant.fromEpochMilliseconds(0)

    @Test
    fun `draws the stored amount when the clock is behind the read`() {
        val woodStock = ResourceStock(amount = 100, ratePerHour = 10.0, capacity = 900)

        val drawn: Long = woodStock.amountAt(readAt = readAt, now = readAt - 1.hours)

        assertEquals(100L, drawn)
    }

    @Test
    fun `accrues the rate over the time elapsed since the read`() {
        val woodStock = ResourceStock(amount = 0, ratePerHour = 60.0, capacity = 900)

        val afterTenMinutes: Long = woodStock.amountAt(readAt = readAt, now = readAt + 10.minutes)
        val afterTwentyMinutes: Long = woodStock.amountAt(readAt = readAt, now = readAt + 20.minutes)

        assertEquals(10L, afterTenMinutes)
        assertEquals(20L, afterTwentyMinutes)
    }

    @Test
    fun `refuses a negative stored amount`() {
        assertThrows(IllegalArgumentException::class.java) {
            ResourceStock(amount = -1, ratePerHour = 10.0, capacity = 900)
        }
    }

    @Test
    fun `refuses a negative rate`() {
        assertThrows(IllegalArgumentException::class.java) {
            ResourceStock(amount = 0, ratePerHour = -1.0, capacity = 900)
        }
    }
}
