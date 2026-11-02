package com.emm.mygame.core.projection

import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.Parameterized

@RunWith(Parameterized::class)
class SharedProjectionCasesTest(private val case: ProjectionCase) {

    @Test
    fun `draws the amount the domain materializes`() {
        val drawn: Long = case.stock.amountAt(readAt = case.readAt, now = case.now)

        assertEquals(case.name, case.expectedAmount, drawn)
    }

    companion object {
        @JvmStatic
        @Parameterized.Parameters(name = "{0}")
        fun cases(): List<Array<Any>> = readProjectionCases().map { case: ProjectionCase -> arrayOf(case) }
    }
}
