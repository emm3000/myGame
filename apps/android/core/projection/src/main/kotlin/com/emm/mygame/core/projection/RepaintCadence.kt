package com.emm.mygame.core.projection

import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds

private val amountsCadence: Duration = 1.minutes
private val lastMinuteCadence: Duration = 1.seconds

fun repaintDelay(slotRemaining: Duration?): Duration = when {
    slotRemaining == null -> amountsCadence
    slotRemaining <= amountsCadence -> lastMinuteCadence
    else -> minOf(amountsCadence, slotRemaining - amountsCadence)
}
