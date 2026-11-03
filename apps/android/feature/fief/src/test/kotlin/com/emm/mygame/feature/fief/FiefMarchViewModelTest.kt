package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.AwayMarch
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.MarchOrder
import com.emm.mygame.core.network.MarchRefusal
import com.emm.mygame.core.network.MarchResult
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import com.emm.mygame.core.projection.MarchPhase
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Rule
import org.junit.Test

class FiefMarchViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    @Test
    fun `draws an idle march slot while no march is away`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(marching(march = null)))

        viewModel.state.test {
            assertEquals(FiefUiState.MarchSlotLine.Idle, awaitContent().army?.march)
        }
    }

    @Test
    fun `draws the march outbound with its party, plot, loot and countdown to the return`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val outbound: AwayMarch = forageOfInfantry(count = 12, arrivesIn = 5.minutes, foragesFor = 60.minutes)
        fiefs.answerRead(FiefReadResult.Read(marching(outbound)))

        viewModel.state.test {
            assertEquals(
                FiefUiState.MarchSlotLine.Busy(
                    phase = MarchPhase.Outbound,
                    heading = FiefUiState.MarchHeading.Outbound,
                    units = listOf(UnitCount(UnitKind.Infantry, 12)),
                    target = PlotAddress(province = 1, plot = 7),
                    detail = null,
                    countdown = FiefUiState.MarchCountdown.Return,
                    remaining = 71.minutes,
                    loot = listOf(ResourceQuantity(ResourceKind.Wood, 42)),
                    departedAt = outbound.departedAt,
                ),
                awaitContent().army?.march,
            )
        }
    }

    @Test
    fun `turns the drawn phase to foraging at the arrival without a read`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(marching(forageOfInfantry(12, arrivesIn = 90.minutes, 60.minutes))))

        viewModel.state.test {
            awaitContentWhere { (it.army?.march as? FiefUiState.MarchSlotLine.Busy)?.phase == MarchPhase.Foraging }
        }
        assertEquals(1, fiefs.readCount)
    }

    @Test
    fun `counts down a founding on the way to its arrival`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val founding: AwayMarch = forageOfInfantry(1, arrivesIn = 5.minutes, 0.minutes, order = MarchOrder.Found)
        fiefs.answerRead(FiefReadResult.Read(marching(founding)))

        viewModel.state.test {
            assertEquals(5.minutes, busyMarch(awaitContent()).remaining)
        }
    }

    @Test
    fun `re-reads the fief at the march's return`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val returning: AwayMarch = forageOfInfantry(12, arrivesIn = (-10).minutes, foragesFor = 9.minutes)
        fiefs.answerRead(FiefReadResult.Read(marching(returning)))
        fiefs.answerRead(FiefReadResult.Read(marching(march = null)))

        viewModel.state.test {
            assertEquals(5.minutes, busyMarch(awaitContent()).remaining)
            awaitContentWhere { it.army?.march == FiefUiState.MarchSlotLine.Idle }
        }
        assertEquals(2, fiefs.readCount)
    }

    @Test
    fun `re-reads the fief when the screen is shown again after a march left from the map`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(marching(march = null)))
        fiefs.answerRead(FiefReadResult.Read(marching(forageOfInfantry(12, 5.minutes, foragesFor = 60.minutes))))

        viewModel.state.test {
            assertEquals(FiefUiState.MarchSlotLine.Idle, awaitContent().army?.march)
            viewModel.onIntent(FiefIntent.ScreenShown)
            assertEquals(MarchPhase.Outbound, busyMarch(awaitContent()).phase)
        }
    }

    @Test
    fun `reads the fief once when the screen is first shown`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        viewModel.onIntent(FiefIntent.ScreenShown)
        fiefs.answerRead(FiefReadResult.Read(marching(march = null)))

        viewModel.state.test {
            awaitContent()
        }
        assertEquals(1, fiefs.readCount)
    }

    @Test
    fun `offers the recall while the march forages`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(marching(forageOfInfantry(12, (-5).minutes, foragesFor = 60.minutes))))

        viewModel.state.test {
            assertEquals(true, busyMarch(awaitContent()).isRecallable)
        }
    }

    @Test
    fun `offers no recall once the march returns`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(marching(forageOfInfantry(12, (-10).minutes, foragesFor = 9.minutes))))

        viewModel.state.test {
            assertFalse(busyMarch(awaitContent()).isRecallable)
        }
    }

    @Test
    fun `posts the recall naming the instant the march departed`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val outbound: AwayMarch = forageOfInfantry(count = 12, arrivesIn = 5.minutes, foragesFor = 60.minutes)
        fiefs.answerRead(FiefReadResult.Read(marching(outbound)))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.RecallTapped(outbound.departedAt))
            awaitContentWhere { it.army?.recall == FiefUiState.RecallStatus.Waiting }
        }
        assertEquals(
            listOf(FakeFiefRepository.MarchRequest.Recall(FiefId(FIEF_ID), outbound.departedAt)),
            fiefs.marches,
        )
    }

    @Test
    fun `sends one recall at a time`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val outbound: AwayMarch = forageOfInfantry(count = 12, arrivesIn = 5.minutes, foragesFor = 60.minutes)
        fiefs.answerRead(FiefReadResult.Read(marching(outbound)))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.RecallTapped(outbound.departedAt))
            viewModel.onIntent(FiefIntent.RecallTapped(outbound.departedAt))
            awaitContentWhere { it.army?.recall == FiefUiState.RecallStatus.Waiting }
        }
        assertEquals(1, fiefs.marches.size)
    }

    @Test
    fun `draws the march the recall answers`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val outbound: AwayMarch = forageOfInfantry(count = 12, arrivesIn = 5.minutes, foragesFor = 60.minutes)
        val turnedBack: AwayMarch = outbound.copy(
            arrivesAt = firstReadAt,
            leavesAt = firstReadAt,
            returnsAt = firstReadAt + 1.minutes,
            recalledAt = firstReadAt,
        )
        fiefs.answerRead(FiefReadResult.Read(marching(outbound)))
        fiefs.answerMarch(MarchResult.Answered(marching(turnedBack)))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.RecallTapped(outbound.departedAt))
            val recalled: FiefUiState.Content = awaitContentWhere { busyMarch(it).phase == MarchPhase.Returning }
            assertEquals(
                1.minutes to FiefUiState.RecallStatus.Idle,
                busyMarch(recalled).remaining to recalled.army?.recall,
            )
        }
        assertEquals(1, fiefs.readCount)
    }

    @Test
    fun `projects the recall's answer at the clock the last read measured, not at its stored instant`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val foraging: AwayMarch = forageOfInfantry(count = 12, arrivesIn = (-5).minutes, foragesFor = 60.minutes)
        val turnedBack: AwayMarch = foraging.copy(
            leavesAt = firstReadAt,
            returnsAt = firstReadAt + 6.minutes,
            recalledAt = firstReadAt,
        )
        val storedBeforeTheDeparture: Instant = foraging.departedAt - 10.minutes
        fiefs.answerRead(FiefReadResult.Read(marching(foraging)))
        fiefs.answerMarch(MarchResult.Answered(marching(turnedBack, readAt = storedBeforeTheDeparture)))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.RecallTapped(foraging.departedAt))
            val recalled: FiefUiState.Content = awaitContentWhere { it.army?.recall == FiefUiState.RecallStatus.Idle }
            assertEquals(MarchPhase.Returning to 6.minutes, busyMarch(recalled).phase to busyMarch(recalled).remaining)
        }
    }

    @Test
    fun `draws the refusal of a march already returning`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val outbound: AwayMarch = forageOfInfantry(count = 12, arrivesIn = 5.minutes, foragesFor = 60.minutes)
        fiefs.answerRead(FiefReadResult.Read(marching(outbound)))
        fiefs.answerMarch(MarchResult.Refused(MarchRefusal.MarchAlreadyReturning))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.RecallTapped(outbound.departedAt))
            awaitContentWhere {
                it.army?.recall == FiefUiState.RecallStatus.Refused(MarchRefusal.MarchAlreadyReturning)
            }
        }
        assertEquals(1, fiefs.readCount)
    }

    @Test
    fun `re-reads the fief when the recall names a finished march`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val outbound: AwayMarch = forageOfInfantry(count = 12, arrivesIn = 5.minutes, foragesFor = 60.minutes)
        fiefs.answerRead(FiefReadResult.Read(marching(outbound)))
        fiefs.answerMarch(MarchResult.Refused(MarchRefusal.MarchNotFound))
        fiefs.answerRead(FiefReadResult.Read(marching(march = null)))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.RecallTapped(outbound.departedAt))
            val reread: FiefUiState.Content = awaitContentWhere { it.army?.march == FiefUiState.MarchSlotLine.Idle }
            assertEquals(FiefUiState.RecallStatus.Refused(MarchRefusal.MarchNotFound), reread.army?.recall)
        }
        assertEquals(2, fiefs.readCount)
    }

    @Test
    fun `keeps an outage of the recall beside the slot`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val outbound: AwayMarch = forageOfInfantry(count = 12, arrivesIn = 5.minutes, foragesFor = 60.minutes)
        fiefs.answerRead(FiefReadResult.Read(marching(outbound)))
        fiefs.answerMarch(MarchResult.Unreachable)

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.RecallTapped(outbound.departedAt))
            awaitContentWhere { it.army?.recall == FiefUiState.RecallStatus.Unreachable }
        }
    }

    private fun busyMarch(content: FiefUiState.Content): FiefUiState.MarchSlotLine.Busy =
        content.army?.march as FiefUiState.MarchSlotLine.Busy

    private fun marching(march: AwayMarch?, readAt: Instant = firstReadAt): FiefSnapshot = fief(
        readAt = readAt,
        buildings = listOf(barracks(level = 1)),
        units = army(infantryAtHome = 4, infantryAway = march?.units?.first()?.count ?: 0),
        march = march,
    )
}
