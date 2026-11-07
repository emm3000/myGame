package com.emm.mygame.feature.school

import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.TestClock
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent

internal val homeWord: TownSnapshot.WordReading =
    TownSnapshot.WordReading("home", "hogar", "This is my home.")

internal val waterWord: TownSnapshot.WordReading =
    TownSnapshot.WordReading("water", "agua", "I drink water.")

internal val farmWord: TownSnapshot.WordReading =
    TownSnapshot.WordReading("farm", "granja", "The farm is big.")

internal fun readReportOf(readFirst: List<LessonId> = emptyList()): ReportReadResult =
    ReportReadResult.Read(TownReport(dueCount = 0, readFirst = readFirst, nextDueAt = null, news = emptyList()))

internal fun readingOf(viewModel: LessonWordsViewModel): LessonWordsUiState.Reading =
    viewModel.state.value as LessonWordsUiState.Reading

internal fun TestScope.lessonWordsViewModelOf(
    towns: FakeTownRepository,
    reports: FakeReportRepository,
    lesson: LessonId = firstLesson,
    walked: List<LessonId> = emptyList(),
    start: Instant = readInstant,
): LessonWordsViewModel {
    val clock: TestClock = TestClock(testScheduler, start)
    val viewModel: LessonWordsViewModel = LessonWordsViewModel(LessonWalk(lesson, walked), towns, reports, clock)
    backgroundScope.launch(start = CoroutineStart.UNDISPATCHED) {
        try {
            awaitCancellation()
        } finally {
            viewModel.viewModelScope.cancel()
        }
    }
    return viewModel
}

internal fun TestScope.lessonWordsReadingFrom(
    towns: FakeTownRepository,
    reports: FakeReportRepository,
    town: TownSnapshot,
    readFirst: List<LessonId> = emptyList(),
    walked: List<LessonId> = emptyList(),
): LessonWordsViewModel {
    towns.answerRead(TownReadResult.Read(town))
    reports.answerRead(readReportOf(readFirst))
    val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, reports, walked = walked)
    runCurrent()
    return viewModel
}
