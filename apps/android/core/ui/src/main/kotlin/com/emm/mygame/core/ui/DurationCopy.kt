package com.emm.mygame.core.ui

import androidx.annotation.StringRes
import com.emm.mygame.core.projection.FinishClock
import com.emm.mygame.core.projection.finishClockOf
import java.time.ZoneId
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant

private const val SECONDS_PER_MINUTE: Long = 60

private const val SECONDS_PER_HOUR: Long = 3600

data class DurationCopy(
    @StringRes val minutesSeconds: Int,
    @StringRes val hours: Int,
    @StringRes val hoursMinutes: Int,
    @StringRes val minutes: Int,
    @StringRes val finishWithClock: Int,
    @StringRes val finishTomorrow: Int,
    @StringRes val finishDay: Int,
)

fun CopyReader.durationLabelOf(duration: Duration, copy: DurationCopy): String {
    val whole: Long = wholeSecondsOf(duration)
    val hours: Long = whole / SECONDS_PER_HOUR
    val minutes: Long = whole % SECONDS_PER_HOUR / SECONDS_PER_MINUTE
    return when {
        hours == 0L -> text(
            copy.minutesSeconds,
            "minutes" to minutes.toString(),
            "seconds" to (whole % SECONDS_PER_MINUTE).toString().padStart(2, '0'),
        )
        minutes == 0L -> text(copy.hours, "hours" to hours.toString())
        else -> text(copy.hoursMinutes, "hours" to hours.toString(), "minutes" to minutes.toString())
    }
}

fun CopyReader.timeLeftLabelOf(remaining: Duration, copy: DurationCopy): String {
    val whole: Long = wholeSecondsOf(remaining)
    if (whole < SECONDS_PER_MINUTE || whole >= SECONDS_PER_HOUR) return durationLabelOf(whole.seconds, copy)
    return text(copy.minutes, "minutes" to (whole / SECONDS_PER_MINUTE).toString())
}

fun CopyReader.finishLabelOf(remaining: Duration, finishesAt: Instant, copy: DurationCopy): String {
    val timeLeft: String = timeLeftLabelOf(remaining, copy)
    if (wholeSecondsOf(remaining).seconds <= 1.hours) return timeLeft
    val finish: FinishClock = finishClockOf(finishesAt, remaining, ZoneId.systemDefault())
    return text(copy.finishWithClock, "timeLeft" to timeLeft, "clock" to finishClockLabelOf(finish, copy))
}

fun CopyReader.titledFinishLabelOf(
    @StringRes title: Int,
    remaining: Duration,
    finishesAt: Instant,
    copy: DurationCopy,
): String = "${text(title)} ${finishLabelOf(remaining, finishesAt, copy)}"

fun CopyReader.finishClockLabelOf(finish: FinishClock, copy: DurationCopy): String =
    clockLabelOf(finish, tomorrow = copy.finishTomorrow, later = copy.finishDay)
