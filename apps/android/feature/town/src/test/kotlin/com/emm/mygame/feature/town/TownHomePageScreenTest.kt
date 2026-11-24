package com.emm.mygame.feature.town

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.junit4.StateRestorationTester
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.TownRegistered
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.feature.town.guidance.ClosedGuidance
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration

@RunWith(RobolectricTestRunner::class)
class TownHomePageScreenTest : TownScreenFixture() {

    @Test
    fun `the town home opens on the goal's building`() {
        show(homeOn(NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal = factoryGoal, text = null)))

        tab("Fábrica").assertIsSelected()
    }

    @Test
    fun `the town home opens on the school when caught up with no goal`() {
        show(homeOn(NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal = null, text = null)))

        tab("Escuela").assertIsSelected()
    }

    @Test
    fun `the town home opens on the school while a lesson runs toward a goal`() {
        show(homeOn(NextStep.LessonRunning(goal = factoryGoal, text = null)))

        tab("Escuela").assertIsSelected()
    }

    @Test
    fun `the town home opens on the school on a step of learning`() {
        show(homeOn(NextStep.Reviews(count = 4, readFirst = emptyList())))

        tab("Escuela").assertIsSelected()
    }

    @Test
    fun `the town home opens on the school on every other step of learning`() {
        val steps: List<NextStep> = listOf(
            NextStep.LessonToStudy(LessonId("lesson-1")),
            NextStep.ReleasedLesson(LessonId("lesson-2"), com.emm.mygame.core.model.placement.PlacementBand.First, 1),
            NextStep.HoldoutCheck(
                com.emm.mygame.core.model.placement.PlacementBand.First,
                com.emm.mygame.core.model.holdout.HoldoutCheckWeek.entries.first(),
            ),
        )

        assertEquals(
            steps.map { TownBuildingKind.School },
            steps.map { step: NextStep -> homeOn(step).nextStepPlace },
        )
    }

    @Test
    fun `a later read keeps the page the player is on`() {
        val shown: MutableState<TownUiState> = mutableStateOf(riverton)
        showState(shown)
        tab("Granja").performScrollTo().performClick()

        shown.value = riverton.copy(nextStepPlace = TownBuildingKind.Factory, words = riverton.words.copy(stable = 9))
        composeRule.waitForIdle()

        tab("Granja").assertIsSelected()
    }

    @Test
    fun `keeps the page the player is on through a recreation`() {
        val restoration: StateRestorationTester = StateRestorationTester(composeRule)
        restoration.setContent { Screen(riverton) }
        tab("Granja").performScrollTo().performClick()

        restoration.emulateSavedInstanceStateRestore()

        tab("Granja").assertIsSelected()
    }

    private fun homeOn(step: NextStep): TownUiState.Content = townOf(nextStep = step).contentAt(
        now = readInstant,
        gap = Duration.ZERO,
        requests = TownRequests.none,
        registered = TownRegistered.nothing,
        hiringEntries = emptyMap(),
        closed = ClosedGuidance.none,
    )
}
