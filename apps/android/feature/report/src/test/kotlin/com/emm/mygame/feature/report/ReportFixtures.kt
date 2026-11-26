package com.emm.mygame.feature.report

import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.news.TownNews
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.TestClock
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlin.time.Instant

internal val readInstant: Instant = Instant.parse("2026-11-05T09:10:00Z")

internal val finishedFarm: TownNews =
    TownNews.BuildingWorkFinished(readInstant, TownBuildingKind.Farm, level = 2)

internal val stoppedLesson: TownNews = TownNews.LessonStopped(readInstant)

internal val newsToClose: TownReport = reportOf(dueCount = 2, news = listOf(finishedFarm))

internal fun reportOf(
    dueCount: Int = 0,
    news: List<TownNews> = emptyList(),
    nextDueAt: Instant? = null,
): TownReport =
    TownReport(dueCount = dueCount, readFirst = emptyList(), nextDueAt = nextDueAt, news = news, readAt = readInstant)

internal fun contentOf(viewModel: ReportViewModel): ReportUiState.Content =
    viewModel.state.value as ReportUiState.Content

internal fun unreadOf(viewModel: ReportViewModel): ReportUiState.ReportNews.Unread =
    contentOf(viewModel).news as ReportUiState.ReportNews.Unread

internal fun TestScope.reportViewModelOf(
    reports: FakeReportRepository,
    start: Instant = readInstant,
    towns: FakeTownRepository = FakeTownRepository(),
): ReportViewModel {
    val viewModel: ReportViewModel = ReportViewModel(
        reports = reports,
        towns = towns,
        clock = TestClock(testScheduler, start),
    )
    backgroundScope.launch(start = CoroutineStart.UNDISPATCHED) {
        try {
            awaitCancellation()
        } finally {
            viewModel.viewModelScope.cancel()
        }
    }
    return viewModel
}

internal fun TestScope.reportReadingFrom(
    reports: FakeReportRepository,
    report: TownReport,
    towns: FakeTownRepository = FakeTownRepository(),
): ReportViewModel {
    reports.answerRead(ReportReadResult.Read(report))
    val viewModel: ReportViewModel = reportViewModelOf(reports, towns = towns)
    runCurrent()
    return viewModel
}
