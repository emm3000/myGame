package com.emm.mygame.feature.map

import com.emm.mygame.core.network.CleanUpQuoteResult
import com.emm.mygame.core.network.JobTarget
import com.emm.mygame.core.network.RegionMap
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownJobRefusal
import com.emm.mygame.core.network.TownJobResult
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.WasteSize
import com.emm.mygame.core.testing.FakeRegionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

class MapCleanUpViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val wasteMap: RegionMap = regionMapOf(
        sites = listOf(
            RegionMap.Site(site = 1, town = null, waste = null),
            wasteSiteOf(site = 4, size = WasteSize.Medium, waste = 12),
        ),
    )

    private val cleanUpFor: FakeRegionRepository.CleanUpRequest = FakeRegionRepository.CleanUpRequest(
        target = JobTarget(area = 1, site = 4),
        team = mapOf(TownHireKind.Worker to 3, TownHireKind.Truck to 1),
    )

    private val pay: Map<TownResourceKind, Long> = mapOf(
        TownResourceKind.Money to 24L,
        TownResourceKind.Food to 0L,
        TownResourceKind.Power to 0L,
        TownResourceKind.Material to 36L,
    )

    private val noPay: Map<TownResourceKind, Long> = TownResourceKind.entries.associateWith { 0L }

    private fun TestScope.cleanUpFilled(
        town: TownSnapshot = townOf(),
        workers: String = "3",
        trucks: String = "1",
    ): MapViewModel {
        val viewModel: MapViewModel = mapReading(towns, town = town, map = wasteMap)
        viewModel.onIntent(MapIntent.SendTeamTapped(site = 4))
        viewModel.onIntent(MapIntent.JobEntryChanged(MapIntent.JobField.Workers, workers))
        viewModel.onIntent(MapIntent.JobEntryChanged(MapIntent.JobField.Trucks, trucks))
        return viewModel
    }

    private fun cleanUpFormOf(viewModel: MapViewModel): MapUiState.CleanUpForm? =
        contentOf(viewModel).form as? MapUiState.CleanUpForm

    @Test
    fun `draws each waste site with its size and its waste`() = runTest {
        val viewModel: MapViewModel = mapReading(towns, map = wasteMap)

        assertEquals(
            listOf(
                MapUiState.SiteRow.Free(site = 1),
                MapUiState.SiteRow.Waste(site = 4, size = WasteSize.Medium, waste = 12),
            ),
            contentOf(viewModel).sites,
        )
    }

    @Test
    fun `opens the clean-up form of a waste site with a team of nobody`() = runTest {
        val viewModel: MapViewModel = mapReading(towns, town = townOf(workers = 3, trucks = 1), map = wasteMap)

        viewModel.onIntent(MapIntent.SendTeamTapped(site = 4))

        assertEquals(
            MapUiState.CleanUpForm(
                site = 4,
                workers = "0",
                trucks = "0",
                workersAtHome = 3,
                trucksAtHome = 1,
                block = MapUiState.JobBlock.InvalidTeam,
                quote = null,
            ),
            contentOf(viewModel).form,
        )
    }

    @Test
    fun `asks the clean-up quote of the team on a waste site`() = runTest {
        cleanUpFilled()
        runCurrent()

        assertEquals(cleanUpFor, towns.regions.cleanUpQuotes.last())
        assertEquals(emptyList<FakeRegionRepository.JobRequest>(), towns.regions.quotes)
    }

    @Test
    fun `asks no clean-up quote while the team is empty`() = runTest {
        cleanUpFilled(workers = "0", trucks = "0")
        runCurrent()

        assertEquals(emptyList<FakeRegionRepository.CleanUpRequest>(), towns.regions.cleanUpQuotes)
    }

    @Test
    fun `draws the strength, the waste and the pay of a team that covers the waste`() = runTest {
        val viewModel: MapViewModel = cleanUpFilled()
        towns.regions.answerCleanUpQuote(
            cleanUpFor,
            CleanUpQuoteResult.Quoted(strength = 12, waste = 12, pay = pay, covers = true),
        )
        runCurrent()

        assertEquals(
            MapUiState.CleanUpQuote.Quoted(
                strength = 12,
                waste = 12,
                pay = listOf(
                    MapUiState.PayLine(TownResourceKind.Money, 24L),
                    MapUiState.PayLine(TownResourceKind.Material, 36L),
                ),
                isShort = false,
            ),
            cleanUpFormOf(viewModel)?.quote,
        )
    }

    @Test
    fun `reads whether the team covers the waste from the api, never from its strength`() = runTest {
        val viewModel: MapViewModel = cleanUpFilled()
        towns.regions.answerCleanUpQuote(
            cleanUpFor,
            CleanUpQuoteResult.Quoted(strength = 30, waste = 4, pay = noPay, covers = false),
        )
        runCurrent()

        assertEquals(
            MapUiState.CleanUpQuote.Quoted(strength = 30, waste = 4, pay = emptyList(), isShort = true),
            cleanUpFormOf(viewModel)?.quote,
        )
    }

    @Test
    fun `warns when the team cannot cover the waste`() = runTest {
        val viewModel: MapViewModel = cleanUpFilled()
        towns.regions.answerCleanUpQuote(
            cleanUpFor,
            CleanUpQuoteResult.Quoted(strength = 8, waste = 12, pay = noPay, covers = false),
        )
        runCurrent()

        assertEquals(
            MapUiState.CleanUpQuote.Quoted(strength = 8, waste = 12, pay = emptyList(), isShort = true),
            cleanUpFormOf(viewModel)?.quote,
        )
    }

    @Test
    fun `asks the clean-up quote again after the server could not be reached`() = runTest {
        val viewModel: MapViewModel = cleanUpFilled()
        towns.regions.answerCleanUpQuote(cleanUpFor, CleanUpQuoteResult.Unreachable)
        runCurrent()

        advanceTimeBy(5.seconds)
        runCurrent()
        towns.regions.answerCleanUpQuote(
            cleanUpFor,
            CleanUpQuoteResult.Quoted(strength = 12, waste = 12, pay = pay, covers = true),
        )
        runCurrent()

        val asked: Int = towns.regions.cleanUpQuotes.count { request: FakeRegionRepository.CleanUpRequest ->
            request == cleanUpFor
        }
        assertEquals(2, asked)
        assertEquals(12, (cleanUpFormOf(viewModel)?.quote as? MapUiState.CleanUpQuote.Quoted)?.strength)
    }

    @Test
    fun `draws the api's refusal of a clean-up quote`() = runTest {
        val viewModel: MapViewModel = cleanUpFilled()
        towns.regions.answerCleanUpQuote(cleanUpFor, CleanUpQuoteResult.Refused(TownJobRefusal.NoWasteYet))
        runCurrent()

        assertEquals(MapUiState.CleanUpQuote.Refused(TownJobRefusal.NoWasteYet), cleanUpFormOf(viewModel)?.quote)
    }

    @Test
    fun `sends a clean-up from a waste site`() = runTest {
        val viewModel: MapViewModel = cleanUpFilled()

        viewModel.onIntent(MapIntent.SendTapped)
        runCurrent()

        assertEquals(listOf(cleanUpFor), towns.regions.cleanUpSends)
        assertEquals(emptyList<FakeRegionRepository.JobRequest>(), towns.regions.jobSends)
    }

    @Test
    fun `sends a clean-up once on a double tap`() = runTest {
        val viewModel: MapViewModel = cleanUpFilled()

        viewModel.onIntent(MapIntent.SendTapped)
        viewModel.onIntent(MapIntent.SendTapped)
        runCurrent()

        assertEquals(1, towns.regions.cleanUpSends.size)
    }

    @Test
    fun `sends a team too small for the waste`() = runTest {
        val viewModel: MapViewModel = cleanUpFilled(workers = "1", trucks = "0")
        towns.regions.answerCleanUpQuote(
            cleanUpFor.copy(team = mapOf(TownHireKind.Worker to 1, TownHireKind.Truck to 0)),
            CleanUpQuoteResult.Quoted(strength = 2, waste = 12, pay = noPay, covers = false),
        )
        runCurrent()

        viewModel.onIntent(MapIntent.SendTapped)
        runCurrent()

        assertEquals(1, towns.regions.cleanUpSends.size)
    }

    @Test
    fun `draws the api's refusal of a clean-up under the form`() = runTest {
        val viewModel: MapViewModel = cleanUpFilled()
        towns.regions.answerJob(TownJobResult.Refused(TownJobRefusal.NotAWasteSite))

        viewModel.onIntent(MapIntent.SendTapped)
        runCurrent()

        assertEquals(
            MapUiState.SendRequest.Refused(site = 4, refusal = TownJobRefusal.NotAWasteSite),
            contentOf(viewModel).send,
        )
    }

    @Test
    fun `closes the form once the api takes the clean-up`() = runTest {
        val viewModel: MapViewModel = cleanUpFilled()
        towns.regions.answerJob(TownJobResult.Answered(townOf(job = cleanUpOf())))

        viewModel.onIntent(MapIntent.SendTapped)
        runCurrent()

        assertNull(contentOf(viewModel).form)
    }

    @Test
    fun `shows a clean-up out with its waste and its pay`() = runTest {
        val viewModel: MapViewModel = mapReading(towns, town = townOf(job = cleanUpOf()), map = wasteMap)

        assertEquals(
            MapUiState.JobKind.CleanUp(waste = 12, outcome = null),
            contentOf(viewModel).jobOut?.kind,
        )
    }

    @Test
    fun `warns while a clean-up with no pay is on the way`() = runTest {
        val viewModel: MapViewModel = mapReading(towns, town = townOf(job = cleanUpOf(pay = noPay)), map = wasteMap)

        assertEquals(
            MapUiState.JobKind.CleanUp(waste = 12, outcome = MapUiState.CleanUpOutcome.Short),
            contentOf(viewModel).jobOut?.kind,
        )
    }

    @Test
    fun `shows a clean-up done coming back with its pay`() = runTest {
        val done: TownSnapshot.Job = cleanUpOf(phase = TownSnapshot.JobPhase.Returning)
        val viewModel: MapViewModel = mapReading(towns, town = townOf(job = done), map = wasteMap)

        assertEquals(
            MapUiState.JobKind.CleanUp(waste = 12, outcome = MapUiState.CleanUpOutcome.Cleaned),
            contentOf(viewModel).jobOut?.kind,
        )
    }

    @Test
    fun `shows a clean-up failed coming back with no pay`() = runTest {
        val failed: TownSnapshot.Job = cleanUpOf(phase = TownSnapshot.JobPhase.Returning, pay = noPay)
        val viewModel: MapViewModel = mapReading(towns, town = townOf(job = failed), map = wasteMap)

        assertEquals(
            MapUiState.JobKind.CleanUp(waste = 12, outcome = MapUiState.CleanUpOutcome.NotCleaned),
            contentOf(viewModel).jobOut?.kind,
        )
    }

    @Test
    fun `draws no outcome for a clean-up called back`() = runTest {
        val calledBack: TownSnapshot.Job = cleanUpOf(
            phase = TownSnapshot.JobPhase.Returning,
            pay = noPay,
            calledBackAt = readInstant + 5.minutes,
        )
        val viewModel: MapViewModel = mapReading(towns, town = townOf(job = calledBack), map = wasteMap)

        assertEquals(MapUiState.JobKind.CleanUp(waste = 12, outcome = null), contentOf(viewModel).jobOut?.kind)
    }

    @Test
    fun `shows a job out as a job`() = runTest {
        val viewModel: MapViewModel = mapReading(towns, town = townOf(job = jobOf()), map = wasteMap)

        assertEquals(MapUiState.JobKind.Job, contentOf(viewModel).jobOut?.kind)
    }
}
