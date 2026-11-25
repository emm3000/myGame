package com.emm.mygame.feature.report

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.model.town.HeldTown
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import com.emm.mygame.core.testing.townOf
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ReportAwaitedReadViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val reports: FakeReportRepository = FakeReportRepository()

    private val towns: FakeTownRepository = FakeTownRepository()

    private fun TestScope.reportReading(report: TownReport): ReportViewModel = reportReadingFrom(reports, report)

    private fun holdLessonFinishing(
        finishesAt: Instant,
        gap: Duration = Duration.ZERO,
        lesson: LessonId = firstLesson,
        startedAt: Instant = readInstant,
        readAt: Instant = readInstant,
    ) {
        val slot: TownSnapshot.LessonSlot = TownSnapshot.LessonSlot(lesson, startedAt, finishesAt)
        towns.hold(HeldTown(townOf(readAt = readAt, lessonSlot = slot), gap))
    }

    @Test
    fun `carries the next review's instant to the screen`() = runTest {
        val viewModel: ReportViewModel = reportReading(reportOf(nextDueAt = readInstant + 5.minutes))

        assertEquals(readInstant + 5.minutes, contentOf(viewModel).nextReview)
    }

    @Test
    fun `reads the Report at nextDueAt with no review due`() = runTest {
        reportReading(reportOf(nextDueAt = readInstant + 5.minutes))
        reports.answerRead(ReportReadResult.Read(reportOf(dueCount = 2)))

        advanceTimeBy(5.minutes)
        runCurrent()

        assertEquals(2, reports.readCount)
    }

    @Test
    fun `reads nothing at nextDueAt while reviews are due`() = runTest {
        reportReading(reportOf(dueCount = 1, nextDueAt = readInstant + 5.minutes))

        advanceTimeBy(1.hours)
        runCurrent()

        assertEquals(1, reports.readCount)
    }

    @Test
    fun `re-reads once at nextDueAt when the device clock runs ahead`() = runTest {
        val dueAt: Instant = readInstant + 5.minutes
        val stillAhead: ReportReadResult = ReportReadResult.Read(reportOf(nextDueAt = dueAt))
        repeat(times = 5) { reports.answerRead(stillAhead) }
        reportViewModelOf(reports, start = readInstant + 2.minutes)
        runCurrent()

        advanceTimeBy(1.hours)
        runCurrent()

        assertEquals(2, reports.readCount)
    }

    @Test
    fun `waits for nextDueAt no longer while the screen is hidden`() = runTest {
        val viewModel: ReportViewModel = reportReading(reportOf(nextDueAt = readInstant + 5.minutes))

        viewModel.onIntent(ReportIntent.ScreenHidden)
        advanceTimeBy(1.hours)
        runCurrent()

        assertEquals(1, reports.readCount)
    }

    @Test
    fun `the Report reads itself again when the running lesson finishes`() = runTest {
        holdLessonFinishing(finishesAt = readInstant + 4.minutes)
        val viewModel: ReportViewModel = reportReadingFrom(reports, reportOf(), towns)
        reports.answerRead(ReportReadResult.Read(reportOf(dueCount = 5)))

        advanceTimeBy(4.minutes)
        runCurrent()
        advanceTimeBy(1.hours)
        runCurrent()

        assertEquals(5, contentOf(viewModel).dueCount)
        assertEquals(2, reports.readCount)
    }

    @Test
    fun `waits for the lesson finish on the device clock, the held gap taken off`() = runTest {
        holdLessonFinishing(finishesAt = readInstant + 6.minutes, gap = 2.minutes)
        reportReadingFrom(reports, reportOf(), towns)
        reports.answerRead(ReportReadResult.Read(reportOf(dueCount = 5)))

        advanceTimeBy(4.minutes - 1.seconds)
        runCurrent()
        val readsBeforeTheFinish: Int = reports.readCount
        advanceTimeBy(1.seconds)
        runCurrent()

        assertEquals(1, readsBeforeTheFinish)
        assertEquals(2, reports.readCount)
    }

    @Test
    fun `waits for the lesson finish no longer while the screen is hidden`() = runTest {
        holdLessonFinishing(finishesAt = readInstant + 4.minutes)
        val viewModel: ReportViewModel = reportReadingFrom(reports, reportOf(), towns)
        reports.answerRead(ReportReadResult.Read(reportOf(dueCount = 5)))

        viewModel.onIntent(ReportIntent.ScreenHidden)
        advanceTimeBy(5.minutes)
        runCurrent()
        val readsWhileHidden: Int = reports.readCount
        viewModel.onIntent(ReportIntent.ScreenShown)
        runCurrent()
        advanceTimeBy(1.hours)
        runCurrent()

        assertEquals(1, readsWhileHidden)
        assertEquals(2, reports.readCount)
    }

    @Test
    fun `waits again for a later lesson's finish`() = runTest {
        holdLessonFinishing(finishesAt = readInstant + 4.minutes)
        reportReadingFrom(reports, reportOf(), towns)
        repeat(times = 2) { reports.answerRead(ReportReadResult.Read(reportOf())) }

        advanceTimeBy(4.minutes)
        runCurrent()
        val readsAtTheFirstFinish: Int = reports.readCount
        holdLessonFinishing(
            finishesAt = readInstant + 10.minutes,
            lesson = secondLesson,
            startedAt = readInstant + 4.minutes,
            readAt = readInstant + 4.minutes,
        )
        runCurrent()
        advanceTimeBy(1.hours)
        runCurrent()

        assertEquals(2, readsAtTheFirstFinish)
        assertEquals(3, reports.readCount)
    }

    @Test
    fun `reads nothing more for a lesson finish already past when the screen opens`() = runTest {
        holdLessonFinishing(finishesAt = readInstant - 1.minutes, startedAt = readInstant - 5.minutes)
        reportReadingFrom(reports, reportOf(), towns)
        reports.answerRead(ReportReadResult.Read(reportOf()))

        advanceTimeBy(1.hours)
        runCurrent()

        assertEquals(1, reports.readCount)
    }

    private companion object {
        val firstLesson: LessonId = LessonId("lesson-1")

        val secondLesson: LessonId = LessonId("lesson-2")
    }
}
