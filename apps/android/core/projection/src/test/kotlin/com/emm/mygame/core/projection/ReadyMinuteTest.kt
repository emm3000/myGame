package com.emm.mygame.core.projection

import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ReadyMinuteTest {

    private val readAt: Instant = Instant.parse("2026-11-12T10:00:00Z")

    @Test
    fun `names the latest minute among the short resources`() {
        val foodNeed: ResourceNeed = needOf(amount = 0, ratePerHour = 60.0, cost = 10)
        val powerNeed: ResourceNeed = needOf(amount = 0, ratePerHour = 30.0, cost = 12)

        val ready: Instant? = readyMinuteOf(listOf(foodNeed, powerNeed), readAt)

        assertEquals(Instant.parse("2026-11-12T10:24:00Z"), ready)
    }

    @Test
    fun `names one minute later when the floored amount falls short of the cost`() {
        val foodNeed: ResourceNeed = needOf(amount = 0, ratePerHour = 60.0 / 11.0, cost = 1)

        val ready: Instant? = readyMinuteOf(listOf(foodNeed), readAt)

        assertEquals(Instant.parse("2026-11-12T10:12:00Z"), ready)
    }

    @Test
    fun `names the first minute the floored amount reaches the cost`() {
        val foodNeed: ResourceNeed = needOf(amount = 0, ratePerHour = 150.0 / 7.0, cost = 5)

        val ready: Instant? = readyMinuteOf(listOf(foodNeed), readAt)

        assertEquals(Instant.parse("2026-11-12T10:14:00Z"), ready)
    }

    @Test
    fun `leaves out a resource the read already holds`() {
        val heldNeed: ResourceNeed = needOf(amount = 50, ratePerHour = 0.0, cost = 10)
        val shortNeed: ResourceNeed = needOf(amount = 0, ratePerHour = 60.0, cost = 5)

        val ready: Instant? = readyMinuteOf(listOf(heldNeed, shortNeed), readAt)

        assertEquals(Instant.parse("2026-11-12T10:05:00Z"), ready)
    }

    @Test
    fun `rounds a read with seconds up to the next minute`() {
        val readWithSeconds: Instant = Instant.parse("2026-11-12T10:00:30Z")
        val foodNeed: ResourceNeed = needOf(amount = 0, ratePerHour = 60.0, cost = 10)

        val ready: Instant? = readyMinuteOf(listOf(foodNeed), readWithSeconds)

        assertEquals(Instant.parse("2026-11-12T10:11:00Z"), ready)
    }

    @Test
    fun `names no minute for a rate of 0`() {
        val stalledNeed: ResourceNeed = needOf(amount = 0, ratePerHour = 0.0, cost = 10)
        val shortNeed: ResourceNeed = needOf(amount = 0, ratePerHour = 60.0, cost = 5)

        val ready: Instant? = readyMinuteOf(listOf(stalledNeed, shortNeed), readAt)

        assertNull(ready)
    }

    @Test
    fun `names no minute for a cost above the capacity`() {
        val cappedNeed: ResourceNeed = needOf(amount = 0, ratePerHour = 60.0, cost = 150, capacity = 100)

        val ready: Instant? = readyMinuteOf(listOf(cappedNeed), readAt)

        assertNull(ready)
    }

    private fun needOf(amount: Long, ratePerHour: Double, cost: Long, capacity: Long = 900): ResourceNeed =
        ResourceNeed(ResourceStock(amount = amount, ratePerHour = ratePerHour, capacity = capacity), cost = cost)
}
