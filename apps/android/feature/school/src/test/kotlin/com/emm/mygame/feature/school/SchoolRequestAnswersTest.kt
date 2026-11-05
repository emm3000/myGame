package com.emm.mygame.feature.school

import com.emm.mygame.core.network.TownLessonRefusal
import com.emm.mygame.core.network.TownLessonResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class SchoolRequestAnswersTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private fun TestScope.schoolReading(town: TownSnapshot): SchoolViewModel = schoolReadingFrom(towns, town)

    @Test
    fun `stops a lesson by the id the slot names`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(lessonSlot = slotOf()))
        towns.answerLesson(TownLessonResult.Answered(townOf()))

        viewModel.onIntent(SchoolIntent.StopTapped(firstLesson))
        runCurrent()

        assertEquals(listOf(firstLesson), towns.lessonStops)
    }

    @Test
    fun `draws the town a stop answers`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(lessonSlot = slotOf()))
        towns.answerLesson(TownLessonResult.Answered(townOf()))

        viewModel.onIntent(SchoolIntent.StopTapped(firstLesson))
        runCurrent()

        assertEquals(SchoolUiState.SlotLine.Idle, contentOf(viewModel).slot)
    }

    @Test
    fun `stops a lesson once on a double tap`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(lessonSlot = slotOf()))

        viewModel.onIntent(SchoolIntent.StopTapped(firstLesson))
        viewModel.onIntent(SchoolIntent.StopTapped(firstLesson))
        runCurrent()

        assertEquals(1, towns.lessonStops.size)
    }

    @Test
    fun `keeps a refused stop beside the slot`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(lessonSlot = slotOf()))
        towns.answerLesson(TownLessonResult.Refused(TownLessonRefusal.LessonStudyNotFound))

        viewModel.onIntent(SchoolIntent.StopTapped(firstLesson))
        runCurrent()

        assertEquals(
            SchoolUiState.LessonRequest.Refused(firstLesson, TownLessonRefusal.LessonStudyNotFound),
            contentOf(viewModel).stop,
        )
    }

    @Test
    fun `keeps a stop's outage beside the slot`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(lessonSlot = slotOf()))
        towns.answerLesson(TownLessonResult.Unreachable)

        viewModel.onIntent(SchoolIntent.StopTapped(firstLesson))
        runCurrent()

        assertEquals(SchoolUiState.LessonRequest.Unreachable(firstLesson), contentOf(viewModel).stop)
    }

    @Test
    fun `clears a refusal at the next read`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(lessonSlot = slotOf(lasting = 10.seconds)))
        towns.answerLesson(TownLessonResult.Unreachable)
        viewModel.onIntent(SchoolIntent.StopTapped(firstLesson))
        runCurrent()
        towns.answerRead(TownReadResult.Read(townOf(readAt = readInstant + 10.seconds)))

        advanceTimeBy(10.seconds)
        runCurrent()

        assertEquals(SchoolUiState.LessonRequest.Idle, contentOf(viewModel).stop)
    }

    @Test
    fun `keeps a start waiting through a read`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(seasonEndsAt = readInstant + 10.seconds))
        viewModel.onIntent(SchoolIntent.StudyTapped(firstLesson))
        towns.answerRead(TownReadResult.Read(townOf(readAt = readInstant + 10.seconds)))

        advanceTimeBy(10.seconds)
        runCurrent()

        assertEquals(SchoolUiState.LessonRequest.Waiting, contentOf(viewModel).start)
    }

    @Test
    fun `clears the wait once a start answers`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf())
        towns.answerLesson(TownLessonResult.Answered(townOf(lessonSlot = slotOf())))

        viewModel.onIntent(SchoolIntent.StudyTapped(firstLesson))
        runCurrent()

        assertEquals(SchoolUiState.LessonRequest.Idle, contentOf(viewModel).start)
    }

    @Test
    fun `clears the wait once a stop answers`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(lessonSlot = slotOf()))
        towns.answerLesson(TownLessonResult.Answered(townOf()))

        viewModel.onIntent(SchoolIntent.StopTapped(firstLesson))
        runCurrent()

        assertEquals(SchoolUiState.LessonRequest.Idle, contentOf(viewModel).stop)
    }

    @Test
    fun `clears a stop's refusal when a start answers`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(lessonSlot = slotOf()))
        towns.answerLesson(TownLessonResult.Unreachable)
        viewModel.onIntent(SchoolIntent.StopTapped(firstLesson))
        runCurrent()
        towns.answerLesson(TownLessonResult.Answered(townOf(lessonSlot = slotOf())))

        viewModel.onIntent(SchoolIntent.StudyTapped(firstLesson))
        runCurrent()

        assertEquals(SchoolUiState.LessonRequest.Idle, contentOf(viewModel).stop)
    }

    @Test
    fun `clears a start's refusal when a stop answers`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(lessonSlot = slotOf()))
        towns.answerLesson(TownLessonResult.Unreachable)
        viewModel.onIntent(SchoolIntent.StudyTapped(firstLesson))
        runCurrent()
        towns.answerLesson(TownLessonResult.Answered(townOf()))

        viewModel.onIntent(SchoolIntent.StopTapped(firstLesson))
        runCurrent()

        assertEquals(SchoolUiState.LessonRequest.Idle, contentOf(viewModel).start)
    }

    @Test
    fun `reads nothing at the finish of a lesson the player stopped`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(lessonSlot = slotOf(lasting = 10.seconds)))
        towns.answerLesson(TownLessonResult.Answered(townOf()))
        viewModel.onIntent(SchoolIntent.StopTapped(firstLesson))
        runCurrent()

        advanceTimeBy(5.minutes)
        runCurrent()

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `reads at the finish of a lesson the api answers as started`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf())
        towns.answerLesson(TownLessonResult.Answered(townOf(lessonSlot = slotOf(lasting = 10.seconds))))
        viewModel.onIntent(SchoolIntent.StudyTapped(firstLesson))
        runCurrent()

        advanceTimeBy(10.seconds)
        runCurrent()

        assertEquals(2, towns.readCount)
    }
}
