package com.emm.mygame

import android.app.AlarmManager
import kotlin.time.Clock
import kotlin.time.Instant
import org.robolectric.shadows.ShadowAlarmManager

internal data class SeenAlarm(val type: Int, val at: Instant, val isAllowedWhileIdle: Boolean)

internal fun wakeUpAt(at: String): SeenAlarm =
    SeenAlarm(type = AlarmManager.RTC_WAKEUP, at = Instant.parse(at), isAllowedWhileIdle = true)

internal fun seenAlarmOf(alarm: ShadowAlarmManager.ScheduledAlarm): SeenAlarm = SeenAlarm(
    type = alarm.type,
    at = Instant.fromEpochMilliseconds(alarm.triggerAtMs),
    isAllowedWhileIdle = alarm.isAllowWhileIdle,
)

internal fun clockAt(at: Instant): Clock = object : Clock {
    override fun now(): Instant = at
}
