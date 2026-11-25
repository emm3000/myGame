package com.emm.mygame.feature.today

import app.cash.turbine.test
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.LessonName
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownSnapshot
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
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes

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
            contentOf(viewModel).running,
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

    private fun TestScope.stopsWithTheTest(viewModel: TodayViewModel) {
        backgroundScope.launch(start = CoroutineStart.UNDISPATCHED) {
            try {
                awaitCancellation()
            } finally {
                viewModel.onIntent(TodayIntent.ScreenHidden)
            }
        }
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
