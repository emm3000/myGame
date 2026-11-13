package com.emm.mygame.feature.school

import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

class LessonWordsSupportViewModelTest {

    @get:Rule
    val mainDispatcherRule: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val reports: FakeReportRepository = FakeReportRepository()

    private val supportedWords: TownSnapshot.Lesson =
        lessonOf(readings = listOf(drinkWaterWord(aguaOnTap), homeWord))

    private val finishedTown: TownSnapshot = townOf(lessons = listOf(supportedWords))

    private val runningTown: TownSnapshot = townOf(lessons = listOf(supportedWords), lessonSlot = slotOf())

    @Test
    fun `opens the support of the tapped frame word`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, finishedTown)

        viewModel.onIntent(LessonWordsIntent.SupportTapped(LessonWordsUiState.ShownSupport.Frame(spanIndex = 1)))

        assertEquals(beberOnTap, readingOf(viewModel).openSupport)
    }

    @Test
    fun `opens the support of the word itself`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, finishedTown)

        viewModel.onIntent(LessonWordsIntent.SupportTapped(LessonWordsUiState.ShownSupport.Word))

        assertEquals(aguaOnTap, readingOf(viewModel).openSupport)
    }

    @Test
    fun `closes the shown support on a second tap of its word`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, finishedTown)

        repeat(2) { viewModel.onIntent(LessonWordsIntent.SupportTapped(LessonWordsUiState.ShownSupport.Word)) }

        assertNull(readingOf(viewModel).openSupport)
    }

    @Test
    fun `moves the shown support to the next word tapped`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, finishedTown)

        viewModel.onIntent(LessonWordsIntent.SupportTapped(LessonWordsUiState.ShownSupport.Word))
        viewModel.onIntent(LessonWordsIntent.SupportTapped(LessonWordsUiState.ShownSupport.Frame(spanIndex = 1)))

        assertEquals(beberOnTap, readingOf(viewModel).openSupport)
    }

    @Test
    fun `hides the shown support on the next word`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, finishedTown)

        viewModel.onIntent(LessonWordsIntent.SupportTapped(LessonWordsUiState.ShownSupport.Word))
        viewModel.onIntent(LessonWordsIntent.NextWordTapped)

        assertNull(readingOf(viewModel).shownSupport)
    }

    @Test
    fun `keeps the shown support open while the lesson's time is repainted`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, runningTown)

        viewModel.onIntent(LessonWordsIntent.SupportTapped(LessonWordsUiState.ShownSupport.Word))
        advanceTimeBy(5.seconds)
        runCurrent()

        assertEquals(aguaOnTap, readingOf(viewModel).openSupport)
    }

    @Test
    fun `hides the shown support when a fresh read moves the reading to another word`() = runTest {
        val threeWords: TownSnapshot.Lesson =
            lessonOf(readings = listOf(homeWord, waterWord, drinkWaterWord(aguaOnTap)))
        val twoWords: TownSnapshot.Lesson = lessonOf(readings = listOf(homeWord, waterWord))
        val studying: TownSnapshot = townOf(lessons = listOf(threeWords), lessonSlot = slotOf())
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, studying)
        repeat(2) { viewModel.onIntent(LessonWordsIntent.NextWordTapped) }
        viewModel.onIntent(LessonWordsIntent.SupportTapped(LessonWordsUiState.ShownSupport.Word))
        val shortened: TownSnapshot = townOf(lessons = listOf(twoWords)).copy(readAt = readInstant + 150.seconds)
        towns.answerRead(TownReadResult.Read(shortened))
        reports.answerRead(readReportOf())

        advanceTimeBy(150.seconds)
        runCurrent()

        assertEquals(waterWord, readingOf(viewModel).word)
        assertNull(readingOf(viewModel).shownSupport)
    }

    @Test
    fun `opens no support line for a word whose support is shown beside it`() = runTest {
        val homeOnly: TownSnapshot = townOf(lessons = listOf(lessonOf(readings = listOf(homeWord))))
        val viewModel: LessonWordsViewModel = lessonWordsReadingFrom(towns, reports, homeOnly)

        viewModel.onIntent(LessonWordsIntent.SupportTapped(LessonWordsUiState.ShownSupport.Word))

        assertNull(readingOf(viewModel).openSupport)
    }
}
