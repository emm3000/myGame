package com.emm.mygame.feature.town

import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import com.emm.mygame.core.testing.TestClock
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class TownStatusViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val deviceStart: Instant = Instant.parse("2026-11-07T10:00:00Z")

    private val firstLesson: LessonId = LessonId("lesson-1")

    private val secondLesson: LessonId = LessonId("lesson-2")

    private val thirdLesson: LessonId = LessonId("lesson-3")

    private fun lessonOf(id: LessonId, isStudied: Boolean): TownSnapshot.Lesson = TownSnapshot.Lesson(
        id = id,
        theme = "A day in town",
        duration = 150.seconds,
        requiredSchoolLevel = 1,
        skill = TownSnapshot.LessonSkill(TownResourceKind.Food, ratePercent = 5),
        isStudied = isStudied,
        wordCount = 5,
        readings = emptyList(),
        standings = emptyList(),
    )

    private fun lessonsWith(studied: List<LessonId>): List<TownSnapshot.Lesson> =
        listOf(firstLesson, secondLesson, thirdLesson).map { id: LessonId -> lessonOf(id, id in studied) }

    private fun runningTown(readAt: Instant, finishesAt: Instant): TownSnapshot = townOf(readAt = readAt).copy(
        lessons = lessonsWith(listOf(firstLesson)),
        lessonSlot = TownSnapshot.LessonSlot(secondLesson, readAt, finishesAt),
        nextStep = NextStep.LessonRunning(producer = null),
    )

    private fun finishedTown(readAt: Instant, readFirst: List<LessonId>): TownSnapshot = townOf(readAt = readAt).copy(
        lessons = lessonsWith(listOf(firstLesson, secondLesson)),
        nextStep = NextStep.Reviews(count = 5, readFirst = readFirst),
    )

    private fun TestScope.statusOf(clock: TestClock): TownStatusViewModel {
        val viewModel = TownStatusViewModel(towns, clock)
        backgroundScope.launch(start = CoroutineStart.UNDISPATCHED) {
            try {
                awaitCancellation()
            } finally {
                viewModel.viewModelScope.cancel()
            }
        }
        return viewModel
    }

    private suspend fun heldOf(town: TownSnapshot) {
        towns.answerRead(TownReadResult.Read(town))
        towns.read()
    }

    private fun TestScope.reportShown(viewModel: TownStatusViewModel) {
        viewModel.onIntent(TownStatusIntent.ScreenShown(TownStatusScreen.ReadsNoTown))
        runCurrent()
    }

    private fun TestScope.passing(duration: Duration) {
        advanceTimeBy(duration)
        runCurrent()
    }

    @Test
    fun `draws nothing while no town is held`() = runTest {
        val viewModel: TownStatusViewModel = statusOf(TestClock(testScheduler, deviceStart))

        reportShown(viewModel)

        assertEquals(TownStatusUiState.none, viewModel.state.value)
    }

    @Test
    fun `draws the running lesson's number and time left`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        reportShown(viewModel)

        heldOf(runningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes))
        runCurrent()

        val running: TownStatusUiState.RunningLesson? = viewModel.state.value.running
        assertEquals(2, running?.number)
        assertEquals(10.minutes, running?.remaining)
    }

    @Test
    fun `counts down on the device clock when it runs ahead of the server`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        reportShown(viewModel)
        val serverNow: Instant = clock.now() - 1.hours

        heldOf(runningTown(readAt = serverNow, finishesAt = serverNow + 10.minutes))
        runCurrent()
        passing(2.minutes)

        val running: TownStatusUiState.RunningLesson? = viewModel.state.value.running
        assertEquals(8.minutes, running?.remaining)
        assertEquals(1, towns.readCount)
    }

    @Test
    fun `places the finish on the device clock`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        reportShown(viewModel)
        val serverNow: Instant = clock.now() - 1.hours

        heldOf(runningTown(readAt = serverNow, finishesAt = serverNow + 10.minutes))
        runCurrent()

        assertEquals(deviceStart + 10.minutes, viewModel.state.value.running?.finishesAt)
    }

    @Test
    fun `reads the town at the lesson's finish over a screen that reads none`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        reportShown(viewModel)
        heldOf(runningTown(readAt = clock.now(), finishesAt = clock.now() + 2.minutes))
        runCurrent()
        towns.answerRead(TownReadResult.Read(finishedTown(clock.now() + 2.minutes, listOf(secondLesson))))

        passing(2.minutes + 1.seconds)

        assertEquals(2, towns.readCount)
        assertEquals(TownStatusUiState.FinishNotice(2, secondLesson), viewModel.state.value.notice)
    }

    @Test
    fun `leaves the read at the lesson's finish to a screen that reads the town`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        viewModel.onIntent(TownStatusIntent.ScreenShown(TownStatusScreen.ReadsTown))
        runCurrent()
        heldOf(runningTown(readAt = clock.now(), finishesAt = clock.now() + 2.minutes))
        runCurrent()

        passing(5.minutes)

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `reads the town no more once hidden`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        reportShown(viewModel)
        heldOf(runningTown(readAt = clock.now(), finishesAt = clock.now() + 2.minutes))
        runCurrent()

        viewModel.onIntent(TownStatusIntent.ScreenHidden)
        passing(5.minutes)

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `follows no town held while hidden`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        reportShown(viewModel)
        viewModel.onIntent(TownStatusIntent.ScreenHidden)
        heldOf(runningTown(readAt = clock.now(), finishesAt = clock.now() + 2.minutes))
        runCurrent()

        passing(5.minutes)

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `asks again a minute after a failed read at the finish`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        reportShown(viewModel)
        heldOf(runningTown(readAt = clock.now(), finishesAt = clock.now() + 2.minutes))
        runCurrent()
        towns.answerRead(TownReadResult.Unreachable)
        passing(2.minutes + 1.seconds)
        val readsAfterFailure: Int = towns.readCount
        towns.answerRead(TownReadResult.Unreachable)

        passing(1.minutes + 1.seconds)

        assertEquals(2, readsAfterFailure)
        assertEquals(3, towns.readCount)
    }

    @Test
    fun `keeps the status through a failed read`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        reportShown(viewModel)
        heldOf(runningTown(readAt = clock.now(), finishesAt = clock.now() + 2.minutes))
        runCurrent()
        towns.answerRead(TownReadResult.Unreachable)

        passing(2.minutes + 1.seconds)

        assertEquals(2, viewModel.state.value.running?.number)
    }

    @Test
    fun `reads once at the finish when the answer still holds a lesson past its instant`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        reportShown(viewModel)
        val finish: Instant = clock.now() + 2.minutes
        heldOf(runningTown(readAt = clock.now(), finishesAt = finish))
        runCurrent()
        towns.answerRead(TownReadResult.Read(runningTown(readAt = finish + 1.seconds, finishesAt = finish)))

        passing(5.minutes)

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `shows no notice for a lesson that was stopped`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        reportShown(viewModel)
        heldOf(runningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes))
        runCurrent()

        heldOf(finishedTown(clock.now(), readFirst = emptyList()).copy(lessons = lessonsWith(listOf(firstLesson))))
        runCurrent()

        assertNull(viewModel.state.value.notice)
    }

    @Test
    fun `shows no notice for a lesson already finished at the first read`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        reportShown(viewModel)

        heldOf(finishedTown(clock.now(), readFirst = listOf(secondLesson)))
        runCurrent()

        assertNull(viewModel.state.value.notice)
    }

    @Test
    fun `opens the first lesson of readFirst from the notice`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        reportShown(viewModel)
        heldOf(runningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes))
        runCurrent()

        heldOf(finishedTown(clock.now(), readFirst = listOf(secondLesson, thirdLesson)))
        runCurrent()

        assertEquals(secondLesson, viewModel.state.value.notice?.firstUnread)
    }

    @Test
    fun `draws a closed notice no more across reads`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        reportShown(viewModel)
        heldOf(runningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes))
        runCurrent()
        heldOf(finishedTown(clock.now(), readFirst = listOf(secondLesson)))
        runCurrent()

        viewModel.onIntent(TownStatusIntent.NoticeClosed)
        heldOf(finishedTown(clock.now() + 1.seconds, readFirst = listOf(secondLesson)))
        runCurrent()

        assertNull(viewModel.state.value.notice)
    }

    @Test
    fun `closes the notice on the reviews`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        reportShown(viewModel)
        heldOf(runningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes))
        runCurrent()
        heldOf(finishedTown(clock.now(), readFirst = emptyList()))
        runCurrent()

        viewModel.onIntent(TownStatusIntent.ScreenShown(TownStatusScreen.Reviews))
        viewModel.onIntent(TownStatusIntent.ScreenShown(TownStatusScreen.ReadsNoTown))
        runCurrent()

        assertNull(viewModel.state.value.notice)
    }

    @Test
    fun `closes the notice on the unread lesson's words`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        reportShown(viewModel)
        heldOf(runningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes))
        runCurrent()
        heldOf(finishedTown(clock.now(), readFirst = listOf(secondLesson, thirdLesson)))
        runCurrent()

        viewModel.onIntent(TownStatusIntent.ScreenShown(TownStatusScreen.LessonWords(secondLesson)))

        assertNull(viewModel.state.value.notice)
    }

    @Test
    fun `keeps the notice on another lesson's words`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        reportShown(viewModel)
        heldOf(runningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes))
        runCurrent()
        heldOf(finishedTown(clock.now(), readFirst = listOf(secondLesson, thirdLesson)))
        runCurrent()

        viewModel.onIntent(TownStatusIntent.ScreenShown(TownStatusScreen.LessonWords(thirdLesson)))

        assertEquals(TownStatusUiState.FinishNotice(2, secondLesson), viewModel.state.value.notice)
    }

    @Test
    fun `forgets the town when the session ends`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        reportShown(viewModel)
        heldOf(runningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes))
        runCurrent()

        viewModel.onIntent(TownStatusIntent.ScreenShown(TownStatusScreen.Outside))
        val signedOut: TownStatusUiState = viewModel.state.value
        reportShown(viewModel)
        heldOf(finishedTown(clock.now(), readFirst = listOf(secondLesson)))
        runCurrent()

        assertEquals(TownStatusUiState.none, signedOut)
        assertNull(viewModel.state.value.notice)
    }

    @Test
    fun `draws nothing when the town is gone`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        reportShown(viewModel)
        heldOf(runningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes))
        runCurrent()

        towns.answerRead(TownReadResult.NoTown)
        towns.read()
        runCurrent()

        assertEquals(TownStatusUiState.none, viewModel.state.value)
    }

    private fun townOf(readAt: Instant): TownSnapshot = TownSnapshot(
        name = "Riverton",
        label = TownLabel.Town,
        seasonInForce = null,
        seasonEndsAt = null,
        stocks = emptyList(),
        people = TownSnapshot.People(supplied = 10, free = 4, atWork = 6),
        buildings = emptyList(),
        work = TownSnapshot.Work(slot = null, waitingList = emptyList(), cap = 2),
        lessons = emptyList(),
        skills = emptyList(),
        learning = TownSnapshot.Learning(cap = 10, inLearning = 0, retainedWords = null),
        lessonSlot = null,
        nextStep = NextStep.CaughtUp,
        nextDueAt = null,
        readAt = readAt,
    )
}
