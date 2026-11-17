package com.emm.mygame.core.network

import com.emm.mygame.core.testing.FakeStudyAnswerSink
import com.emm.mygame.core.testing.TestClock
import kotlin.time.Instant
import kotlinx.coroutines.test.TestScope

fun TestScope.discardedStudyAnswers(store: TokenStore): StudyAnswers =
    StudyAnswers(store, FakeStudyAnswerSink(), TestClock(testScheduler, Instant.parse("2026-11-05T10:00:00Z")))
