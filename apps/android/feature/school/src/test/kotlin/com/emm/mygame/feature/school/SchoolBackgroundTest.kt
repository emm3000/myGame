package com.emm.mygame.feature.school

import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.school.TownLessonResult
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

class SchoolBackgroundTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private fun TestScope.schoolReading(town: TownSnapshot): SchoolViewModel = schoolReadingFrom(towns, town)

    @Test
    fun `stops the loop on background`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(lessonSlot = slotOf(lasting = 10.seconds)))

        viewModel.onIntent(SchoolIntent.ScreenHidden)
        advanceTimeBy(5.minutes)
        runCurrent()

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `stops repainting on background`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(lessonSlot = slotOf(lasting = 30.seconds)))

        viewModel.onIntent(SchoolIntent.ScreenHidden)
        advanceTimeBy(10.seconds)
        runCurrent()

        assertEquals(30.seconds, (contentOf(viewModel).slot as SchoolUiState.SlotLine.Busy).remaining)
    }

    @Test
    fun `reads the town once on return from the background`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf())
        viewModel.onIntent(SchoolIntent.ScreenHidden)
        towns.answerRead(TownReadResult.Read(townWithCap(20)))

        viewModel.onIntent(SchoolIntent.ScreenShown)
        runCurrent()

        assertEquals(20, contentOf(viewModel).learning.cap)
    }

    @Test
    fun `reads nothing more on the first shown intent`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf())

        viewModel.onIntent(SchoolIntent.ScreenShown)
        runCurrent()

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `keeps the last content when the read on return fails`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townWithCap(30))
        viewModel.onIntent(SchoolIntent.ScreenHidden)
        towns.answerRead(TownReadResult.Unreachable)

        viewModel.onIntent(SchoolIntent.ScreenShown)
        runCurrent()

        assertEquals(30, contentOf(viewModel).learning.cap)
    }

    @Test
    fun `retries a failed read on return after a fixed minute`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf())
        viewModel.onIntent(SchoolIntent.ScreenHidden)
        towns.answerRead(TownReadResult.Unreachable)
        viewModel.onIntent(SchoolIntent.ScreenShown)
        runCurrent()
        towns.answerRead(TownReadResult.Read(townOf(readAt = readInstant + 1.minutes)))

        advanceTimeBy(59.seconds)
        runCurrent()
        val readsBeforeTheMinute: Int = towns.readCount
        advanceTimeBy(1.seconds)
        runCurrent()

        assertEquals(listOf(2, 3), listOf(readsBeforeTheMinute, towns.readCount))
    }

    @Test
    fun `reads from loading when the first read was hidden before its answer`() = runTest {
        val viewModel: SchoolViewModel = schoolViewModelOf(towns)
        runCurrent()
        viewModel.onIntent(SchoolIntent.ScreenHidden)
        towns.answerRead(TownReadResult.Read(townOf()))

        viewModel.onIntent(SchoolIntent.ScreenShown)
        runCurrent()

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `reads again on return to a failed first read`() = runTest {
        towns.answerRead(TownReadResult.Unreachable)
        val viewModel: SchoolViewModel = schoolViewModelOf(towns)
        runCurrent()
        viewModel.onIntent(SchoolIntent.ScreenHidden)

        viewModel.onIntent(SchoolIntent.ScreenShown)
        runCurrent()

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `keeps the loop stopped when a start answers while hidden`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf())
        viewModel.onIntent(SchoolIntent.StudyTapped(firstLesson))
        runCurrent()
        viewModel.onIntent(SchoolIntent.ScreenHidden)
        towns.answerLesson(TownLessonResult.Answered(townOf(lessonSlot = slotOf(lasting = 10.seconds))))
        runCurrent()

        advanceTimeBy(5.minutes)
        runCurrent()

        assertEquals(1, towns.readCount)
    }
}
