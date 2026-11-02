package com.emm.mygame.feature.fief

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Instant

@Composable
internal fun finishLabelOf(remaining: Duration, finishesAt: Instant): String {
    val countdown: String = countdownLabelOf(remaining)
    if (remaining <= 1.hours) return countdown
    val finish: FinishClock = finishClockOf(finishesAt, remaining, ZoneId.systemDefault())
    return stringResource(R.string.finish_with_clock, countdown, clockLabelOf(finish))
}

@Composable
private fun clockLabelOf(finish: FinishClock): String {
    val time: String = finish.at.format(clockFormat)
    return when (finish.day) {
        FinishClock.Day.Today -> time
        FinishClock.Day.Tomorrow -> stringResource(R.string.finish_tomorrow, time)
        FinishClock.Day.Later -> stringResource(R.string.finish_day, finish.at.format(dayFormat), time)
    }
}

private val clockFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

private val dayFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("d MMM", Locale.forLanguageTag("es"))
