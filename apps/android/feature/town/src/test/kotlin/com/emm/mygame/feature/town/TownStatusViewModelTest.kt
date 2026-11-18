package com.emm.mygame.feature.town

import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.HeldTown
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownGoal
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownLessonRefusal
import com.emm.mygame.core.network.TownLessonResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import com.emm.mygame.core.testing.TestClock
import com.emm.mygame.core.testing.hiringOf
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
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
        nextStep = NextStep.LessonRunning(goal = null),
    )

    private fun finishedTown(readAt: Instant, readFirst: List<LessonId>): TownSnapshot = townOf(readAt = readAt).copy(
        lessons = lessonsWith(listOf(firstLesson, secondLesson)),
        nextStep = NextStep.Reviews(count = 5, readFirst = readFirst),
    )

    private val releasedLesson: LessonId = LessonId("released-2-3")

    private val released: TownSnapshot.ReleasedLesson = TownSnapshot.ReleasedLesson(
        id = releasedLesson,
        band = PlacementBand.Second,
        position = 3,
        duration = 150.seconds,
        requiredSchoolLevel = 1,
        isStudied = false,
        wordCount = 5,
        readings = emptyList(),
        standings = emptyList(),
    )

    private fun releasedRunningTown(readAt: Instant, finishesAt: Instant): TownSnapshot = townOf(readAt).copy(
        lessons = lessonsWith(listOf(firstLesson)),
        releasedLessons = listOf(released),
        lessonSlot = TownSnapshot.LessonSlot(releasedLesson, readAt, finishesAt),
        nextStep = NextStep.LessonRunning(goal = null),
    )

    private fun releasedFinishedTown(readAt: Instant): TownSnapshot = townOf(readAt).copy(
        lessons = lessonsWith(listOf(firstLesson)),
        releasedLessons = listOf(released.copy(isStudied = true)),
        nextStep = NextStep.Reviews(count = 5, readFirst = emptyList()),
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

    private fun TestScope.shownWith(
        viewModel: TownStatusViewModel,
        town: TownSnapshot,
        screen: TownStatusScreen = TownStatusScreen.ReadsNoTown,
    ) {
        towns.answerRead(TownReadResult.Read(town))
        viewModel.onIntent(TownStatusIntent.ScreenShown(screen))
        runCurrent()
    }

    private fun TestScope.passing(duration: Duration) {
        advanceTimeBy(duration)
        runCurrent()
    }

    @Test
    fun `draws the running lesson's number and time left`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        shownWith(viewModel, runningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes))
        runCurrent()

        val running: TownStatusUiState.RunningLesson? = viewModel.state.value.running
        assertEquals(LessonName.Shelved(2), running?.name)
        assertEquals(10.minutes, running?.remaining)
    }

    @Test
    fun `counts the lesson's last minute once the next review has passed`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        val reviewSoon: TownSnapshot = runningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes)
            .copy(nextDueAt = clock.now() + 2.minutes)
        shownWith(viewModel, reviewSoon, TownStatusScreen.Report)

        passing(9.minutes + 30.seconds)

        assertEquals(30.seconds, viewModel.state.value.running?.remaining)
    }

    @Test
    fun `names the running released lesson by its band and set`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        shownWith(viewModel, releasedRunningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes))
        runCurrent()

        assertEquals(LessonName.Released(PlacementBand.Second, set = 3), viewModel.state.value.running?.name)
    }

    @Test
    fun `names the finished released lesson by its band and set`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        shownWith(viewModel, releasedRunningTown(readAt = clock.now(), finishesAt = clock.now() + 2.minutes))
        runCurrent()
        towns.answerRead(TownReadResult.Read(releasedFinishedTown(clock.now() + 2.minutes)))

        passing(2.minutes + 1.seconds)

        assertEquals(
            TownStatusUiState.FinishNotice(LessonName.Released(PlacementBand.Second, set = 3), firstUnread = null),
            viewModel.state.value.notice,
        )
    }

    @Test
    fun `counts down on the device clock when it runs ahead of the server`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        val serverNow: Instant = clock.now() - 1.hours

        shownWith(viewModel, runningTown(readAt = serverNow, finishesAt = serverNow + 10.minutes))
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
        val serverNow: Instant = clock.now() - 1.hours

        shownWith(viewModel, runningTown(readAt = serverNow, finishesAt = serverNow + 10.minutes))
        runCurrent()

        assertEquals(deviceStart + 10.minutes, viewModel.state.value.running?.finishesAt)
    }

    @Test
    fun `reads the town at the lesson's finish over a screen that reads none`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        shownWith(viewModel, runningTown(readAt = clock.now(), finishesAt = clock.now() + 2.minutes))
        runCurrent()
        towns.answerRead(TownReadResult.Read(finishedTown(clock.now() + 2.minutes, listOf(secondLesson))))

        passing(2.minutes + 1.seconds)

        assertEquals(2, towns.readCount)
        assertEquals(TownStatusUiState.FinishNotice(LessonName.Shelved(2), secondLesson), viewModel.state.value.notice)
    }

    @Test
    fun `leaves the read at the lesson's finish to a screen that reads the town`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        shownWith(
            viewModel,
            runningTown(readAt = clock.now(), finishesAt = clock.now() + 2.minutes),
            TownStatusScreen.ReadsTown,
        )
        runCurrent()

        passing(5.minutes)

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `reads the town no more once hidden`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        shownWith(viewModel, runningTown(readAt = clock.now(), finishesAt = clock.now() + 2.minutes))
        runCurrent()

        viewModel.onIntent(TownStatusIntent.ScreenHidden)
        passing(5.minutes)

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `follows no town held while hidden`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        shownWith(viewModel, townOf(clock.now()))
        viewModel.onIntent(TownStatusIntent.ScreenHidden)
        heldOf(runningTown(readAt = clock.now(), finishesAt = clock.now() + 2.minutes))
        runCurrent()

        passing(5.minutes)

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `asks again a minute after a failed read at the finish`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        shownWith(viewModel, runningTown(readAt = clock.now(), finishesAt = clock.now() + 2.minutes))
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
        shownWith(viewModel, runningTown(readAt = clock.now(), finishesAt = clock.now() + 2.minutes))
        runCurrent()
        towns.answerRead(TownReadResult.Unreachable)

        passing(2.minutes + 1.seconds)

        assertEquals(LessonName.Shelved(2), viewModel.state.value.running?.name)
    }

    @Test
    fun `reads once at the finish when the answer still holds a lesson past its instant`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        val finish: Instant = clock.now() + 2.minutes
        shownWith(viewModel, runningTown(readAt = clock.now(), finishesAt = finish))
        runCurrent()
        towns.answerRead(TownReadResult.Read(runningTown(readAt = finish + 1.seconds, finishesAt = finish)))

        passing(5.minutes)

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `shows no notice for a lesson that was stopped`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        shownWith(viewModel, runningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes))
        runCurrent()

        heldOf(finishedTown(clock.now(), readFirst = emptyList()).copy(lessons = lessonsWith(listOf(firstLesson))))
        runCurrent()

        assertNull(viewModel.state.value.notice)
    }

    @Test
    fun `shows no notice for a lesson already finished at the first read`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        shownWith(viewModel, finishedTown(clock.now(), readFirst = listOf(secondLesson)))
        runCurrent()

        assertNull(viewModel.state.value.notice)
    }

    @Test
    fun `opens the first lesson of readFirst from the notice`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        shownWith(viewModel, runningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes))
        runCurrent()

        heldOf(finishedTown(clock.now(), readFirst = listOf(secondLesson, thirdLesson)))
        runCurrent()

        assertEquals(secondLesson, viewModel.state.value.notice?.firstUnread)
    }

    @Test
    fun `draws a closed notice no more across reads`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        shownWith(viewModel, runningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes))
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
        shownWith(viewModel, runningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes))
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
        shownWith(viewModel, runningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes))
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
        shownWith(viewModel, runningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes))
        runCurrent()
        heldOf(finishedTown(clock.now(), readFirst = listOf(secondLesson, thirdLesson)))
        runCurrent()

        viewModel.onIntent(TownStatusIntent.ScreenShown(TownStatusScreen.LessonWords(thirdLesson)))

        assertEquals(TownStatusUiState.FinishNotice(LessonName.Shelved(2), secondLesson), viewModel.state.value.notice)
    }

    @Test
    fun `forgets the town when the session ends`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        shownWith(viewModel, runningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes))
        runCurrent()

        viewModel.onIntent(TownStatusIntent.ScreenShown(TownStatusScreen.Outside))
        val signedOut: TownStatusUiState = viewModel.state.value
        shownWith(viewModel, finishedTown(clock.now(), readFirst = listOf(secondLesson)))
        runCurrent()

        assertEquals(TownStatusUiState.none, signedOut)
        assertNull(viewModel.state.value.notice)
    }

    @Test
    fun `draws nothing when the town is gone`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        shownWith(viewModel, runningTown(readAt = clock.now(), finishesAt = clock.now() + 10.minutes))
        runCurrent()

        towns.answerRead(TownReadResult.NoTown)
        towns.read()
        runCurrent()

        assertEquals(TownStatusUiState.none, viewModel.state.value)
    }

    private fun TestScope.shownOn(viewModel: TownStatusViewModel, screen: TownStatusScreen) {
        viewModel.onIntent(TownStatusIntent.ScreenShown(screen))
        runCurrent()
    }

    private fun studyTown(readAt: Instant): TownSnapshot = townOf(readAt).copy(
        lessons = lessonsWith(emptyList()),
        nextStep = NextStep.LessonToStudy(firstLesson),
    )

    @Test
    fun `a held town gives its next step`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        towns.hold(HeldTown(studyTown(clock.now()), gap = Duration.ZERO))

        shownOn(viewModel, TownStatusScreen.ReadsTown)

        assertEquals(
            TownStatusUiState.Dock.Step(
                line = NextStepCard.Line.Lesson(number = 1),
                detail = TownStatusUiState.StepDetail.Words(count = 5),
                countdown = null,
                go = TownStatusUiState.Go.Acts(NextStepCard.Action.Study(number = 1), isBusy = false),
                lessonStart = TownUiState.LessonStartStatus.Idle,
            ),
            viewModel.state.value.dock,
        )
    }

    private val schoolGoal: TownGoal = TownGoal(
        position = 1,
        count = 3,
        building = TownBuildingKind.School,
        level = 3,
        state = TownGoal.State.Underway,
    )

    private val strayLesson: LessonId = LessonId("lesson-not-held")

    private fun strayRunningTown(readAt: Instant): TownSnapshot = townOf(readAt).copy(
        lessons = lessonsWith(listOf(firstLesson)),
        lessonSlot = TownSnapshot.LessonSlot(strayLesson, readAt, readAt + 10.minutes),
        nextStep = NextStep.LessonRunning(goal = null),
    )

    private fun TestScope.goShownOn(screen: TownStatusScreen, town: TownSnapshot): TownStatusUiState.Go? {
        val viewModel: TownStatusViewModel = statusOf(TestClock(testScheduler, deviceStart))
        towns.hold(HeldTown(town, gap = Duration.ZERO))
        shownOn(viewModel, screen)
        return goOf(viewModel)
    }

    private fun goOf(viewModel: TownStatusViewModel): TownStatusUiState.Go? =
        (viewModel.state.value.dock as? TownStatusUiState.Dock.Step)?.go

    @Test
    fun `a town not held yet is loading and reads once`() = runTest {
        val viewModel: TownStatusViewModel = statusOf(TestClock(testScheduler, deviceStart))

        shownOn(viewModel, TownStatusScreen.ReadsTown)
        shownOn(viewModel, TownStatusScreen.School)

        assertEquals(TownStatusUiState.Dock.Loading to 1, viewModel.state.value.dock to towns.readCount)
    }

    @Test
    fun `a read answer keeps the dock loading until the town arrives`() = runTest {
        Dispatchers.setMain(StandardTestDispatcher(testScheduler))
        val viewModel: TownStatusViewModel = statusOf(TestClock(testScheduler, deviceStart))
        val docks: MutableList<TownStatusUiState.Dock?> = mutableListOf()
        backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) {
            viewModel.state.collect { state: TownStatusUiState -> docks += state.dock }
        }

        shownWith(viewModel, studyTown(deviceStart), TownStatusScreen.ReadsTown)

        val loadingAt: Int = docks.indexOf(TownStatusUiState.Dock.Loading)
        assertEquals(emptyList<Int>(), docks.indices.filter { index: Int -> index > loadingAt && docks[index] == null })
    }

    @Test
    fun `a refused read gives the refusal with try again`() = runTest {
        val viewModel: TownStatusViewModel = statusOf(TestClock(testScheduler, deviceStart))
        towns.answerRead(TownReadResult.Unreachable)

        shownOn(viewModel, TownStatusScreen.ReadsTown)

        assertEquals(TownStatusUiState.Dock.Refused, viewModel.state.value.dock)
    }

    @Test
    fun `try again reads the town again`() = runTest {
        val viewModel: TownStatusViewModel = statusOf(TestClock(testScheduler, deviceStart))
        towns.answerRead(TownReadResult.Unreachable)
        shownOn(viewModel, TownStatusScreen.ReadsTown)
        towns.answerRead(TownReadResult.Read(studyTown(deviceStart)))

        viewModel.onIntent(TownStatusIntent.TryAgainTapped)
        runCurrent()

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `a no-town answer gives no dock`() = runTest {
        val viewModel: TownStatusViewModel = statusOf(TestClock(testScheduler, deviceStart))
        towns.answerRead(TownReadResult.NoTown)

        shownOn(viewModel, TownStatusScreen.ReadsTown)

        assertNull(viewModel.state.value.dock)
    }

    @Test
    fun `another screen after a no-town answer reads no more`() = runTest {
        val viewModel: TownStatusViewModel = statusOf(TestClock(testScheduler, deviceStart))
        towns.answerRead(TownReadResult.NoTown)
        shownOn(viewModel, TownStatusScreen.ReadsTown)

        shownOn(viewModel, TownStatusScreen.Report)

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `a screen's answer after a no-town answer gives no dock`() = runTest {
        val viewModel: TownStatusViewModel = statusOf(TestClock(testScheduler, deviceStart))
        towns.answerRead(TownReadResult.NoTown)
        shownOn(viewModel, TownStatusScreen.ReadsTown)

        viewModel.onIntent(TownStatusIntent.ScreenAnswered)
        runCurrent()

        assertNull(viewModel.state.value.dock)
    }

    @Test
    fun `a screen's answer during a read reads again`() = runTest {
        val viewModel: TownStatusViewModel = statusOf(TestClock(testScheduler, deviceStart))
        shownOn(viewModel, TownStatusScreen.Report)

        viewModel.onIntent(TownStatusIntent.ScreenAnswered)
        runCurrent()

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `a held town never shows loading`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        towns.hold(HeldTown(studyTown(clock.now()), gap = Duration.ZERO))
        shownOn(viewModel, TownStatusScreen.ReadsTown)

        viewModel.onIntent(TownStatusIntent.ScreenAnswered)
        runCurrent()

        assertEquals(TownStatusUiState.Go.Acts(NextStepCard.Action.Study(number = 1), isBusy = false), goOf(viewModel))
    }

    @Test
    fun `a screen's answer reads the town`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        towns.hold(HeldTown(studyTown(clock.now()), gap = Duration.ZERO))
        shownOn(viewModel, TownStatusScreen.Report)

        viewModel.onIntent(TownStatusIntent.ScreenAnswered)
        runCurrent()

        assertEquals(1, towns.readCount)
    }

    private fun releasedStepTown(readAt: Instant): TownSnapshot = townOf(readAt).copy(
        lessons = lessonsWith(listOf(firstLesson, secondLesson, thirdLesson)),
        releasedLessons = listOf(released),
        nextStep = NextStep.ReleasedLesson(releasedLesson, PlacementBand.Second, position = 3),
    )

    @Test
    fun `a returning-words study sent from the status reads its refusal`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        towns.hold(HeldTown(releasedStepTown(clock.now()), gap = Duration.ZERO))
        shownOn(viewModel, TownStatusScreen.Report)
        towns.answerLesson(TownLessonResult.Refused(TownLessonRefusal.StudySlotBusy))

        viewModel.onIntent(TownStatusIntent.ReleasedLessonTapped(releasedLesson))
        runCurrent()

        assertEquals(
            TownUiState.LessonStartStatus.Refused(TownLessonRefusal.StudySlotBusy),
            (viewModel.state.value.dock as? TownStatusUiState.Dock.Step)?.lessonStart,
        )
    }

    @Test
    fun `a returning-words study with no town held sends nothing`() = runTest {
        val viewModel: TownStatusViewModel = statusOf(TestClock(testScheduler, deviceStart))
        shownOn(viewModel, TownStatusScreen.Report)

        viewModel.onIntent(TownStatusIntent.ReleasedLessonTapped(releasedLesson))
        runCurrent()

        assertEquals(emptyList<LessonId>(), towns.lessonStarts)
    }

    @Test
    fun `a returning-words study waits on its answer`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        towns.hold(HeldTown(releasedStepTown(clock.now()), gap = Duration.ZERO))
        shownOn(viewModel, TownStatusScreen.Report)

        viewModel.onIntent(TownStatusIntent.ReleasedLessonTapped(releasedLesson))
        runCurrent()

        assertEquals(
            TownStatusUiState.Go.Acts(NextStepCard.Action.StudyReleased(releasedLesson), isBusy = true),
            goOf(viewModel),
        )
    }

    @Test
    fun `the step's countdown follows the clock`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        towns.hold(HeldTown(townOf(clock.now()).copy(nextDueAt = clock.now() + 1.hours), gap = Duration.ZERO))
        shownOn(viewModel, TownStatusScreen.Report)

        passing(10.minutes)

        assertEquals(50.minutes, (viewModel.state.value.dock as? TownStatusUiState.Dock.Step)?.countdown?.remaining)
    }

    @Test
    fun `a caught-up step with a goal gives the goal's line`() = runTest {
        val clock = TestClock(testScheduler, deviceStart)
        val viewModel: TownStatusViewModel = statusOf(clock)
        towns.hold(HeldTown(townOf(clock.now()).copy(nextStep = NextStep.CaughtUp(schoolGoal)), gap = Duration.ZERO))

        shownOn(viewModel, TownStatusScreen.ReadsTown)

        assertEquals(
            TownStatusUiState.StepDetail.Goal(schoolGoal),
            (viewModel.state.value.dock as? TownStatusUiState.Dock.Step)?.detail,
        )
    }

    @Test
    fun `the Report's own step waits with the next review`() = runTest {
        val caughtUp: TownSnapshot = townOf(deviceStart).copy(nextDueAt = deviceStart + 1.hours)

        val go: TownStatusUiState.Go? = goShownOn(TownStatusScreen.Report, caughtUp)

        assertEquals(
            TownStatusUiState.Go.Blocked(NextStepCard.Action.GoToReport, TownStatusUiState.GoBlock.NextReview),
            go,
        )
    }

    @Test
    fun `the Report's own step waits with no reviews due`() = runTest {
        val go: TownStatusUiState.Go? = goShownOn(TownStatusScreen.Report, townOf(deviceStart))

        assertEquals(
            TownStatusUiState.Go.Blocked(NextStepCard.Action.GoToReport, TownStatusUiState.GoBlock.NoReviewsDue),
            go,
        )
    }

    @Test
    fun `the school's study acts in place`() = runTest {
        val go: TownStatusUiState.Go? = goShownOn(TownStatusScreen.School, studyTown(deviceStart))

        assertEquals(TownStatusUiState.Go.ActsInPlace(NextStepCard.Action.Study(number = 1)), go)
    }

    @Test
    fun `a running lesson the read does not hold waits as studying on the school`() = runTest {
        val go: TownStatusUiState.Go? = goShownOn(TownStatusScreen.School, strayRunningTown(deviceStart))

        assertEquals(
            TownStatusUiState.Go.Blocked(
                NextStepCard.Action.ReadWords(lesson = null),
                TownStatusUiState.GoBlock.Studying,
            ),
            go,
        )
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
        releasedLessons = emptyList(),
        dueHoldoutChecks = emptyList(),
        hasBandStarted = false,
        skills = emptyList(),
        learning = TownSnapshot.Learning(cap = 10, inLearning = 0, retainedWords = null),
        stableWordCount = 0,
        retainedWordCount = 0,
        lessonSlot = null,
        hiring = hiringOf(),
        job = null,
        nextStep = NextStep.CaughtUp(goal = null),
        tip = null,
        nextDueAt = null,
        readAt = readAt,
    )
}
