package com.emm.mygame.feature.today

import app.cash.turbine.test
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.LessonName
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.school.TownLessonResult
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import com.emm.mygame.core.testing.TestClock
import com.emm.mygame.core.testing.lessonsDone
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds

class TodayViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    @Test
    fun `the first card is the lesson to study as sent`() = runTest {
        val viewModel: TodayViewModel = shownOn(newTown(nextStep = NextStep.LessonToStudy(firstLesson)))

        assertEquals(TodayUiState.FirstCard.Study(firstLesson, number = 1), contentOf(viewModel).first)
    }

    @Test
    fun `the first card is the reviews through the unread words first`() = runTest {
        val unreadFirst: NextStep = NextStep.Reviews(count = 4, readFirst = listOf(firstLesson))

        val viewModel: TodayViewModel = shownOn(newTown(nextStep = unreadFirst))

        assertEquals(TodayUiState.FirstCard.Reviews(count = 4, readFirst = firstLesson), contentOf(viewModel).first)
    }

    @Test
    fun `the eyebrow says Start here until the first lesson finishes`() = runTest {
        val viewModel: TodayViewModel = shownOn(newTown(nextStep = NextStep.LessonToStudy(firstLesson)))

        assertEquals(TodayUiState.Eyebrow.StartHere, contentOf(viewModel).eyebrow)
    }

    @Test
    fun `the eyebrow says What is next once the first lesson finished`() = runTest {
        val studied: TownSnapshot = newTown(nextStep = lessonsDone, isFirstLessonStudied = true)

        val viewModel: TodayViewModel = shownOn(studied)

        assertEquals(TodayUiState.Eyebrow.WhatIsNext, contentOf(viewModel).eyebrow)
    }

    @Test
    fun `caught up shows the time of the next review`() = runTest {
        val dueAt = readAt + 3.hours
        val caughtUp: TownSnapshot = newTown(nextStep = lessonsDone, isFirstLessonStudied = true, nextDueAt = dueAt)

        val viewModel: TodayViewModel = shownOn(caughtUp)

        assertEquals(
            TodayUiState.FirstCard.CaughtUp(
                line = TodayUiState.CaughtUpLine.NoReviewsDue,
                nextReview = TodayUiState.TimeAt(remaining = 3.hours, at = dueAt),
            ),
            contentOf(viewModel).first,
        )
    }

    @Test
    fun `a running lesson draws no first card`() = runTest {
        val viewModel: TodayViewModel = shownOn(runningTown())

        assertNull(contentOf(viewModel).first)
    }

    @Test
    fun `a running lesson's row in In progress counts down`() = runTest {
        val viewModel: TodayViewModel = shownOn(runningTown())

        advanceTimeBy(2.minutes)
        runCurrent()

        assertEquals(
            TodayUiState.RunningLesson(
                lesson = firstLesson,
                name = LessonName.Shelved(number = 1),
                remaining = 8.minutes,
                finishesAt = readAt + 10.minutes,
            ),
            contentOf(viewModel).lesson,
        )
    }

    @Test
    fun `a building work's row in In progress repaints each minute, then each second in its last minute`() = runTest {
        val viewModel: TodayViewModel = shownOn(newTown(nextStep = lessonsDone, work = farmWorkLasting(2.minutes)))

        val rows: List<TodayUiState.RunningWork?> = drawnDuring(viewModel, 62.seconds) { content -> content.work }

        assertEquals(
            listOf(2.minutes, 1.minutes, 59.seconds, 58.seconds).map { remaining: Duration ->
                TodayUiState.RunningWork(
                    building = TownBuildingKind.Farm,
                    level = 2,
                    remaining = remaining,
                    finishesAt = readAt + 2.minutes,
                )
            },
            rows,
        )
    }

    @Test
    fun `the job out's row in In progress counts down to its next phase, each second in its last minute`() = runTest {
        val viewModel: TodayViewModel = shownOn(newTown(nextStep = lessonsDone, job = jobOnTheWayLasting(2.minutes)))

        val rows: List<TodayUiState.JobOut?> = drawnDuring(viewModel, 62.seconds) { content -> content.job }

        assertEquals(
            listOf(2.minutes, 1.minutes, 59.seconds, 58.seconds).map { remaining: Duration ->
                TodayUiState.JobOut(
                    phase = TownSnapshot.JobPhase.Outbound,
                    remaining = remaining,
                    finishesAt = readAt + 2.minutes,
                )
            },
            rows,
        )
    }

    @Test
    fun `studying the lesson asks the api to start it`() = runTest {
        val viewModel: TodayViewModel = shownOn(newTown(nextStep = NextStep.LessonToStudy(firstLesson)))
        towns.answerLesson(TownLessonResult.Answered(runningTown()))

        viewModel.onIntent(TodayIntent.StudyTapped(firstLesson))
        runCurrent()

        assertEquals(listOf(firstLesson), towns.lessonStarts)
    }

    @Test
    fun `an unreachable read with no town held shows the error`() = runTest {
        val viewModel: TodayViewModel = shownOnUnreachable()

        assertEquals(TodayUiState.Failed, viewModel.state.value)
    }

    @Test
    fun `retrying after the error reads the town again`() = runTest {
        val viewModel: TodayViewModel = shownOnUnreachable()
        towns.answerRead(TownReadResult.Read(newTown(nextStep = NextStep.LessonToStudy(firstLesson))))

        viewModel.onIntent(TodayIntent.RetryTapped)
        runCurrent()

        assertEquals(TodayUiState.FirstCard.Study(firstLesson, number = 1), contentOf(viewModel).first)
    }

    @Test
    fun `a town with no name asks for the naming`() = runTest {
        towns.answerRead(TownReadResult.NoTown)
        val viewModel: TodayViewModel = TodayViewModel(towns, TestClock(testScheduler, readAt))
        stopsWithTheTest(viewModel)

        viewModel.effects.test {
            viewModel.onIntent(TodayIntent.ScreenShown)

            assertEquals(TodayEffect.NoTown, awaitItem())
        }
    }

    private fun TestScope.shownOn(town: TownSnapshot): TodayViewModel {
        towns.answerRead(TownReadResult.Read(town))
        val viewModel: TodayViewModel = TodayViewModel(towns, TestClock(testScheduler, readAt))
        stopsWithTheTest(viewModel)
        viewModel.onIntent(TodayIntent.ScreenShown)
        runCurrent()
        return viewModel
    }

    private fun TestScope.shownOnUnreachable(): TodayViewModel {
        towns.answerRead(TownReadResult.Unreachable)
        val viewModel: TodayViewModel = TodayViewModel(towns, TestClock(testScheduler, readAt))
        stopsWithTheTest(viewModel)
        viewModel.onIntent(TodayIntent.ScreenShown)
        runCurrent()
        return viewModel
    }

    private fun TestScope.stopsWithTheTest(viewModel: TodayViewModel) {
        backgroundScope.launch(start = CoroutineStart.UNDISPATCHED) {
            try {
                awaitCancellation()
            } finally {
                viewModel.onIntent(TodayIntent.ScreenHidden)
            }
        }
    }

    private fun <T> TestScope.drawnDuring(
        viewModel: TodayViewModel,
        lasting: Duration,
        rowOf: (TodayUiState.Content) -> T,
    ): List<T> {
        val rows: MutableList<T> = mutableListOf()
        backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) {
            viewModel.state.collect { state: TodayUiState -> rows.add(rowOf(state as TodayUiState.Content)) }
        }
        advanceTimeBy(lasting)
        runCurrent()
        return rows
    }

    private fun contentOf(
        viewModel: TodayViewModel,
    ): TodayUiState.Content = viewModel.state.value as TodayUiState.Content

    private fun runningTown(): TownSnapshot = newTown(
        nextStep = NextStep.LessonRunning(goal = null, text = null),
        lessonSlot = TownSnapshot.LessonSlot(firstLesson, startedAt = readAt, finishesAt = readAt + 10.minutes),
    )

    private companion object {
        val firstLesson: LessonId = LessonId("lesson-1")
    }
}
