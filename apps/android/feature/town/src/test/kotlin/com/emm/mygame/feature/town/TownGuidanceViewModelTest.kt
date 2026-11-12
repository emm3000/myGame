package com.emm.mygame.feature.town

import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.TipKind
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownGoal
import com.emm.mygame.core.network.TownGuidanceResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class TownGuidanceViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val farmGoal: TownGoal = TownGoal(
        position = 1,
        count = 9,
        building = TownBuildingKind.Farm,
        level = 1,
        state = TownGoal.State.Underway,
    )

    private val townWithGoal: TownSnapshot = townOf(nextStep = NextStep.CaughtUp(farmGoal))

    private val townWithTip: TownSnapshot = townOf(tip = TipKind.WaitingList)

    private fun TestScope.townShowing(town: TownSnapshot): TownViewModel {
        towns.answerRead(TownReadResult.Read(town))
        val viewModel: TownViewModel = townViewModelOf(towns, readInstant)
        runCurrent()
        return viewModel
    }

    private fun TestScope.readAgain(viewModel: TownViewModel, town: TownSnapshot) {
        towns.answerRead(TownReadResult.Read(town.copy()))
        viewModel.onIntent(TownIntent.ScreenHidden)
        viewModel.onIntent(TownIntent.ScreenShown)
        runCurrent()
    }

    @Test
    fun `shows the next goal`() = runTest {
        val viewModel: TownViewModel = townShowing(townWithGoal)

        assertEquals(farmGoal, contentOf(viewModel).goal)
    }

    @Test
    fun `shows no goal when none is left`() = runTest {
        val viewModel: TownViewModel = townShowing(townOf(nextStep = NextStep.CaughtUp(goal = null)))

        assertEquals(null, contentOf(viewModel).goal)
    }

    @Test
    fun `hides the goal as soon as the guidance is closed`() = runTest {
        val viewModel: TownViewModel = townShowing(townWithGoal)

        viewModel.onIntent(TownIntent.GoalClosed)

        assertEquals(null, contentOf(viewModel).goal)
    }

    @Test
    fun `dismisses the guidance when the goal is closed`() = runTest {
        val viewModel: TownViewModel = townShowing(townWithGoal)
        towns.answerGuidance(TownGuidanceResult.Marked)

        viewModel.onIntent(TownIntent.GoalClosed)
        runCurrent()

        assertEquals(1, towns.dismissalCount)
    }

    @Test
    fun `dismisses the guidance once on a double tap`() = runTest {
        val viewModel: TownViewModel = townShowing(townWithGoal)
        towns.answerGuidance(TownGuidanceResult.Marked)
        towns.answerGuidance(TownGuidanceResult.Marked)

        viewModel.onIntent(TownIntent.GoalClosed)
        viewModel.onIntent(TownIntent.GoalClosed)
        runCurrent()

        assertEquals(1, towns.dismissalCount)
    }

    @Test
    fun `keeps a closed goal hidden when a read still names it`() = runTest {
        val viewModel: TownViewModel = townShowing(townWithGoal)
        towns.answerGuidance(TownGuidanceResult.Unreachable)
        viewModel.onIntent(TownIntent.GoalClosed)

        readAgain(viewModel, townWithGoal)

        assertEquals(null, contentOf(viewModel).goal)
    }

    @Test
    fun `shows the tip the api names`() = runTest {
        val viewModel: TownViewModel = townShowing(townWithTip)

        assertEquals(TipKind.WaitingList, contentOf(viewModel).tip)
    }

    @Test
    fun `shows a tip once and never again after close`() = runTest {
        val viewModel: TownViewModel = townShowing(townWithTip)
        towns.answerGuidance(TownGuidanceResult.Unreachable)
        viewModel.onIntent(TownIntent.TipClosed(TipKind.WaitingList))

        readAgain(viewModel, townWithTip)

        assertEquals(null, contentOf(viewModel).tip)
    }

    @Test
    fun `marks a closed tip seen`() = runTest {
        val viewModel: TownViewModel = townShowing(townWithTip)
        towns.answerGuidance(TownGuidanceResult.Marked)

        viewModel.onIntent(TownIntent.TipClosed(TipKind.WaitingList))
        runCurrent()

        assertEquals(listOf(TipKind.WaitingList), towns.seenTips)
    }

    @Test
    fun `closes a tip once on a double tap`() = runTest {
        val viewModel: TownViewModel = townShowing(townWithTip)
        towns.answerGuidance(TownGuidanceResult.Marked)
        towns.answerGuidance(TownGuidanceResult.Marked)

        viewModel.onIntent(TownIntent.TipClosed(TipKind.WaitingList))
        viewModel.onIntent(TownIntent.TipClosed(TipKind.WaitingList))
        runCurrent()

        assertEquals(listOf(TipKind.WaitingList), towns.seenTips)
    }

    @Test
    fun `shows the next tip a read names after a close`() = runTest {
        val viewModel: TownViewModel = townShowing(townWithTip)
        towns.answerGuidance(TownGuidanceResult.Marked)
        viewModel.onIntent(TownIntent.TipClosed(TipKind.WaitingList))

        readAgain(viewModel, townOf(tip = TipKind.Office))

        assertEquals(TipKind.Office, contentOf(viewModel).tip)
    }

    @Test
    fun `marks a tip seen again on the next read when the api could not be reached`() = runTest {
        val viewModel: TownViewModel = townShowing(townWithTip)
        towns.answerGuidance(TownGuidanceResult.Unreachable)
        viewModel.onIntent(TownIntent.TipClosed(TipKind.WaitingList))
        towns.answerGuidance(TownGuidanceResult.Marked)

        readAgain(viewModel, townWithTip)

        assertEquals(listOf(TipKind.WaitingList, TipKind.WaitingList), towns.seenTips)
    }

    @Test
    fun `dismisses the guidance again on the next read when the api could not be reached`() = runTest {
        val viewModel: TownViewModel = townShowing(townWithGoal)
        towns.answerGuidance(TownGuidanceResult.Unreachable)
        viewModel.onIntent(TownIntent.GoalClosed)
        towns.answerGuidance(TownGuidanceResult.Marked)

        readAgain(viewModel, townWithGoal)

        assertEquals(2, towns.dismissalCount)
    }

    @Test
    fun `marks a tip seen once across reads once the api has it`() = runTest {
        val viewModel: TownViewModel = townShowing(townWithTip)
        towns.answerGuidance(TownGuidanceResult.Marked)
        viewModel.onIntent(TownIntent.TipClosed(TipKind.WaitingList))

        readAgain(viewModel, townWithTip)
        readAgain(viewModel, townWithTip)

        assertEquals(listOf(TipKind.WaitingList), towns.seenTips)
    }

    @Test
    fun `sends no second close on a read while the first still waits`() = runTest {
        val viewModel: TownViewModel = townShowing(townWithGoal)
        viewModel.onIntent(TownIntent.GoalClosed)
        runCurrent()

        readAgain(viewModel, townWithGoal)

        assertEquals(1, towns.dismissalCount)
    }
}
