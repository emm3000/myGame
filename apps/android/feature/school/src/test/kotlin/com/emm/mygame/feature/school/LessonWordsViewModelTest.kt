package com.emm.mygame.feature.school

import app.cash.turbine.test
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

class LessonWordsViewModelTest {

    @get:Rule
    val mainDispatcherRule: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val reports: FakeReportRepository = FakeReportRepository()

    private val twoWords: TownSnapshot.Lesson = lessonOf(readings = listOf(homeWord, waterWord))

    private val finishedTown: TownSnapshot = townOf(lessons = listOf(twoWords))

    private val runningTown: TownSnapshot = townOf(lessons = listOf(twoWords), lessonSlot = slotOf())

    @Test
    fun `starts at the first word of the lesson`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, finishedTown)

        assertEquals(homeWord, readingOf(viewModel).word)
    }

    @Test
    fun `shows the next word when the player asks for it`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, finishedTown)

        viewModel.onIntent(LessonWordsIntent.NextWordTapped)

        assertEquals(waterWord, readingOf(viewModel).word)
    }

    @Test
    fun `stays on the last word`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, finishedTown)

        repeat(3) { viewModel.onIntent(LessonWordsIntent.NextWordTapped) }

        assertEquals(1, readingOf(viewModel).index)
    }

    @Test
    fun `shows only the words the api still lets the player read`() = runTest {
        val partlyReviewed: TownSnapshot.Lesson = lessonOf(wordCount = 2, readings = listOf(waterWord))
        val town: TownSnapshot = townOf(lessons = listOf(partlyReviewed))

        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, town)

        assertEquals(listOf(waterWord), readingOf(viewModel).words)
    }

    @Test
    fun `numbers the lesson by its place in the curriculum`() = runTest {
        val town: TownSnapshot = townOf(lessons = listOf(lessonOf(id = secondLesson), twoWords))

        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, town)

        assertEquals(2, readingOf(viewModel).number)
    }

    @Test
    fun `shows the time of the lesson that holds the slot`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, runningTown)

        assertEquals(150.seconds, readingOf(viewModel).remaining)
    }

    @Test
    fun `shows no time while another lesson holds the slot`() = runTest {
        val town: TownSnapshot = townOf(lessons = listOf(twoWords), lessonSlot = slotOf(lesson = secondLesson))

        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, town)

        assertNull(readingOf(viewModel).remaining)
    }

    @Test
    fun `offers the way on only once the lesson has finished`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, runningTown)
        val wayOnWhileRunning: LessonWordsUiState.WayOn? = readingOf(viewModel).wayOn
        towns.answerRead(TownReadResult.Read(finishedTown.copy(readAt = readInstant + 150.seconds)))
        reports.answerRead(readReportOf())

        advanceTimeBy(150.seconds)
        runCurrent()

        assertEquals(
            listOf(null, LessonWordsUiState.WayOn.Reviews),
            listOf(wayOnWhileRunning, readingOf(viewModel).wayOn),
        )
    }

    @Test
    fun `offers the reviews once nothing is left to read first`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, finishedTown)

        assertEquals(LessonWordsUiState.WayOn.Reviews, readingOf(viewModel).wayOn)
    }

    @Test
    fun `offers the next unread lesson of the walk`() = runTest {
        val viewModel: LessonWordsViewModel =
            lessonWordsReadingFrom(towns, reports, finishedTown, readFirst = listOf(firstLesson, secondLesson))

        assertEquals(LessonWordsUiState.WayOn.Lesson(secondLesson), readingOf(viewModel).wayOn)
    }

    @Test
    fun `skips a lesson already opened on this walk`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(
            towns,
            reports,
            finishedTown,
            readFirst = listOf(firstLesson, secondLesson),
            walked = listOf(secondLesson),
        )

        assertEquals(LessonWordsUiState.WayOn.Reviews, readingOf(viewModel).wayOn)
    }

    @Test
    fun `reads the town and the report again when the lesson finishes`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, runningTown)
        towns.answerRead(TownReadResult.Read(finishedTown.copy(readAt = readInstant + 150.seconds)))
        reports.answerRead(readReportOf())

        advanceTimeBy(150.seconds)
        runCurrent()

        assertEquals(LessonWordsUiState.WayOn.Reviews, readingOf(viewModel).wayOn)
    }

    @Test
    fun `keeps the word on screen across the read at the finish`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, runningTown)
        viewModel.onIntent(LessonWordsIntent.NextWordTapped)
        towns.answerRead(TownReadResult.Read(finishedTown.copy(readAt = readInstant + 150.seconds)))
        reports.answerRead(readReportOf())

        advanceTimeBy(150.seconds)
        runCurrent()

        assertEquals(waterWord, readingOf(viewModel).word)
    }

    @Test
    fun `asks again a minute after a failed read at the finish`() = runTest {
        lessonWordsReadingFrom(towns, reports, runningTown)
        towns.answerRead(TownReadResult.Unreachable)
        advanceTimeBy(150.seconds)
        runCurrent()
        towns.answerRead(TownReadResult.Read(finishedTown))
        reports.answerRead(readReportOf())

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(3, towns.readCount)
    }

    @Test
    fun `shows the rest when the player comes back from a review`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, finishedTown)
        val reviewed: TownSnapshot = townOf(lessons = listOf(lessonOf(readings = listOf(waterWord))))
        towns.answerRead(TownReadResult.Read(reviewed))
        reports.answerRead(readReportOf())

        viewModel.onIntent(LessonWordsIntent.ScreenHidden)
        viewModel.onIntent(LessonWordsIntent.ScreenShown)
        runCurrent()

        assertEquals(listOf(waterWord), readingOf(viewModel).words)
    }

    @Test
    fun `reads nothing while the screen is hidden`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, runningTown)

        viewModel.onIntent(LessonWordsIntent.ScreenHidden)
        advanceTimeBy(150.seconds)
        runCurrent()

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `has nothing to read when no word of the lesson can be read`() = runTest {
        val town: TownSnapshot = townOf(lessons = listOf(lessonOf(readings = emptyList())))

        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, town)

        assertEquals(LessonWordsUiState.NothingToRead, viewModel.state.value)
    }

    @Test
    fun `has nothing to read in a lesson the town does not hold`() = runTest {
        val town: TownSnapshot = townOf(lessons = listOf(lessonOf(id = secondLesson, readings = listOf(homeWord))))

        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, town)

        assertEquals(LessonWordsUiState.NothingToRead, viewModel.state.value)
    }

    @Test
    fun `waits for the tap after a failed town read`() = runTest {
        towns.answerRead(TownReadResult.Unreachable)

        val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, reports)
        runCurrent()

        assertEquals(LessonWordsUiState.Failed, viewModel.state.value)
    }

    @Test
    fun `fails when the report cannot be read`() = runTest {
        towns.answerRead(TownReadResult.Read(finishedTown))
        reports.answerRead(ReportReadResult.Unreachable)

        val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, reports)
        runCurrent()

        assertEquals(LessonWordsUiState.Failed, viewModel.state.value)
    }

    @Test
    fun `reads again from the retry`() = runTest {
        towns.answerRead(TownReadResult.Unreachable)
        val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, reports)
        runCurrent()
        towns.answerRead(TownReadResult.Read(finishedTown))
        reports.answerRead(readReportOf())

        viewModel.onIntent(LessonWordsIntent.RetryTapped)
        runCurrent()

        assertEquals(homeWord, readingOf(viewModel).word)
    }

    @Test
    fun `leaves for the town when the player holds none`() = runTest {
        towns.answerRead(TownReadResult.NoTown)
        val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, reports)

        viewModel.effects.test {
            assertEquals(LessonWordsEffect.NoTown, awaitItem())
        }
    }

    @Test
    fun `sends no write while the player reads`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, finishedTown)

        viewModel.onIntent(LessonWordsIntent.NextWordTapped)
        runCurrent()

        assertEquals(
            listOf(0, 0, 0),
            listOf(towns.lessonStarts.size, towns.lessonStops.size, reports.closeCount),
        )
    }
}
