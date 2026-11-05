package com.emm.mygame.core.projection

import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Test

class FinishClockTest {

    private val madrid: ZoneId = ZoneId.of("Europe/Madrid")

    @Test
    fun `dates a finish later the same day as today`() {
        val finish: FinishClock = finishClockOf(
            finishesAt = Instant.parse("2026-11-02T14:10:00Z"),
            remaining = 2.hours,
            zone = madrid,
        )

        assertEquals(FinishClock(FinishClock.Day.Today, LocalDateTime.parse("2026-11-02T15:10")), finish)
    }

    @Test
    fun `dates a finish past local midnight as tomorrow`() {
        val finish: FinishClock = finishClockOf(
            finishesAt = Instant.parse("2026-11-02T23:30:00Z"),
            remaining = 90.minutes,
            zone = madrid,
        )

        assertEquals(FinishClock(FinishClock.Day.Tomorrow, LocalDateTime.parse("2026-11-03T00:30")), finish)
    }

    @Test
    fun `dates a finish beyond tomorrow by its day`() {
        val finish: FinishClock = finishClockOf(
            finishesAt = Instant.parse("2026-11-04T09:00:00Z"),
            remaining = 40.hours,
            zone = madrid,
        )

        assertEquals(FinishClock(FinishClock.Day.Later, LocalDateTime.parse("2026-11-04T10:00")), finish)
    }
}
