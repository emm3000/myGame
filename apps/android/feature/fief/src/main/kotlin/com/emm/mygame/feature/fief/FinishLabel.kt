package com.emm.mygame.feature.fief

import androidx.compose.runtime.Composable
import com.emm.mygame.core.projection.FinishClock
import com.emm.mygame.core.projection.finishClockOf
import com.emm.mygame.core.ui.icuStringResource
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Instant

@Composable
internal fun finishLabelOf(remaining: Duration, finishesAt: Instant): String {
    val countdown: String = countdownLabelOf(remaining)
    if (remaining <= 1.hours) return countdown
    val finish: FinishClock = finishClockOf(finishesAt, remaining, ZoneId.systemDefault())
    return icuStringResource(R.string.finish_with_clock, "countdown" to countdown, "clock" to clockLabelOf(finish))
}

@Composable
internal fun clockLabelOf(finish: FinishClock): String {
    val time: String = finish.at.format(clockFormat)
    return when (finish.day) {
        FinishClock.Day.Today -> time
        FinishClock.Day.Tomorrow -> icuStringResource(R.string.finish_tomorrow, "time" to time)
        FinishClock.Day.Later -> icuStringResource(
            R.string.finish_day,
            "day" to finish.at.format(dayFormat),
            "time" to time,
        )
    }
}

private val clockFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

private val dayFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("d MMM", spanish)
