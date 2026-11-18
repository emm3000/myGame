package com.emm.mygame.feature.school

import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class SchoolUnheldStepTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val oneLesson: TownSnapshot = townOf(lessons = listOf(lessonOf()))

    private val twoLessons: TownSnapshot = townOf(lessons = listOf(lessonOf(), lessonOf(id = secondLesson)))

    @Test
    fun `reads the town once for a dock step it does not hold`() = runTest {
        val viewModel: SchoolViewModel = schoolReadingFrom(towns, oneLesson)

        viewModel.onIntent(SchoolIntent.DockStepUnheld(number = 2))
        viewModel.onIntent(SchoolIntent.DockStepUnheld(number = 2))
        runCurrent()

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `reads nothing for a dock step it holds`() = runTest {
        val viewModel: SchoolViewModel = schoolReadingFrom(towns, oneLesson)

        viewModel.onIntent(SchoolIntent.DockStepUnheld(number = 1))
        runCurrent()

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `tells it reads while the dock step's read waits`() = runTest {
        val viewModel: SchoolViewModel = schoolReadingFrom(towns, oneLesson)

        viewModel.onIntent(SchoolIntent.DockStepUnheld(number = 2))
        runCurrent()

        assertEquals(SchoolUiState.UnheldStep.Reading(number = 2), contentOf(viewModel).unheldStep)
    }

    @Test
    fun `draws the lesson the dock step's read holds`() = runTest {
        val viewModel: SchoolViewModel = schoolReadingFrom(towns, oneLesson)
        viewModel.onIntent(SchoolIntent.DockStepUnheld(number = 2))
        runCurrent()

        towns.answerRead(TownReadResult.Read(twoLessons))
        runCurrent()

        assertEquals(listOf(1, 2), contentOf(viewModel).lessons.map(SchoolUiState.LessonCard::number))
    }

    @Test
    fun `tells the dock step's read answered without the lesson`() = runTest {
        val viewModel: SchoolViewModel = schoolReadingFrom(towns, oneLesson)
        viewModel.onIntent(SchoolIntent.DockStepUnheld(number = 2))
        runCurrent()

        towns.answerRead(TownReadResult.Unreachable)
        runCurrent()

        assertEquals(SchoolUiState.UnheldStep.Unheld(number = 2), contentOf(viewModel).unheldStep)
    }
}
