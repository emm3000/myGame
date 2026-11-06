package com.emm.mygame.feature.report

import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownNews
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.TestClock
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent

internal val readInstant: Instant = Instant.parse("2026-11-05T09:10:00Z")

internal val finishedFarm: TownNews =
    TownNews.BuildingWorkFinished(readInstant, TownBuildingKind.Farm, level = 2)

internal val stoppedLesson: TownNews = TownNews.LessonStopped(readInstant)

internal val unreadLesson: LessonId = LessonId("lesson-2")

internal val laterUnreadLesson: LessonId = LessonId("lesson-3")

internal fun reportOf(
    dueCount: Int = 0,
    news: List<TownNews> = emptyList(),
    readFirst: List<LessonId> = emptyList(),
): TownReport = TownReport(dueCount = dueCount, readFirst = readFirst, news = news)

internal fun contentOf(viewModel: ReportViewModel): ReportUiState.Content =
    viewModel.state.value as ReportUiState.Content

internal fun unreadOf(viewModel: ReportViewModel): ReportUiState.ReportNews.Unread =
    contentOf(viewModel).news as ReportUiState.ReportNews.Unread

internal fun TestScope.reportViewModelOf(reports: FakeReportRepository): ReportViewModel {
    val viewModel: ReportViewModel = ReportViewModel(reports, TestClock(testScheduler, readInstant))
    backgroundScope.launch(start = CoroutineStart.UNDISPATCHED) {
        try {
            awaitCancellation()
        } finally {
            viewModel.viewModelScope.cancel()
        }
    }
    return viewModel
}

internal fun TestScope.reportReadingFrom(reports: FakeReportRepository, report: TownReport): ReportViewModel {
    reports.answerRead(ReportReadResult.Read(report))
    val viewModel: ReportViewModel = reportViewModelOf(reports)
    runCurrent()
    return viewModel
}
