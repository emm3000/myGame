package com.emm.mygame.feature.school

import com.emm.mygame.core.network.HeldTown
import com.emm.mygame.core.network.ReviewsReadResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

class LessonWordsHeldTownTest {

    @get:Rule
    val mainDispatcherRule: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val learning: FakeLearningRepository = FakeLearningRepository()

    private val twoWords: TownSnapshot.Lesson = lessonOf(readings = listOf(homeWord, waterWord))

    private val runningTown: TownSnapshot = townOf(lessons = listOf(twoWords), lessonSlot = slotOf())

    private val finishedTown: TownSnapshot = townOf(lessons = listOf(twoWords))

    private val heldRunning: HeldTown = HeldTown(runningTown, gap = Duration.ZERO)

    @Test
    fun `draws the held lesson before the re-read answers`() = runTest {
        towns.hold(HeldTown(runningTown, gap = Duration.ZERO))

        val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, learning)

        assertEquals(homeWord, readingOf(viewModel).word)
    }

    @Test
    fun `reads the town and the reviews behind the held lesson`() = runTest {
        towns.hold(heldRunning)
        lessonWordsViewModelOf(towns, learning)
        towns.answerRead(TownReadResult.Read(runningTown))

        runCurrent()

        assertEquals(listOf(1, 1), listOf(towns.readCount, learning.readCount))
    }

    @Test
    fun `replaces the held lesson with the re-read`() = runTest {
        towns.hold(heldRunning)
        val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, learning)
        val reviewed: TownSnapshot = townOf(lessons = listOf(lessonOf(readings = listOf(waterWord))))
        towns.answerRead(TownReadResult.Read(reviewed))
        learning.answerRead(readReviewsOf())

        runCurrent()

        assertEquals(listOf(waterWord), readingOf(viewModel).words)
    }

    @Test
    fun `fills the way on from the re-read of a held lesson that has finished`() = runTest {
        towns.hold(heldRunning)
        val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, learning)
        towns.answerRead(TownReadResult.Read(finishedTown))
        learning.answerRead(readReviewsOf(readFirst = listOf(secondLesson)))

        runCurrent()

        assertEquals(LessonWordsUiState.WayOn.Lesson(secondLesson), readingOf(viewModel).wayOn)
    }

    @Test
    fun `keeps the held lesson when the town re-read fails`() = runTest {
        towns.hold(heldRunning)
        val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, learning)
        towns.answerRead(TownReadResult.Unreachable)

        runCurrent()

        assertEquals(homeWord, readingOf(viewModel).word)
    }

    @Test
    fun `keeps the held lesson when the reviews re-read fails`() = runTest {
        towns.hold(heldRunning)
        val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, learning)
        towns.answerRead(TownReadResult.Read(runningTown))
        learning.answerRead(ReviewsReadResult.Unreachable)

        runCurrent()

        assertEquals(homeWord, readingOf(viewModel).word)
    }

    @Test
    fun `projects the held lesson with the gap measured when it arrived`() = runTest {
        towns.hold(HeldTown(runningTown, gap = (-2).minutes))

        val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, learning, start = readInstant + 3.minutes)

        assertEquals(90.seconds, readingOf(viewModel).remaining)
    }

    @Test
    fun `reads cold when the held gap puts the lesson past its finish`() = runTest {
        towns.hold(HeldTown(runningTown, gap = 200.seconds))

        val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, learning)

        assertEquals(LessonWordsUiState.Loading, viewModel.state.value)
    }

    @Test
    fun `reads cold with nothing held`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, learning)

        assertEquals(LessonWordsUiState.Loading, viewModel.state.value)
    }

    @Test
    fun `reads cold when the held lesson has finished, since its way on needs the reviews`() = runTest {
        towns.hold(HeldTown(finishedTown, gap = Duration.ZERO))

        val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, learning)

        assertEquals(LessonWordsUiState.Loading, viewModel.state.value)
    }

    @Test
    fun `offers no way on when the held lesson finishes before the reviews have answered`() = runTest {
        val shortLesson: TownSnapshot = townOf(lessons = listOf(twoWords), lessonSlot = slotOf(lasting = 30.seconds))
        towns.hold(HeldTown(shortLesson, gap = Duration.ZERO))
        val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, learning)
        towns.answerRead(TownReadResult.Unreachable)
        runCurrent()

        advanceTimeBy(31.seconds)
        runCurrent()

        assertNull(readingOf(viewModel).wayOn)
    }

    @Test
    fun `draws nothing to read at once when the held town has no reading of the lesson`() = runTest {
        towns.hold(HeldTown(townOf(lessons = listOf(lessonOf(readings = emptyList()))), gap = Duration.ZERO))

        val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, learning)

        assertEquals(LessonWordsUiState.NothingToRead, viewModel.state.value)
    }

    @Test
    fun `opens from the held town on a retry after the reviews failed`() = runTest {
        towns.answerRead(TownReadResult.Read(runningTown))
        learning.answerRead(ReviewsReadResult.Unreachable)
        val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, learning)
        runCurrent()

        viewModel.onIntent(LessonWordsIntent.RetryTapped)

        assertEquals(homeWord, readingOf(viewModel).word)
    }

    @Test
    fun `opens from the held town when the screen returns to a read hidden before its answer`() = runTest {
        val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, learning)
        runCurrent()
        viewModel.onIntent(LessonWordsIntent.ScreenHidden)
        towns.hold(heldRunning)

        viewModel.onIntent(LessonWordsIntent.ScreenShown)

        assertEquals(homeWord, readingOf(viewModel).word)
    }

    @Test
    fun `stays failed when the screen returns to a failed read`() = runTest {
        towns.answerRead(TownReadResult.Unreachable)
        val viewModel: LessonWordsViewModel = lessonWordsViewModelOf(towns, learning)
        runCurrent()

        viewModel.onIntent(LessonWordsIntent.ScreenHidden)
        viewModel.onIntent(LessonWordsIntent.ScreenShown)
        runCurrent()

        assertEquals(listOf(LessonWordsUiState.Failed, 1), listOf(viewModel.state.value, towns.readCount))
    }
}
