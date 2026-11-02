package com.emm.mygame.core.projection

import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import org.junit.Assert.assertEquals
import org.junit.Test

class RepaintCadenceTest {

    @Test
    fun `repaints once a minute while no build is running`() {
        assertEquals(1.minutes, repaintDelay(slotRemaining = null))
    }

    @Test
    fun `repaints once a minute while the build has more than a minute left`() {
        assertEquals(1.minutes, repaintDelay(slotRemaining = 3.hours))
    }

    @Test
    fun `repaints at the start of the last minute of the build`() {
        assertEquals(30.seconds, repaintDelay(slotRemaining = 90.seconds))
    }

    @Test
    fun `repaints every second in the last minute of the build`() {
        assertEquals(1.seconds, repaintDelay(slotRemaining = 60.seconds))
        assertEquals(1.seconds, repaintDelay(slotRemaining = 1.seconds))
    }

    @Test
    fun `waits a minute once the build is over before asking the api again`() {
        assertEquals(1.minutes, repaintDelay(slotRemaining = Duration.ZERO))
    }
}
