package com.emm.mygame.core.projection

import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.Parameterized

@RunWith(Parameterized::class)
class SharedReadyMinuteCasesTest(private val case: ReadyMinuteCase) {

    @Test
    fun `names the ready minute the web names`() {
        val ready: Instant? = readyMinuteOf(case.needs, case.readAt)

        assertEquals(case.name, case.expectedReady, ready)
    }

    companion object {
        @JvmStatic
        @Parameterized.Parameters(name = "{0}")
        fun cases(): List<Array<Any>> = readReadyMinuteCases().map { case: ReadyMinuteCase -> arrayOf(case) }
    }
}
