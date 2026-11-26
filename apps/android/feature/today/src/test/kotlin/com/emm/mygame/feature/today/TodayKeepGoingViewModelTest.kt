package com.emm.mygame.feature.today

import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.KeepGoingResult
import com.emm.mygame.core.model.learning.KeepGoingWord
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.learning.WordId
import com.emm.mygame.core.model.learning.WordSupport
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.guidance.NextStepText
import com.emm.mygame.core.testing.FakeKeepGoingRepository
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import com.emm.mygame.core.testing.TestClock
import com.emm.mygame.core.ui.ReadingSpan
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test
import kotlin.time.Duration.Companion.hours
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest

class TodayKeepGoingViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val frames: FakeKeepGoingRepository = FakeKeepGoingRepository()

    @Test
    fun `while caught up Keep going offers the newest open text the next step carries`() = runTest {
        val viewModel: TodayViewModel = shownOn(newTown(nextStep = caughtUpWith(courseText)))

        assertEquals(TodayUiState.KeepGoing.Text(TextId("text-1"), "A New Course"), contentOf(viewModel).keepGoing)
    }

    @Test
    fun `while caught up with no open text Keep going offers the frames the route answers`() = runTest {
        frames.answerFrames(KeepGoingResult.Read(listOf(riverWord)))

        val viewModel: TodayViewModel = shownOn(newTown(nextStep = caughtUpWith(text = null)))

        assertEquals(
            TodayUiState.KeepGoing.Frames(sentences = listOf(riverFrame), tapped = null),
            contentOf(viewModel).keepGoing,
        )
    }

    @Test
    fun `with no open text and no frame Keep going is not drawn`() = runTest {
        frames.answerFrames(KeepGoingResult.Read(emptyList()))

        val viewModel: TodayViewModel = shownOn(newTown(nextStep = caughtUpWith(text = null)))

        assertNull(contentOf(viewModel).keepGoing)
    }

    @Test
    fun `with no open text and no frame the first card still says when the next review is due`() = runTest {
        frames.answerFrames(KeepGoingResult.Read(emptyList()))

        val viewModel: TodayViewModel =
            shownOn(newTown(nextStep = caughtUpWith(text = null), nextDueAt = readAt + 20.hours))

        assertEquals(
            TodayUiState.TimeAt(remaining = 20.hours, at = readAt + 20.hours),
            (contentOf(viewModel).first as TodayUiState.FirstCard.CaughtUp).nextReview,
        )
    }

    @Test
    fun `a next step other than caught up reads no frames`() = runTest {
        shownOn(newTown(nextStep = NextStep.LessonToStudy(LessonId("lesson-1"))))

        assertEquals(0, frames.reads)
    }

    @Test
    fun `a tapped frame word opens its on-tap support`() = runTest {
        frames.answerFrames(KeepGoingResult.Read(listOf(riverWord)))
        val viewModel: TodayViewModel = shownOn(newTown(nextStep = caughtUpWith(text = null)))

        viewModel.onIntent(TodayIntent.FrameWordTapped(ReadingSpan(sentence = 0, span = 1)))
        runCurrent()

        assertEquals(riverOnTap, (contentOf(viewModel).keepGoing as TodayUiState.KeepGoing.Frames).openSupport)
    }

    @Test
    fun `a second tap of a frame word closes its support`() = runTest {
        frames.answerFrames(KeepGoingResult.Read(listOf(riverWord)))
        val viewModel: TodayViewModel = shownOn(newTown(nextStep = caughtUpWith(text = null)))

        repeat(2) { viewModel.onIntent(TodayIntent.FrameWordTapped(ReadingSpan(sentence = 0, span = 1))) }
        runCurrent()

        assertNull((contentOf(viewModel).keepGoing as TodayUiState.KeepGoing.Frames).openSupport)
    }

    @Test
    fun `reading a frame sends no request beyond the frames read`() = runTest {
        frames.answerFrames(KeepGoingResult.Read(listOf(riverWord)))
        val viewModel: TodayViewModel = shownOn(newTown(nextStep = caughtUpWith(text = null)))

        viewModel.onIntent(TodayIntent.FrameWordTapped(ReadingSpan(sentence = 0, span = 1)))
        runCurrent()

        assertEquals(1 to 1, frames.reads to towns.readCount)
    }

    private fun TestScope.shownOn(town: TownSnapshot): TodayViewModel {
        towns.answerRead(TownReadResult.Read(town))
        val viewModel: TodayViewModel =
            TodayViewModel(towns, FakeReportRepository(), frames, TestClock(testScheduler, readAt))
        backgroundScope.launch(start = CoroutineStart.UNDISPATCHED) {
            try {
                awaitCancellation()
            } finally {
                viewModel.onIntent(TodayIntent.ScreenHidden)
            }
        }
        viewModel.onIntent(TodayIntent.ScreenShown)
        runCurrent()
        return viewModel
    }

    private fun contentOf(viewModel: TodayViewModel): TodayUiState.Content =
        viewModel.state.value as TodayUiState.Content

    private fun caughtUpWith(text: NextStepText?): NextStep =
        NextStep.CaughtUp(reason = CaughtUpReason.LessonsDone, goal = null, text = text)

    private companion object {
        val courseText: NextStepText = NextStepText(TextId("text-1"), "A New Course")
        val riverOnTap: WordSupport = WordSupport(WordSupport.Shown.OnTap, "río", WordSupport.Language.Spanish)
        val riverFrame: List<FrameSpan> = listOf(
            FrameSpan(text = "I live by the ", support = null),
            FrameSpan(text = "river", support = riverOnTap),
            FrameSpan(text = ".", support = null),
        )
        val riverWord: KeepGoingWord = KeepGoingWord(WordId("river"), listOf(riverFrame))
    }
}
