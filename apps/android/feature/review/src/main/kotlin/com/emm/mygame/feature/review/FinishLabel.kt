package com.emm.mygame.feature.review

import com.emm.mygame.core.projection.FinishClock
import com.emm.mygame.core.projection.finishClockOf
import com.emm.mygame.core.ui.CopyReader
import java.time.ZoneId
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Instant

internal fun CopyReader.finishLabelOf(remaining: Duration, finishesAt: Instant, zone: ZoneId): String {
    val countdown: String = countdownLabelOf(remaining)
    if (remaining <= 1.hours) return countdown
    val finish: FinishClock = finishClockOf(finishesAt, remaining, zone)
    return text(R.string.finish_with_clock, "countdown" to countdown, "clock" to finishClockLabelOf(finish))
}

private fun CopyReader.finishClockLabelOf(finish: FinishClock): String =
    clockLabelOf(finish, tomorrow = R.string.finish_tomorrow, later = R.string.finish_day)
