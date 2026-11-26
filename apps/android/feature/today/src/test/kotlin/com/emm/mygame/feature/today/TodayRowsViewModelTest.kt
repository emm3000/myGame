package com.emm.mygame.feature.today

import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.NeededWordKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.building.TownWorkRefusal
import com.emm.mygame.core.model.town.building.TownWorkResult
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.guidance.TownGoal
import com.emm.mygame.core.projection.town.ReadyTime
import com.emm.mygame.core.projection.town.building.BlockReason
import com.emm.mygame.core.projection.town.building.CostLine
import com.emm.mygame.core.projection.town.building.NextLevelLine
import com.emm.mygame.core.projection.town.building.Shortfall
import com.emm.mygame.core.projection.town.building.StartStatus
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import com.emm.mygame.core.testing.TestClock
import com.emm.mygame.core.testing.lessonsDone
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import kotlin.time.Duration.Companion.minutes

class TodayRowsViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    @Test
    fun `each next level the town can start is a row of You can do now`() = runTest {
        val viewModel: TodayViewModel = shownOn(townWith(nextLevelOf(TownBuildingKind.Farm, money = 50)))

        assertEquals(
            listOf(TodayUiState.CanDo(TownBuildingKind.Farm, levelTwoCosting(50, isShort = false))),
            contentOf(viewModel).canDo,
        )
    }

    @Test
    fun `the goal's building leads You can do now`() = runTest {
        val farmThenHomes: List<TownSnapshot.Building> = listOf(
            nextLevelOf(TownBuildingKind.Farm, money = 50),
            nextLevelOf(TownBuildingKind.Homes, money = 50),
        )

        val viewModel: TodayViewModel = shownOn(townWith(*farmThenHomes.toTypedArray(), nextStep = homesGoal))

        assertEquals(
            listOf(TownBuildingKind.Homes, TownBuildingKind.Farm),
            contentOf(viewModel).canDo.map(TodayUiState.CanDo::building),
        )
    }

    @Test
    fun `a next level the town cannot afford is Locked with the shortfall and when it is covered`() = runTest {
        val viewModel: TodayViewModel = shownOn(
            townWith(nextLevelOf(TownBuildingKind.Farm, money = 100), money = moneyHeld(40, ratePerHour = 60.0)),
        )

        assertEquals(
            listOf(
                TodayUiState.Locked(
                    building = TownBuildingKind.Farm,
                    next = levelTwoCosting(100, isShort = true),
                    block = BlockReason.Resources(
                        shortfalls = listOf(Shortfall(TownResourceKind.Money, 60)),
                        ready = ReadyTime(remaining = 60.minutes, readyAt = readAt + 60.minutes),
                    ),
                ),
            ),
            contentOf(viewModel).locked,
        )
    }

    @Test
    fun `a next level short of free people is Locked with the people needed and free`() = runTest {
        val viewModel: TodayViewModel = shownOn(townWith(nextLevelOf(TownBuildingKind.Farm, money = 50, people = 5)))

        assertEquals(
            listOf<BlockReason>(BlockReason.PeopleShort(needed = 5, free = 4)),
            contentOf(viewModel).locked.map(TodayUiState.Locked::block),
        )
    }

    @Test
    fun `a next level short of words is Locked with the words needed and held`() = runTest {
        val shortOfWords: TownSnapshot.WordsNeeded = TownSnapshot.WordsNeeded(5, NeededWordKind.Retained, held = 2)

        val viewModel: TodayViewModel = shownOn(
            townWith(nextLevelOf(TownBuildingKind.Homes, money = 50, wordsNeeded = shortOfWords)),
        )

        assertEquals(
            listOf<BlockReason>(BlockReason.WordsShort(needed = 5, held = 2, standing = NeededWordKind.Retained)),
            contentOf(viewModel).locked.map(TodayUiState.Locked::block),
        )
    }

    @Test
    fun `a hire, a job and a clean-up are never a row`() = runTest {
        val jobOut: TownSnapshot = newTown(nextStep = lessonsDone, job = jobOnTheWayLasting(5.minutes))

        val viewModel: TodayViewModel = shownOn(jobOut)

        assertEquals(emptyList<TodayUiState.CanDo>() to emptyList<TodayUiState.Locked>(), rowsOf(viewModel))
    }

    @Test
    fun `a locked row moves to You can do now once its shortfall is covered`() = runTest {
        val viewModel: TodayViewModel = shownOn(
            townWith(nextLevelOf(TownBuildingKind.Farm, money = 100), money = moneyHeld(40, ratePerHour = 60.0)),
        )

        advanceTimeBy(61.minutes)
        runCurrent()

        assertEquals(listOf(TownBuildingKind.Farm), contentOf(viewModel).canDo.map(TodayUiState.CanDo::building))
    }

    @Test
    fun `tapping a row's button starts that building's work`() = runTest {
        val viewModel: TodayViewModel = shownOn(townWith(nextLevelOf(TownBuildingKind.Farm, money = 50)))

        viewModel.onIntent(TodayIntent.BuildTapped(TownBuildingKind.Farm))
        runCurrent()

        assertEquals(listOf(TownBuildingKind.Farm), towns.starts)
    }

    @Test
    fun `a refused start stays beside the row that asked for it`() = runTest {
        val viewModel: TodayViewModel = shownOn(townWith(nextLevelOf(TownBuildingKind.Farm, money = 50)))
        towns.answerWork(TownWorkResult.Refused(TownWorkRefusal.NotEnoughResources))

        viewModel.onIntent(TodayIntent.BuildTapped(TownBuildingKind.Farm))
        runCurrent()

        assertEquals(
            StartStatus.Refused(TownBuildingKind.Farm, TownWorkRefusal.NotEnoughResources),
            contentOf(viewModel).build,
        )
    }

    private fun townWith(
        vararg buildings: TownSnapshot.Building,
        nextStep: NextStep = lessonsDone,
        money: TownSnapshot.Stock = moneyHeld(100),
    ): TownSnapshot = newTown(nextStep = nextStep, buildings = buildings.toList(), stocks = listOf(money))

    private fun levelTwoCosting(money: Long, isShort: Boolean): NextLevelLine = NextLevelLine(
        level = 2,
        costs = listOf(CostLine(TownResourceKind.Money, money, isShort = isShort)),
        duration = 3.minutes,
        people = 1,
        wordsNeeded = null,
    )

    private fun TestScope.shownOn(town: TownSnapshot): TodayViewModel {
        towns.answerRead(TownReadResult.Read(town))
        val viewModel: TodayViewModel = TodayViewModel(towns, FakeReportRepository(), TestClock(testScheduler, readAt))
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

    private fun rowsOf(viewModel: TodayViewModel): Pair<List<TodayUiState.CanDo>, List<TodayUiState.Locked>> =
        contentOf(viewModel).let { content: TodayUiState.Content -> content.canDo to content.locked }

    private companion object {
        val homesGoal: NextStep = NextStep.CaughtUp(
            reason = CaughtUpReason.LessonsDone,
            goal = TownGoal(
                position = 1,
                count = 3,
                building = TownBuildingKind.Homes,
                level = 2,
                state = TownGoal.State.Underway,
            ),
            text = null,
        )
    }
}
