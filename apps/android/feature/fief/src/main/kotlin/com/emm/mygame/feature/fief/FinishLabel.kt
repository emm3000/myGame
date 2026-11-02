package com.emm.mygame.feature.fief

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Instant

@Composable
internal fun finishLabelOf(remaining: Duration, finishesAt: Instant): String {
    val countdown: String = countdownLabelOf(remaining)
    if (remaining <= 1.hours) return countdown
    return stringResource(R.string.finish_with_clock, countdown, clockLabelOf(remaining, finishesAt))
}

@Composable
private fun clockLabelOf(remaining: Duration, finishesAt: Instant): String {
    val zone: ZoneId = ZoneId.systemDefault()
    val finish: ZonedDateTime = zonedOf(finishesAt, zone)
    val today: ZonedDateTime = zonedOf(finishesAt - remaining, zone)
    val time: String = finish.format(clockFormat)
    return when (finish.toLocalDate()) {
        today.toLocalDate() -> time
        today.toLocalDate().plusDays(1) -> stringResource(R.string.finish_tomorrow, time)
        else -> stringResource(R.string.finish_day, finish.format(dayFormat), time)
    }
}

private fun zonedOf(instant: Instant, zone: ZoneId): ZonedDateTime =
    ZonedDateTime.ofInstant(java.time.Instant.ofEpochMilli(instant.toEpochMilliseconds()), zone)

private val clockFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

private val dayFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("d MMM", Locale.forLanguageTag("es"))
