package com.emm.mygame.core.projection

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.time.Duration
import kotlin.time.Instant

data class FinishClock(val day: Day, val at: LocalDateTime) {

    enum class Day { Today, Tomorrow, Later }
}

fun finishClockOf(finishesAt: Instant, remaining: Duration, zone: ZoneId): FinishClock {
    val finish: LocalDateTime = localOf(finishesAt, zone)
    val today: LocalDate = localOf(finishesAt - remaining, zone).toLocalDate()
    val day: FinishClock.Day = when (finish.toLocalDate()) {
        today -> FinishClock.Day.Today
        today.plusDays(1) -> FinishClock.Day.Tomorrow
        else -> FinishClock.Day.Later
    }
    return FinishClock(day = day, at = finish)
}

private fun localOf(instant: Instant, zone: ZoneId): LocalDateTime =
    LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(instant.toEpochMilliseconds()), zone)
