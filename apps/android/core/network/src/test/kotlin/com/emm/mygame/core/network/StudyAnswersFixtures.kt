package com.emm.mygame.core.network

import com.emm.mygame.core.network.account.PlayerLanguages
import com.emm.mygame.core.network.platform.ApiEndpoint
import com.emm.mygame.core.network.platform.ApiRepositories
import com.emm.mygame.core.network.platform.SessionEnds
import com.emm.mygame.core.network.platform.TokenStore
import com.emm.mygame.core.network.reminder.StudyAnswers
import com.emm.mygame.core.testing.FakeStudyAnswerSink
import com.emm.mygame.core.testing.TestClock
import kotlin.time.Clock
import kotlin.time.Instant
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.UnconfinedTestDispatcher

fun discardedStudyAnswers(store: TokenStore): StudyAnswers = StudyAnswers(store, FakeStudyAnswerSink())

internal fun TestScope.apiRepositories(
    endpoint: ApiEndpoint,
    tokenStore: TokenStore,
    languages: PlayerLanguages = PlayerLanguages(tokenStore, onNamed = {}),
    sessionEnds: SessionEnds = SessionEnds(),
    studyAnswers: StudyAnswers = discardedStudyAnswers(tokenStore),
    clock: Clock = TestClock(testScheduler, Instant.parse("2026-11-05T10:00:00Z")),
): ApiRepositories =
    ApiRepositories(
        endpoint = endpoint,
        tokenStore = tokenStore,
        languages = languages,
        sessionEnds = sessionEnds,
        studyAnswers = studyAnswers,
        ioDispatcher = UnconfinedTestDispatcher(testScheduler),
        clock = clock,
    )
