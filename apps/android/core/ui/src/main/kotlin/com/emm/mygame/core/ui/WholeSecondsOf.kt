package com.emm.mygame.core.ui

import kotlin.math.ceil
import kotlin.time.Duration
import kotlin.time.DurationUnit

fun wholeSecondsOf(duration: Duration): Long = ceil(duration.toDouble(DurationUnit.SECONDS)).toLong()
