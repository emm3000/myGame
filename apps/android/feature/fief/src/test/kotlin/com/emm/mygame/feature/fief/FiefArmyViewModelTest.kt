package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.Peasants
import com.emm.mygame.core.network.RecruitOrder
import com.emm.mygame.core.network.RecruitRefusal
import com.emm.mygame.core.network.RecruitResult
import com.emm.mygame.core.network.ResourceCost
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.StoredResource
import com.emm.mygame.core.network.UnitKind
import com.emm.mygame.core.network.UnitState
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

class FiefArmyViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    @Test
    fun `hides the army section below barracks level 1`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(buildings = listOf(barracks(level = 0)))))

        viewModel.state.test {
            assertNull(awaitContent().army)
        }
    }

    @Test
    fun `draws an idle levy slot from barracks level 1`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1)))

        viewModel.state.test {
            assertEquals(FiefUiState.LevySlotLine.Idle, awaitContent().army?.slot)
        }
    }

    @Test
    fun `draws the unit kinds in the contract's order`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1)))

        viewModel.state.test {
            assertEquals(
                listOf(UnitKind.Infantry, UnitKind.Cavalry, UnitKind.Archer, UnitKind.Settler),
                awaitContent().army?.units?.map { it.kind },
            )
        }
    }

    @Test
    fun `draws the units at home apart from the ones on the march`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val marchingArmy: FiefSnapshot = builtBarracks(level = 1, units = army(infantryAtHome = 12, infantryAway = 5))
        fiefs.answerRead(FiefReadResult.Read(marchingArmy))

        viewModel.state.test {
            val infantry: FiefUiState.UnitCard? = awaitContent().army?.units?.first()
            assertEquals(12 to 5, infantry?.atHome to infantry?.away)
        }
    }

    @Test
    fun `locks a kind above the built barracks level`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1)))

        viewModel.state.test {
            assertEquals(
                FiefUiState.UnitCard.Locked(
                    kind = UnitKind.Cavalry,
                    atHome = 0,
                    away = 0,
                    requiredLevel = 3,
                    builtLevel = 1,
                ),
                awaitContent().army?.units?.get(1),
            )
        }
    }

    @Test
    fun `draws the cost, peasants and duration of the count entered`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1)))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.RecruitEntryChanged(UnitKind.Infantry, "3"))
            assertEquals(
                FiefUiState.RecruitLine(
                    count = 3,
                    costs = listOf(
                        FiefUiState.CostLine(ResourceKind.Wood, 60, isShort = false),
                        FiefUiState.CostLine(ResourceKind.Iron, 30, isShort = true),
                        FiefUiState.CostLine(ResourceKind.Food, 90, isShort = true),
                    ),
                    peasants = 3,
                    isShortOfPeasants = false,
                    duration = 204.seconds,
                ),
                openInfantry(awaitContentWhere { openInfantry(it).entry == "3" }).order,
            )
        }
    }

    @Test
    fun `checks the peasants of a levy against the lowest free count`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val dippingPeasants: Peasants = Peasants(free = 10, supplied = 10, lowestFree = 2)
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1, peasants = dippingPeasants, plenty = true)))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.RecruitEntryChanged(UnitKind.Infantry, "3"))
            val entered: FiefUiState.UnitCard.Open = openInfantry(awaitContentWhere { openInfantry(it).entry == "3" })
            assertEquals(
                FiefUiState.BlockReason.Peasants(needed = 3, free = 2) to true,
                entered.block to entered.order?.isShortOfPeasants,
            )
        }
    }

    @Test
    fun `blocks every kind while a levy is running`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val levy: RecruitOrder = levyOfInfantry(count = 12, delivered = 4, startedBefore = 270.seconds)
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1, recruitOrder = levy, plenty = true)))

        viewModel.state.test {
            assertEquals(FiefUiState.RecruitBlock.LevyRunning, openInfantry(awaitContent()).block)
        }
    }

    @Test
    fun `blocks a count short of resources with the shortfall`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1)))

        viewModel.state.test {
            assertEquals(
                FiefUiState.BlockReason.Resources(
                    listOf(
                        FiefUiState.Shortfall(ResourceKind.Iron, 10),
                        FiefUiState.Shortfall(ResourceKind.Food, 30),
                    ),
                    ready = null,
                ),
                openInfantry(awaitContent()).block,
            )
        }
    }

    @Test
    fun `reads lista with the clock on a unit card when only resources are short`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val ironComing: FiefSnapshot = builtBarracks(level = 1, plenty = true).let { barracksBuilt: FiefSnapshot ->
            barracksBuilt.copy(
                resources = barracksBuilt.resources.map { resource: StoredResource ->
                    if (resource.kind == ResourceKind.Iron) resource.copy(amount = 0, ratePerHour = 5.0) else resource
                },
            )
        }
        fiefs.answerRead(FiefReadResult.Read(ironComing))

        viewModel.state.test {
            assertEquals(
                FiefUiState.BlockReason.Resources(
                    shortfalls = listOf(FiefUiState.Shortfall(ResourceKind.Iron, 10)),
                    ready = FiefUiState.ReadyHour.AtClock(
                        readyAt = Instant.parse("1970-01-01T02:17:00Z"),
                        remaining = 2.hours + 20.seconds,
                    ),
                ),
                openInfantry(awaitContent()).block,
            )
        }
    }

    @Test
    fun `leaves a count the fief can afford unblocked`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1, plenty = true)))

        viewModel.state.test {
            assertNull(openInfantry(awaitContent()).block)
        }
    }

    @Test
    fun `names the running levy before an invalid count`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val levy: RecruitOrder = levyOfInfantry(count = 12, delivered = 4, startedBefore = 270.seconds)
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1, recruitOrder = levy)))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.RecruitEntryChanged(UnitKind.Infantry, ""))
            val blank: FiefUiState.UnitCard.Open = openInfantry(awaitContentWhere { openInfantry(it).entry == "" })
            assertEquals(FiefUiState.RecruitBlock.LevyRunning, blank.block)
        }
    }

    @Test
    fun `names the peasants before the resources`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val fewPeasants: Peasants = Peasants(free = 10, supplied = 10, lowestFree = 0)
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1, peasants = fewPeasants)))

        viewModel.state.test {
            assertEquals(FiefUiState.BlockReason.Peasants(needed = 1, free = 0), openInfantry(awaitContent()).block)
        }
    }

    @Test
    fun `sends nothing for a count that is not a whole number of at least 1`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1)))
        val entries: List<String> = listOf("", "0", "-2", "1.5")

        viewModel.state.test {
            awaitContent()
            val blocks: List<FiefUiState.RecruitBlock?> = entries.map { entry: String ->
                viewModel.onIntent(FiefIntent.RecruitEntryChanged(UnitKind.Infantry, entry))
                viewModel.onIntent(FiefIntent.RecruitTapped(UnitKind.Infantry))
                openInfantry(awaitContentWhere { openInfantry(it).entry == entry }).block
            }
            assertEquals(List(entries.size) { FiefUiState.RecruitBlock.InvalidCount }, blocks)
        }
        assertEquals(emptyList<FakeFiefRepository.RecruitRequest>(), fiefs.recruits)
    }

    @Test
    fun `posts the kind and the count once while the first levy waits`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1)))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.RecruitEntryChanged(UnitKind.Infantry, "12"))
            viewModel.onIntent(FiefIntent.RecruitTapped(UnitKind.Infantry))
            viewModel.onIntent(FiefIntent.RecruitTapped(UnitKind.Infantry))
            val asked: FiefUiState.Content = awaitContentWhere { it.army?.recruit != FiefUiState.RecruitStatus.Idle }
            assertEquals(FiefUiState.RecruitStatus.Waiting, asked.army?.recruit)
        }
        assertEquals(
            listOf(FakeFiefRepository.RecruitRequest.Place(FiefId(FIEF_ID), UnitKind.Infantry, 12)),
            fiefs.recruits,
        )
    }

    @Test
    fun `draws the levy the api answers`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1)))
        val levy: RecruitOrder = levyOfInfantry(count = 12, delivered = 0, startedBefore = 0.minutes)
        fiefs.answerRecruit(RecruitResult.Answered(builtBarracks(level = 1, recruitOrder = levy)))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.RecruitTapped(UnitKind.Infantry))
            val answered: FiefUiState.Content = awaitContentWhere { it.army?.slot is FiefUiState.LevySlotLine.Busy }
            assertEquals(FiefUiState.RecruitStatus.Idle, answered.army?.recruit)
        }
        assertEquals(1, fiefs.readCount)
    }

    @Test
    fun `projects the delivered count between reads`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val levy: RecruitOrder = levyOfInfantry(count = 12, delivered = 4, startedBefore = 270.seconds)
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1, recruitOrder = levy)))

        viewModel.state.test {
            awaitContent()
            advanceTimeBy(2.minutes)
            runCurrent()
            assertEquals(6, busyLevy(expectMostRecentItem() as FiefUiState.Content).delivered)
        }
    }

    @Test
    fun `adds the units delivered since the read to the ones at home`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val levy: RecruitOrder = levyOfInfantry(count = 12, delivered = 4, startedBefore = 270.seconds)
        val fourAtHome: FiefSnapshot = builtBarracks(level = 1, units = army(infantryAtHome = 4), recruitOrder = levy)
        fiefs.answerRead(FiefReadResult.Read(fourAtHome))

        viewModel.state.test {
            awaitContent()
            advanceTimeBy(2.minutes)
            runCurrent()
            assertEquals(6, (expectMostRecentItem() as FiefUiState.Content).army?.units?.first()?.atHome)
        }
    }

    @Test
    fun `re-reads the fief when the levy ends`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val levy: RecruitOrder = levyOfInfantry(count = 12, delivered = 11, startedBefore = 11.minutes)
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1, recruitOrder = levy)))
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1, units = army(infantryAtHome = 12))))

        viewModel.state.test {
            assertEquals(1.minutes, busyLevy(awaitContent()).remaining)
            awaitContentWhere { it.army?.slot == FiefUiState.LevySlotLine.Idle }
        }
        assertEquals(2, fiefs.readCount)
    }

    @Test
    fun `draws the refund of the units not yet delivered`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val levy: RecruitOrder = levyOfInfantry(count = 12, delivered = 4, startedBefore = 270.seconds)
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1, recruitOrder = levy)))

        viewModel.state.test {
            val slot: FiefUiState.LevySlotLine.Busy = busyLevy(awaitContent())
            assertEquals(
                8 to listOf(
                    ResourceCost(ResourceKind.Wood, 160),
                    ResourceCost(ResourceKind.Iron, 80),
                    ResourceCost(ResourceKind.Food, 240),
                ),
                slot.undelivered to slot.refund,
            )
        }
    }

    @Test
    fun `sends the cancel naming the unit and the instant the levy started`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val levy: RecruitOrder = levyOfInfantry(count = 12, delivered = 4, startedBefore = 270.seconds)
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1, recruitOrder = levy)))
        fiefs.answerRecruit(RecruitResult.Answered(builtBarracks(level = 1)))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.RecruitCancelTapped(UnitKind.Infantry, levy.startedAt))
            awaitContentWhere { it.army?.slot == FiefUiState.LevySlotLine.Idle }
        }
        assertEquals(
            listOf(FakeFiefRepository.RecruitRequest.Cancel(FiefId(FIEF_ID), UnitKind.Infantry, levy.startedAt)),
            fiefs.recruits,
        )
    }

    @Test
    fun `re-reads the fief when the cancel names a finished levy`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val levy: RecruitOrder = levyOfInfantry(count = 12, delivered = 4, startedBefore = 270.seconds)
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1, recruitOrder = levy)))
        fiefs.answerRecruit(RecruitResult.Refused(RecruitRefusal.RecruitOrderNotFound))
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 1, units = army(infantryAtHome = 12))))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.RecruitCancelTapped(UnitKind.Infantry, levy.startedAt))
            val reread: FiefUiState.Content = awaitContentWhere { it.army?.slot == FiefUiState.LevySlotLine.Idle }
            assertEquals(
                FiefUiState.RecruitStatus.Refused(RecruitRefusal.RecruitOrderNotFound, UnitKind.Infantry, 1),
                reread.army?.recruit,
            )
        }
        assertEquals(2, fiefs.readCount)
    }

    @Test
    fun `keeps a refusal beside the section with the level the kind requires`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(builtBarracks(level = 3)))
        fiefs.answerRecruit(RecruitResult.Refused(RecruitRefusal.BarracksTooLow))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.RecruitTapped(UnitKind.Cavalry))
            assertEquals(
                FiefUiState.RecruitStatus.Refused(RecruitRefusal.BarracksTooLow, UnitKind.Cavalry, 3),
                awaitContentWhere { it.army?.recruit is FiefUiState.RecruitStatus.Refused }.army?.recruit,
            )
        }
        assertEquals(1, fiefs.readCount)
    }

    private fun builtBarracks(
        level: Int,
        units: List<UnitState> = army(),
        recruitOrder: RecruitOrder? = null,
        peasants: Peasants = Peasants(free = 10, supplied = 10, lowestFree = 10),
        plenty: Boolean = false,
    ): FiefSnapshot = fief(
        resources = if (plenty) plentyOfEverything() else listOf(wood(amount = 500, ratePerHour = 60.0)),
        buildings = listOf(barracks(level = level)),
        peasants = peasants,
        units = units,
        recruitOrder = recruitOrder,
    )

    private fun plentyOfEverything(): List<StoredResource> = ResourceKind.entries.map { kind: ResourceKind ->
        StoredResource(kind, amount = 900, ratePerHour = 0.0, capacity = 1000)
    }

    private fun openInfantry(content: FiefUiState.Content): FiefUiState.UnitCard.Open =
        content.army?.units?.first() as FiefUiState.UnitCard.Open

    private fun busyLevy(content: FiefUiState.Content): FiefUiState.LevySlotLine.Busy =
        content.army?.slot as FiefUiState.LevySlotLine.Busy
}
