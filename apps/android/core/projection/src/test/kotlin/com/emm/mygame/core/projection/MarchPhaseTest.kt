package com.emm.mygame.core.projection

import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Test

class MarchPhaseTest {

    private val arrivesAt: Instant = Instant.fromEpochMilliseconds(600_000)

    private val leavesAt: Instant = arrivesAt + 60.minutes

    @Test
    fun `marches outbound until the arrival`() {
        assertEquals(
            MarchPhase.Outbound,
            marchPhaseAt(arrivesAt = arrivesAt, leavesAt = leavesAt, now = arrivesAt - 1.milliseconds),
        )
    }

    @Test
    fun `turns from outbound to foraging at the arrival`() {
        assertEquals(MarchPhase.Foraging, marchPhaseAt(arrivesAt = arrivesAt, leavesAt = leavesAt, now = arrivesAt))
    }

    @Test
    fun `turns from foraging to returning at the leaving`() {
        assertEquals(MarchPhase.Returning, marchPhaseAt(arrivesAt = arrivesAt, leavesAt = leavesAt, now = leavesAt))
    }

    @Test
    fun `returns at once from a march that leaves on its arrival`() {
        assertEquals(MarchPhase.Returning, marchPhaseAt(arrivesAt = arrivesAt, leavesAt = arrivesAt, now = arrivesAt))
    }

    @Test
    fun `counts down to the arrival while outbound`() {
        assertEquals(
            5.minutes,
            nextMarchTurnAt(arrivesAt = arrivesAt, leavesAt = leavesAt, now = arrivesAt - 5.minutes),
        )
    }

    @Test
    fun `counts down to the leaving while foraging`() {
        assertEquals(
            50.minutes,
            nextMarchTurnAt(arrivesAt = arrivesAt, leavesAt = leavesAt, now = arrivesAt + 10.minutes),
        )
    }

    @Test
    fun `has no turn left while returning`() {
        assertEquals(null, nextMarchTurnAt(arrivesAt = arrivesAt, leavesAt = leavesAt, now = leavesAt))
    }
}
