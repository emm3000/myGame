package com.emm.mygame.core.projection

import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.Parameterized

@RunWith(Parameterized::class)
class LevyDeliveryTest(private val case: LevyDeliveryCase) {

    @Test
    fun `delivers the units the domain delivers`() {
        val delivered: Int = deliveredUnitsAt(
            startedAt = case.startedAt,
            perUnit = case.perUnit,
            count = case.count,
            now = case.at,
        )

        assertEquals(case.name, case.expectedDelivered, delivered)
    }

    companion object {
        @JvmStatic
        @Parameterized.Parameters(name = "{0}")
        fun cases(): List<Array<Any>> = readLevyDeliveryCases().map { case: LevyDeliveryCase -> arrayOf(case) }
    }
}
