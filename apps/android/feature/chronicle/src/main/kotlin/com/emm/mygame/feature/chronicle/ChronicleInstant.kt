package com.emm.mygame.feature.chronicle

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.time.Instant

internal data class ChronicleInstant(val day: Day, val at: LocalDateTime) {

    enum class Day { Today, ThisYear, EarlierYear }
}

internal fun chronicleInstantOf(occurredAt: Instant, readAt: Instant, zone: ZoneId): ChronicleInstant {
    val occurred: LocalDateTime = localOf(occurredAt, zone)
    val today: LocalDate = localOf(readAt, zone).toLocalDate()
    val day: ChronicleInstant.Day = when {
        occurred.toLocalDate() == today -> ChronicleInstant.Day.Today
        occurred.year == today.year -> ChronicleInstant.Day.ThisYear
        else -> ChronicleInstant.Day.EarlierYear
    }
    return ChronicleInstant(day = day, at = occurred)
}

private fun localOf(instant: Instant, zone: ZoneId): LocalDateTime =
    LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(instant.toEpochMilliseconds()), zone)
