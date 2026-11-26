package com.emm.mygame.core.testing

import kotlin.time.Clock
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Instant
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.TestCoroutineScheduler

@OptIn(ExperimentalCoroutinesApi::class)
class TestClock(private val scheduler: TestCoroutineScheduler, private val start: Instant) : Clock {

    override fun now(): Instant = start + scheduler.currentTime.milliseconds
}
