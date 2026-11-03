package com.emm.mygame.core.projection

import kotlin.time.Duration
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.Parameterized

@RunWith(Parameterized::class)
class MarchPhaseTest(private val case: MarchPhaseCase) {

    @Test
    fun `reads the phase the domain reads`() {
        val phase: MarchPhase = marchPhaseAt(arrivesAt = case.arrivesAt, leavesAt = case.leavesAt, now = case.at)

        assertEquals(case.name, case.expectedPhase, phase)
    }

    @Test
    fun `counts down to the instant that ends the phase`() {
        val untilNextTurn: Duration? = nextMarchTurnAt(
            arrivesAt = case.arrivesAt,
            leavesAt = case.leavesAt,
            now = case.at,
        )

        assertEquals(case.name, case.expectedNextTurn, untilNextTurn)
    }

    companion object {
        @JvmStatic
        @Parameterized.Parameters(name = "{0}")
        fun cases(): List<Array<Any>> = readMarchPhaseCases().map { case: MarchPhaseCase -> arrayOf(case) }
    }
}
