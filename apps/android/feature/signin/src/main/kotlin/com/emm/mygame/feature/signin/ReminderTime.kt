package com.emm.mygame.feature.signin

import java.time.LocalTime
import java.time.temporal.ChronoUnit

private const val MINUTE_STEP: Int = 5

internal fun LocalTime.stepped(step: ReminderStep): LocalTime {
    val minute: LocalTime = truncatedTo(ChronoUnit.MINUTES)
    val offGrid: Int = minute.minute % MINUTE_STEP
    return when (step) {
        ReminderStep.HourEarlier -> minute.minusHours(1)
        ReminderStep.HourLater -> minute.plusHours(1)
        ReminderStep.MinutesEarlier -> minute.minusMinutes(if (offGrid == 0) MINUTE_STEP.toLong() else offGrid.toLong())
        ReminderStep.MinutesLater -> minute.plusMinutes((MINUTE_STEP - offGrid).toLong())
    }
}
