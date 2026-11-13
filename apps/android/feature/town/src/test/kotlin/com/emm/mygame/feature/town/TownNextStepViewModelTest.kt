package com.emm.mygame.feature.town

import app.cash.turbine.test
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.TownLessonRefusal
import com.emm.mygame.core.network.TownLessonResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class TownNextStepViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val releasedLesson: LessonId = LessonId("released-2-1")

    private val releasedStep: NextStep = NextStep.ReleasedLesson(releasedLesson, PlacementBand.Second, position = 1)

    @Test
    fun `draws the check step with its band`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(townOf(nextStep = NextStep.HoldoutCheck(PlacementBand.Second, HoldoutCheckWeek.Eighth)))

        assertEquals(NextStepCard.Line.HoldoutCheck(PlacementBand.Second), contentOf(viewModel).nextStep.line)
    }

    @Test
    fun `opens the due check by its band and week`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(townOf(nextStep = NextStep.HoldoutCheck(PlacementBand.Second, HoldoutCheckWeek.Eighth)))

        viewModel.effects.test {
            viewModel.onIntent(TownIntent.HoldoutCheckTapped(PlacementBand.Second, HoldoutCheckWeek.Eighth))

            assertEquals(TownEffect.HoldoutCheckOpened(PlacementBand.Second, HoldoutCheckWeek.Eighth), awaitItem())
        }
    }

    @Test
    fun `starts the released lesson from the next step`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(nextStep = releasedStep))

        viewModel.onIntent(TownIntent.ReleasedLessonTapped(releasedLesson))

        assertEquals(listOf(releasedLesson), towns.lessonStarts)
    }

    @Test
    fun `draws the released lesson start as waiting while the api answers`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(nextStep = releasedStep))

        lessonStartsOf(viewModel).test {
            assertEquals(TownUiState.LessonStartStatus.Idle, awaitItem())

            viewModel.onIntent(TownIntent.ReleasedLessonTapped(releasedLesson))

            assertEquals(TownUiState.LessonStartStatus.Waiting, awaitItem())
        }
    }

    @Test
    fun `starts the released lesson once on a double tap`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(nextStep = releasedStep))

        viewModel.onIntent(TownIntent.ReleasedLessonTapped(releasedLesson))
        viewModel.onIntent(TownIntent.ReleasedLessonTapped(releasedLesson))

        assertEquals(1, towns.lessonStarts.size)
    }

    @Test
    fun `draws the town the released lesson start answered`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(nextStep = releasedStep))
        towns.answerLesson(TownLessonResult.Answered(townOf(nextStep = NextStep.LessonRunning(producer = null))))

        viewModel.onIntent(TownIntent.ReleasedLessonTapped(releasedLesson))

        assertEquals(NextStepCard.Line.Studying, contentOf(viewModel).nextStep.line)
    }

    @Test
    fun `returns the released lesson start to idle once answered`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(nextStep = releasedStep))

        assertLessonStartAfterWaiting(
            viewModel,
            TownLessonResult.Answered(townOf()),
            TownUiState.LessonStartStatus.Idle,
        )
    }

    @Test
    fun `keeps a refused released lesson start beside the next step`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(nextStep = releasedStep))

        assertLessonStartAfterWaiting(
            viewModel,
            TownLessonResult.Refused(TownLessonRefusal.StudySlotBusy),
            TownUiState.LessonStartStatus.Refused(TownLessonRefusal.StudySlotBusy),
        )
    }

    @Test
    fun `draws a failed released lesson start beside the next step`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(nextStep = releasedStep))

        assertLessonStartAfterWaiting(
            viewModel,
            TownLessonResult.Unreachable,
            TownUiState.LessonStartStatus.Unreachable,
        )
    }

    private suspend fun assertLessonStartAfterWaiting(
        viewModel: TownViewModel,
        answer: TownLessonResult,
        answered: TownUiState.LessonStartStatus,
    ) {
        lessonStartsOf(viewModel).test {
            assertEquals(TownUiState.LessonStartStatus.Idle, awaitItem())
            viewModel.onIntent(TownIntent.ReleasedLessonTapped(releasedLesson))
            assertEquals(TownUiState.LessonStartStatus.Waiting, awaitItem())

            towns.answerLesson(answer)

            assertEquals(answered, awaitItem())
        }
    }

    private fun lessonStartsOf(viewModel: TownViewModel): Flow<TownUiState.LessonStartStatus?> = viewModel.state
        .map { state: TownUiState -> (state as? TownUiState.Content)?.lessonStart }
        .distinctUntilChanged()

    private fun TestScope.homeViewModel(town: TownSnapshot): TownViewModel {
        towns.answerRead(TownReadResult.Read(town))
        return townViewModelOf(towns, readInstant)
    }
}
