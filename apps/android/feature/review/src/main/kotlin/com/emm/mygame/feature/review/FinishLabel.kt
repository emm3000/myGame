package com.emm.mygame.feature.review

import android.text.format.DateFormat
import com.emm.mygame.core.projection.FinishClock
import com.emm.mygame.core.projection.finishClockOf
import com.emm.mygame.core.ui.CopyReader
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Instant

private val clockFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

private fun dayFormatIn(locale: Locale): DateTimeFormatter =
    DateTimeFormatter.ofPattern(DateFormat.getBestDateTimePattern(locale, "MMMd"), locale)

internal fun CopyReader.finishLabelOf(remaining: Duration, finishesAt: Instant, zone: ZoneId): String {
    val countdown: String = countdownLabelOf(remaining)
    if (remaining <= 1.hours) return countdown
    val finish: FinishClock = finishClockOf(finishesAt, remaining, zone)
    return text(R.string.finish_with_clock, "countdown" to countdown, "clock" to clockLabelOf(finish))
}

private fun CopyReader.clockLabelOf(finish: FinishClock): String {
    val time: String = finish.at.format(clockFormat)
    return when (finish.day) {
        FinishClock.Day.Today -> time
        FinishClock.Day.Tomorrow -> text(R.string.finish_tomorrow, "time" to time)
        FinishClock.Day.Later -> text(
            R.string.finish_day,
            "day" to finish.at.format(dayFormatIn(locale)),
            "time" to time,
        )
    }
}
