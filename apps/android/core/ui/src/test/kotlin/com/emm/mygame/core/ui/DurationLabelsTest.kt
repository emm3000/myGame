package com.emm.mygame.core.ui

import com.emm.mygame.core.ui.test.R
import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class DurationLabelsTest {

    private val durations: DurationCopy = DurationCopy(
        minutesSeconds = R.string.core_ui_test_duration_minutes_seconds,
        hours = R.string.core_ui_test_duration_hours,
        hoursMinutes = R.string.core_ui_test_duration_hours_minutes,
        minutes = R.string.core_ui_test_duration_minutes,
        finishWithClock = R.string.core_ui_test_finish_with_clock,
        finishTomorrow = R.string.core_ui_test_finish_tomorrow,
        finishDay = R.string.core_ui_test_finish_day,
    )

    private val english: PlayerCopy =
        PlayerCopy(RuntimeEnvironment.getApplication(), CopyLanguage(ScaffoldLanguage.None, ChromePhase.Scaffold))

    private val morning: LocalDateTime = LocalDateTime.of(2026, 11, 8, 9, 0)

    private val lateEvening: LocalDateTime = LocalDateTime.of(2026, 11, 8, 23, 0)

    private fun instantOf(local: LocalDateTime): Instant =
        Instant.fromEpochMilliseconds(local.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli())

    private fun durationOf(duration: Duration): String = english.fixedCopy { durationLabelOf(duration, durations) }

    private fun finishOf(remaining: Duration, from: LocalDateTime): String =
        english.fixedCopy { finishLabelOf(remaining, instantOf(from) + remaining, durations) }

    @Test
    fun `writes a length under an hour in minutes and seconds`() {
        assertEquals("5:00", durationOf(5.minutes))
    }

    @Test
    fun `rounds a part of a second up`() {
        assertEquals("0:05", durationOf(4.seconds + 200.milliseconds))
    }

    @Test
    fun `writes a length of whole hours in hours alone`() {
        assertEquals("2 h", durationOf(2.hours))
    }

    @Test
    fun `writes a length of hours and minutes in both`() {
        assertEquals("1 h 20 min", durationOf(1.hours + 20.minutes))
    }

    @Test
    fun `reads a time left under a minute in minutes and seconds`() {
        assertEquals("0:45", english.fixedCopy { timeLeftLabelOf(45.seconds, durations) })
    }

    @Test
    fun `reads a time left within the hour in whole minutes`() {
        assertEquals("40 min", english.fixedCopy { timeLeftLabelOf(40.minutes + 30.seconds, durations) })
    }

    @Test
    fun `reads a time left within the hour alone`() {
        assertEquals("40 min", finishOf(40.minutes, morning))
    }

    @Test
    fun `reads a time left of exactly an hour alone`() {
        assertEquals("1 h", finishOf(1.hours, morning))
    }

    @Test
    fun `carries the clock on a longer time left that ends today`() {
        assertEquals("2 h · 11:00 AM", finishOf(2.hours, morning))
    }

    @Test
    fun `carries tomorrow and the clock on a longer time left that ends tomorrow`() {
        assertEquals("1 h 30 min · tomorrow 12:30 AM", finishOf(1.hours + 30.minutes, lateEvening))
    }

    @Test
    fun `carries the day and the clock on a longer time left that ends after tomorrow`() {
        assertEquals("49 h · Nov 10 10:00 AM", finishOf(49.hours, morning))
    }
}
