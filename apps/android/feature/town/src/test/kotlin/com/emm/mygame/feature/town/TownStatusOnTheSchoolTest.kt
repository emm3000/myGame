package com.emm.mygame.feature.town

import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import com.emm.mygame.core.testing.TestClock
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

@OptIn(ExperimentalCoroutinesApi::class)
class TownStatusOnTheSchoolTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val runningLesson: LessonId = LessonId("lesson-2")

    private val finish: Instant = readInstant + 10.minutes

    private val studyingTown: TownSnapshot = townOf(
        lessonSlot = TownSnapshot.LessonSlot(runningLesson, readInstant, finish),
        nextStep = NextStep.LessonRunning(goal = null, text = null),
        readAt = readInstant,
    )

    private fun TestScope.statusShownOn(screen: TownStatusScreen): TownStatusViewModel {
        val viewModel = TownStatusViewModel(towns, TestClock(testScheduler, readInstant))
        backgroundScope.launch(start = CoroutineStart.UNDISPATCHED) {
            try {
                awaitCancellation()
            } finally {
                viewModel.viewModelScope.cancel()
            }
        }
        towns.answerRead(TownReadResult.Read(studyingTown))
        viewModel.onIntent(TownStatusIntent.ScreenShown(screen))
        runCurrent()
        return viewModel
    }

    private fun TestScope.finishDrawnOn(viewModel: TownStatusViewModel, screen: TownStatusScreen): Instant? {
        viewModel.onIntent(TownStatusIntent.ScreenShown(screen))
        runCurrent()
        return viewModel.state.value.running?.finishesAt
    }

    private fun TestScope.schoolDraws(viewModel: TownStatusViewModel, lesson: LessonId?) {
        viewModel.onIntent(TownStatusIntent.SchoolLessonDrawn(lesson))
        runCurrent()
    }

    @Test
    fun `draws no running lesson on the school, whose Studying section states it`() = runTest {
        val viewModel: TownStatusViewModel = statusShownOn(TownStatusScreen.School)

        schoolDraws(viewModel, runningLesson)

        assertNull(viewModel.state.value.running)
    }

    @Test
    fun `keeps the running lesson's line on the school while the school has drawn no town`() = runTest {
        val viewModel: TownStatusViewModel = statusShownOn(TownStatusScreen.School)

        schoolDraws(viewModel, lesson = null)

        assertEquals(finish, viewModel.state.value.running?.finishesAt)
    }

    @Test
    fun `keeps the running lesson's line on the school while the school draws another lesson`() = runTest {
        val viewModel: TownStatusViewModel = statusShownOn(TownStatusScreen.School)

        schoolDraws(viewModel, LessonId("lesson-1"))

        assertEquals(finish, viewModel.state.value.running?.finishesAt)
    }

    @Test
    fun `keeps the running lesson's line off the school when the school reports drawing it`() = runTest {
        val viewModel: TownStatusViewModel = statusShownOn(TownStatusScreen.ReadsTown)

        schoolDraws(viewModel, runningLesson)

        assertEquals(finish, viewModel.state.value.running?.finishesAt)
    }

    @Test
    fun `draws the running lesson on returning to the school until the school draws it again`() = runTest {
        val viewModel: TownStatusViewModel = statusShownOn(TownStatusScreen.School)
        schoolDraws(viewModel, runningLesson)
        finishDrawnOn(viewModel, TownStatusScreen.ReadsTown)

        val drawn: Instant? = finishDrawnOn(viewModel, TownStatusScreen.School)

        assertEquals(finish, drawn)
    }

    @Test
    fun `keeps the running lesson hidden when the school is shown again without leaving it`() = runTest {
        val viewModel: TownStatusViewModel = statusShownOn(TownStatusScreen.School)
        schoolDraws(viewModel, runningLesson)
        viewModel.onIntent(TownStatusIntent.ScreenHidden)

        val drawn: Instant? = finishDrawnOn(viewModel, TownStatusScreen.School)

        assertNull(drawn)
    }

    @Test
    fun `still draws the running lesson on every signed-in screen but the school`() = runTest {
        val viewModel: TownStatusViewModel = statusShownOn(TownStatusScreen.ReadsNoTown)
        val otherScreens: List<TownStatusScreen> = listOf(
            TownStatusScreen.ReadsTown,
            TownStatusScreen.ReadsNoTown,
            TownStatusScreen.Report,
            TownStatusScreen.Reviews,
            TownStatusScreen.LessonWords(runningLesson),
        )

        val drawn: List<Instant?> = otherScreens.map { screen: TownStatusScreen -> finishDrawnOn(viewModel, screen) }

        assertEquals(List(otherScreens.size) { finish }, drawn)
    }

    @Test
    fun `draws the running lesson again on leaving the school`() = runTest {
        val viewModel: TownStatusViewModel = statusShownOn(TownStatusScreen.School)
        schoolDraws(viewModel, runningLesson)

        val drawn: Instant? = finishDrawnOn(viewModel, TownStatusScreen.LessonWords(runningLesson))

        assertEquals(finish, drawn)
    }
}
