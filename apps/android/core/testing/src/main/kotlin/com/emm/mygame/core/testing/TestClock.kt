package com.emm.mygame.core.testing

import kotlin.time.Clock
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Instant
import kotlinx.coroutines.test.TestCoroutineScheduler

class TestClock(private val scheduler: TestCoroutineScheduler, private val start: Instant) : Clock {

    override fun now(): Instant = start + scheduler.currentTime.milliseconds
}
