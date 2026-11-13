package com.emm.mygame.feature.school

import app.cash.turbine.test
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.TownLessonRefusal
import com.emm.mygame.core.network.TownLessonResult
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class SchoolNextStepViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val releasedLesson: LessonId = LessonId("released-1-2")

    private val releasedStep: NextStep = NextStep.ReleasedLesson(releasedLesson, PlacementBand.First, position = 2)

    @Test
    fun `draws the check step with its band`() = runTest {
        val viewModel: SchoolViewModel = schoolReadingFrom(
            towns,
            townOf(nextStep = NextStep.HoldoutCheck(PlacementBand.Third, HoldoutCheckWeek.Eighth)),
        )

        assertEquals(NextStepCard.Line.HoldoutCheck(PlacementBand.Third), contentOf(viewModel).nextStep.line)
    }

    @Test
    fun `draws the released lesson step with its set in the band`() = runTest {
        val viewModel: SchoolViewModel = schoolReadingFrom(towns, townOf(nextStep = releasedStep))

        assertEquals(
            NextStepCard.Line.ReleasedLesson(PlacementBand.First, number = 2),
            contentOf(viewModel).nextStep.line,
        )
    }

    @Test
    fun `starts the released lesson from the next step`() = runTest {
        val viewModel: SchoolViewModel = schoolReadingFrom(towns, townOf(nextStep = releasedStep))
        val action: NextStepCard.Action.StudyReleased =
            contentOf(viewModel).nextStep.action as NextStepCard.Action.StudyReleased

        viewModel.onIntent(SchoolIntent.StudyTapped(action.lesson))
        runCurrent()

        assertEquals(listOf(releasedLesson), towns.lessonStarts)
    }

    @Test
    fun `waits on the released lesson start and then draws its refusal`() = runTest {
        val viewModel: SchoolViewModel = schoolReadingFrom(towns, townOf(nextStep = releasedStep))

        startsOf(viewModel).test {
            assertEquals(SchoolUiState.LessonRequest.Idle, awaitItem())
            viewModel.onIntent(SchoolIntent.StudyTapped(releasedLesson))
            assertEquals(SchoolUiState.LessonRequest.Waiting, awaitItem())

            towns.answerLesson(TownLessonResult.Refused(TownLessonRefusal.StudySlotBusy))

            assertEquals(
                SchoolUiState.LessonRequest.Refused(releasedLesson, TownLessonRefusal.StudySlotBusy),
                awaitItem(),
            )
        }
    }

    @Test
    fun `waits on the released lesson start and then returns to idle`() = runTest {
        val viewModel: SchoolViewModel = schoolReadingFrom(towns, townOf(nextStep = releasedStep))

        startsOf(viewModel).test {
            assertEquals(SchoolUiState.LessonRequest.Idle, awaitItem())
            viewModel.onIntent(SchoolIntent.StudyTapped(releasedLesson))
            assertEquals(SchoolUiState.LessonRequest.Waiting, awaitItem())

            towns.answerLesson(TownLessonResult.Answered(townOf()))

            assertEquals(SchoolUiState.LessonRequest.Idle, awaitItem())
        }
    }

    private fun startsOf(viewModel: SchoolViewModel): Flow<SchoolUiState.LessonRequest?> = viewModel.state
        .map { state: SchoolUiState -> (state as? SchoolUiState.Content)?.start }
        .distinctUntilChanged()
}
