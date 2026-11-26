package com.emm.mygame

import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.town.HeldTown
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import com.emm.mygame.core.testing.TestClock
import com.emm.mygame.core.testing.townOf
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
import org.junit.Rule
import org.junit.Test
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant

@OptIn(ExperimentalCoroutinesApi::class)
class TownFollowViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val deviceStart: Instant = Instant.parse("2026-11-07T10:00:00Z")

    private fun runningTown(readAt: Instant, finishesAt: Instant): TownSnapshot = townOf(readAt).copy(
        lessonSlot = TownSnapshot.LessonSlot(LessonId("lesson-1"), readAt, finishesAt),
        nextStep = NextStep.LessonRunning(goal = null, text = null),
    )

    private fun TestScope.followOf(clock: TestClock): TownFollowViewModel {
        val viewModel = TownFollowViewModel(towns, clock)
        backgroundScope.launch(start = CoroutineStart.UNDISPATCHED) {
            try {
                awaitCancellation()
            } finally {
                viewModel.viewModelScope.cancel()
            }
        }
        return viewModel
    }

    private fun TestScope.followingOver(
        viewModel: TownFollowViewModel,
        town: TownSnapshot,
        isLessonFinishFollowed: Boolean = true,
    ) {
        towns.hold(HeldTown(town, gap = Duration.ZERO))
        viewModel.onIntent(TownFollowIntent.ScreenShown(isLessonFinishFollowed = isLessonFinishFollowed))
        runCurrent()
    }

    private fun TestScope.passing(duration: Duration) {
        advanceTimeBy(duration)
        runCurrent()
    }

    @Test
    fun `reads the town at the lesson's finish over a screen that reads none`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownFollowViewModel = followOf(clock)
        val finish: Instant = clock.now() + 2.minutes
        followingOver(viewModel, runningTown(readAt = clock.now(), finishesAt = finish))
        towns.answerRead(TownReadResult.Read(townOf(finish)))

        passing(2.minutes + 1.seconds)

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `leaves the read at the lesson's finish to a screen that reads the town`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownFollowViewModel = followOf(clock)
        followingOver(
            viewModel,
            runningTown(readAt = clock.now(), finishesAt = clock.now() + 2.minutes),
            isLessonFinishFollowed = false,
        )

        passing(5.minutes)

        assertEquals(0, towns.readCount)
    }

    @Test
    fun `reads the town no more once hidden`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownFollowViewModel = followOf(clock)
        followingOver(viewModel, runningTown(readAt = clock.now(), finishesAt = clock.now() + 2.minutes))

        viewModel.onIntent(TownFollowIntent.ScreenHidden)
        passing(5.minutes)

        assertEquals(0, towns.readCount)
    }

    @Test
    fun `follows no town held while hidden`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownFollowViewModel = followOf(clock)
        followingOver(viewModel, townOf(clock.now()))
        viewModel.onIntent(TownFollowIntent.ScreenHidden)
        towns.hold(HeldTown(runningTown(readAt = clock.now(), finishesAt = clock.now() + 2.minutes), Duration.ZERO))
        runCurrent()

        passing(5.minutes)

        assertEquals(0, towns.readCount)
    }

    @Test
    fun `asks again a minute after a failed read at the finish`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownFollowViewModel = followOf(clock)
        followingOver(viewModel, runningTown(readAt = clock.now(), finishesAt = clock.now() + 2.minutes))
        towns.answerRead(TownReadResult.Unreachable)
        passing(2.minutes + 1.seconds)
        val readsAfterFailure: Int = towns.readCount
        towns.answerRead(TownReadResult.Unreachable)

        passing(1.minutes + 1.seconds)

        assertEquals(1, readsAfterFailure)
        assertEquals(2, towns.readCount)
    }

    @Test
    fun `reads once at the finish when the answer still holds a lesson past its instant`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownFollowViewModel = followOf(clock)
        val finish: Instant = clock.now() + 2.minutes
        followingOver(viewModel, runningTown(readAt = clock.now(), finishesAt = finish))
        towns.answerRead(TownReadResult.Read(runningTown(readAt = finish + 1.seconds, finishesAt = finish)))

        passing(5.minutes)

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `a task's answer reads a town sent after it`() = runTest {
        val viewModel: TownFollowViewModel = followOf(TestClock(testScheduler, deviceStart))

        viewModel.onIntent(TownFollowIntent.TaskAnswered)
        runCurrent()

        assertEquals(1, towns.sentAfterNowCount)
    }
}
